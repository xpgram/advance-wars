import { Game } from "../..";
import { Ease, EaseFunction } from "../Common/EaseMethod";
import { Dictionary, PartialDeep, StringDictionary } from "../CommonTypes";
import { Common } from "../CommonUtils";
import { ProgressiveFunction, TEvent } from "./TimerEvent";

function millis(n: number) { return n * 1000; }
function seconds(n: number) { return n * 0.001; }

type IntervalOptions = number | {gap: number, max: number};

function getOptionsForEvery(interval: IntervalOptions) {
  if (typeof interval === 'number')
    return {gap: interval, repeat: -1};

  let { gap, max } = interval;
  max = (max < 0) ? -1 : Math.max(0, max - 1);
  return {gap, repeat: max};
}

/** An object which Timer is capable of tweening; an object whose property tree eventually
 * resolves to a number or an ignorable non-defined. */
export type Tweenable = Record<string | number, object | number | undefined>;


// TODO Update doc strings to reflect recent updates.

/**
 * An event itinerary system developed because I saw someone do this in Lua and
 * it was mad cool. Tweening, I mean.
 * 
 * For simple time keeping, create a timer via object construction (new Timer(5)).
 * Then call timer.start() at your leisure.
 * 
 * Timers created via the static class members (Timer.at(), etc.) are started by
 * default. To stop them, call .stop() somewhere in their construction chain.
 * 
 * Scheduling animation changes over time is extremely easy via a construction chain.  
 * 
 * ```
 * Timer  
 *   .at(.25)       // moves the itinerary cursor
 *   .do(n => {...})          // occurs at .25 seconds
 *   .wait(.25)     // moves the cursor relatively
 *   .tween(.25, n => {...})  // occurs from .50 to .75 seconds
 *   .wait()        // skips to previous step's end time (.75 seconds)
 *   ...
 * ```
 * 
 * @author Dei Valko
 */
export class Timer {

  /** NULL function which describes the default, no-effect event action. */
  static readonly NULL_ACTION = () => {};

  /** NULL object which describes the default, no-effect timer event. */
  static readonly NULL_EVENT = TEvent.createTimerEvent({
    time: 0,
    action: Timer.NULL_ACTION,
  });

  /** Helper for static Timer calls which auto-start timers by default. */
  private static new() {
    return new Timer().start();
  }

  /** Shortcut to new Timer().start().at(); returns a Timer object. */
  static at(n: number) {
    return Timer.new().at(n);
  }

  /** Shortcut to new Timer().start().wait(); returns a Timer object. */
  static wait(n?: number) {
    return Timer.at(n || 0);
  }

  /** Shortcut to new Timer().start().at(); returns a Timer object. */
  static do(action: ProgressiveFunction, context?: object) {
    return Timer.new().do(action, context);
  }

  /** Shortcut to new Timer().start().every(); returns a Timer object. */
  static every(interval: number, action: ProgressiveFunction, context?: object) {
    return Timer.new().every(interval, action, context);
  }

  /** Shortcut to new Timer().start().transition(); returns a Timer object. */
  static transition(span: number, action: ProgressiveFunction, context?: object) {
    return Timer.new().transition(span, action, context);
  }

  /** Shortcut to new Timer().start().transitionEvery(); returns a Timer object. */
  static transitionEvery(span: number, interval: number, action: ProgressiveFunction, context?: object) {
    return Timer.new().transitionEvery(span, interval, action, context);
  }

  /** Shortcut to new Timer().start().tween(); returns a Timer object. */
  static tween<T extends object>(span: number, object: T, target: PartialDeep<T>, ease?: EaseFunction) {
    return Timer.new().tween(span, object, target, ease);
  }

  /** Shortcut to new Timer().start().tweenEvery(); returns a Timer object. */
  static tweenEvery<T extends object>(span: number, interval: number, object: T, target: PartialDeep<T>, ease?: EaseFunction) {
    return Timer.new().tweenEvery(span, interval, object, target, ease);
  }

  /** Whether this object destroys itself after calling the last event. */
  private selfDestruct = true;

  /** Whether this object ends after time elapse or resets itself to begin again. */
  private looping = false;

  /** True if the timer has been dismantled and is no longer useable. */
  get destroyed() { return this._destroyed; }
  private _destroyed = false;

  /** True if the timer's clock should be ticking. */
  get started() { return this._started; }
  private _started = false;

  /** The current elapsed time in milliseconds. */
  private elapsedMillis: number = 0;

  /** The list of scheduled event calls. */
  private events: TEvent.TimerEvent[] = [];

  /** The list of scheduled recurring event calls.
   * Useful for Timer.every() without mutating the original schedule. */
  private recurringEvents: TEvent.TimerEvent[] = [];

  /** The current time-position along the schedule track. Used for determing where
   * time events get added to the itinerary. */
  private timeCursor = 0;

  /** The last timer event added to the schedule, for reference. */
  private lastAdded?: TEvent.TimerEvent;

  /** A record of saved timestamp values; makes time navigating in long chains easier. */
  private readonly timestampLabels = {} as StringDictionary<number>;

  /** True if the events list needs to be sorted.
   * @unused */
  private dirty = false;

  /** Reference to the ticker this Timer is using as its update controller. */
  protected get updateTicker() { return Game.scene.ticker; }


  constructor(seconds?: number, action?: ProgressiveFunction, context?: object) {
    action = action ?? Timer.NULL_ACTION;
    (seconds) && this.at(seconds);
    this.do(action, context);
    this.updateTicker.add(this.update, this);
  }

  /** Signals self-destruction to happen on next safe opportunity. */
  destroy() {
    this._destroyed = true;
  }

  /** Destruction method which is called at a time the timer is ready for. */
  private _destroy() {
    this.updateTicker.remove(this.update, this);
    this.events.forEach( e => Common.destroyObject(e) );
    this.events = [];
    this.recurringEvents = [];
    this._started = false;
    this._destroyed = true;
  }

  /** Clears the timer's events so that it may be rescheduled.
   * I don't know why you would bother, but you do you. */
  clear() {
    this.events.forEach( e => Common.destroyObject(e) );
    this.events = [];
    this.recurringEvents = [];
  }

  /** The timer's full elapse length in milliseconds. This is reflective of the ending
   * timestamp of the last chronological event in the schedule. */
  private get lengthMillis() {
    return Math.max(...this.events.map( e => e.until ));
  }

  /** The timer's full elapse length in seconds. This is reflective of the ending
   * timestamp of the last chronological event in the schedule. */
  get length() {
    return seconds(this.lengthMillis);
  }

  /** Starts the timer's clock; returns this. */
  start() {
    if (!this.destroyed)
      this._started = true;
    return this;
  }

  /** Resets the timer's clock, then starts it; returns this. */
  startReset() {
    this.reset();
    this.start();
    return this;
  }

  /** Stops the timer's clock; returns this. May be resumed with start(). */
  stop() {
    this._started = false;
    return this;
  }

  /** Stops and reset the timer's clock; returns this. */
  stopReset() {
    this.reset();
    this.stop();
    return this;
  }

  /** Executes all timer events in chronological order. */
  skip() {
    this.elapsedMillis = this.lengthMillis;
    this.update();
  }

  /** Resets the timer's clock and scheduled event calls to initial; returns this. Does not stop the clock. */
  reset() {
    this.elapsedMillis = 0;
    this.events.forEach( e => {
      e.completed = false;  // TODO completedDir could be -1 | 1 to allow for bi-directional ticking.
      e.snap = undefined;
    });
    this.recurringEvents = [];
    return this;
  }

  /** The timer's elapsed clock time in seconds. */
  get elapsed() {
    return seconds(this.elapsedMillis);
  }

  /** True if the timer has started and hasn't yet finished. */
  get ticking() {
    return (this._started && this.elapsedMillis < this.lengthMillis);
  }

  /** True if the timer has finished. */
  get finished() {
    return (this.eventsExhausted);
  }

  /** True if all timer events have been called. */
  private get eventsExhausted() {
    return this.events.every( e => e.completed ) && this.recurringEvents.every( e => e.completed );
  }

  /** Handles timer management. */
  protected update() {
    if (this.destroyed)
      this._destroy();
    if (!this._started || this.destroyed)
      return;

    this.handleEvents(this.events);
    this.handleEvents(this.recurringEvents);
    this.cullRecurringEvents();

    this.elapsedMillis += Game.deltaMS;

    if (this.eventsExhausted) {
      if (this.looping)
        this.reset();
      else if (this.selfDestruct)
        this._destroy();
    }
  }

  /** Iterator for a list of timer events. */
  private handleEvents(events: TEvent.TimerEvent[]) {
    const elapsed = this.elapsedMillis;
    events.forEach( e => {
      if (elapsed < e.time || e.completed)
        return;

      // Instant actions and function-style tweens.
      const normal = (e.until > e.time)
        ? Common.clamp((elapsed - e.time) / (e.until - e.time), 0, 1)
        : 1;
      
      // Flag completed events — Performing this here allows e.action to call timer.reset()
      if (normal === 1) {
        e.completed = true;
        e.snap = undefined;
      }

      e.action.call(e.context, e.ease(normal));

      // Property-style tweens.
      if (e.object && e.target) {
        if (!e.snap)
          e.snap = this.createSnap(e.object, e.target);
        this.updateTween(e.object, e.snap as Tweenable, e.target, e.ease(normal));
      }

      // Interval-repeating events.
      if (e.completed && e.repeat !== 0)
        this.extendRecurringEvent(e);
    });
  }

  /** Creates a shallow copy of the given object's state for the purpose
   * of tweening its values. As this only works with numeric properties,
   * naturally those are the only ones copied. */
  // obj != self and depth > 0 and key in props are used to limit/prevent
  // infinite loops, like through parent-child relationships. If there are
  // problems, look there.
  private createSnap(object: Tweenable, numericProps: Tweenable) {
    const self = object;

    const snap = (obj: Tweenable, props: Tweenable, depth: number) => {
      if (obj === null || depth === 0)
        return;

      if (Object.values(obj).some( v => v === self ))
        return;

      const snapObj = {} as Tweenable;
      for (const key in props) {
        const propType = typeof props[key];

        if (propType === 'number')
          snapObj[key] = obj[key]

        if (propType === 'object') {
          const subs = [ obj[key], props[key] ] as Tweenable[];
          const [ subObj, subProps ] = subs;
          snapObj[key] = snap(subObj, subProps, depth-1);
        }
      }
      return snapObj;
    }

    return snap(object, numericProps, 3);
  }

  /** Tween-process method for objects using property style. */
  private updateTween(object: Tweenable, start: Tweenable, end: Tweenable, n: number) {
    // Guards against 'destroyed' objects which flag themselves as such.
    if ((object as any).destroyed === true)
      return;

    for (const key in end) {
      if (object[key] === undefined)
        continue;

      const keyType = typeof object[key];
      
      // Recursive action
      if (keyType === 'object') {
        const subs = [ object[key], start[key], end[key] ] as Tweenable[];
        const [ subObject, subStart, subEnd ] = subs;
        this.updateTween(subObject, subStart, subEnd, n);
      }
      // Tween action
      else if (keyType === 'number') {
        const subs = [ start[key], end[key] ] as number[];
        const [ nStart, nEnd ] = subs;
        object[key] = (nEnd - nStart) * n + nStart;
      }
      // Unexpected input error
      else
        throw new Error(`Property of object '${key}' was of type '${keyType}' but expected object or number.`);
    }
  }

  /** Creates a new (temp) timer event for the next occurrence of a repeatable. */
  private extendRecurringEvent(e: TEvent.TimerEvent) {
    const { interval, action, context, object, target, ease } = e;

    const time = e.until + e.interval;
    const span = e.until - e.time;
    const until = time + span;
    const repeat = (e.repeat < 0) ? -1 : Math.max(e.repeat - 1, 0);

    const next = TEvent.createTimerEvent({
      time, until, interval, repeat, action, context, object, target, ease,
    });
    this.recurringEvents.push(next);
      // ^ This can extend recurringEvents while it's being iterated over,
      //   but I will assume this is a non-issue for now.
  }

  /** Removes any completed repeatable events from consideration. */
  private cullRecurringEvents() {
    this.recurringEvents = this.recurringEvents.filter( e => !e.completed );
  }

  /** Mutates the events schedule to be in chronological order. If the clock was somehow
   * started before the events were sorted, previously called events may be called again.
   * @unused */
  private sortEvents() {
    // Sorting is no longer feasible, especially since most events lists probably aren't that long.
    // We now have a different strategy for queued and spent event handling, but
    // I am reserving this space for future optimizations.
    if (!this.dirty)
      return this;
    this.events.sort( (a,b) => a.time - b.time );
    return this;
  }

  /** Tells the timer not to destroy itself on finish; returns this. */
  noSelfDestruct() {
    this.selfDestruct = false;
    return this;
  }

  /** Tells the timer to loop through its time interval instead of ending.  
   * If doing this, you will have to call .destroy() manually. */
  loop() {
    this.looping = true;
    return this;
  }

  /** Moves the time cursor to a particular point in time (seconds).
   * Cannot move to negative time values.
   * Pass in 'end' to move the cursor to the timer's (as of now) final timestamp. */
  at(time: number | 'end' | string) {
    if (time === 'end')
      time = this.lengthMillis;
    else if (typeof time === 'string') {
      const timestamp = this.timestampLabels[time];
      if (!timestamp)
        throw new Error(`No label '${time}' exists among saved timestamps. Has it been recorded yet?`);
      time = this.timestampLabels[time];
    }
    else 
      time = millis(time);

    this.timeCursor = Math.max(time as number, 0);
    this.lastAdded = undefined;
    return this;
  }

  /** Moves the time cursor to some time distance from its current position.
   * Negative time values will move backward, but cannot move beyond time=0. */
  wait(time?: number) {
    if (!time)
      time = TEvent.getSpan(this.lastAdded);
    else
      time = millis(time);

    this.timeCursor += Math.max(time, 0);
    this.lastAdded = undefined;
    return this;
  }

  /** Registers the current time cursor value as a named timestamp referenceable
   * with .at(); returns this. Note that 'end' is a reserved label for the last
   * time value on the current itinerary. Also note that reusing a label will
   * overwrite the last value saved. */
  label(name: string) {
    if (name === 'end')
      throw new Error(`Cannot save a timestamp label 'end'; reserved keyword.`);
    this.timestampLabels[name] = this.timeCursor;
    return this;
  }

  /** Helper method which does some additional bookkeeping with each event pushed
   * onto the schedule. */
  private addEvent(event: TEvent.TimerEvent) {
    this.events.push(event);
    this.lastAdded = event;
  }

  /** Schedules an event-call; returns this. */
  do(event: ProgressiveFunction, context?: object) {
    const time = this.timeCursor;
    const e = TEvent.createTimerEvent({
      time,
      action: event,
      context,
    });
    this.addEvent(e);
    return this;
  }

  /** Schedules an event-call at 'time' and every 'interval' seconds after; returns this.
   * Every-events are by nature infinite and prevent the timer from self-destructing. */
  every(interval: IntervalOptions, action: ProgressiveFunction, context?: object) {
    const time = this.timeCursor;
    const { gap, repeat } = getOptionsForEvery(interval);
    interval = millis(gap);
    const e = TEvent.createTimerEvent({
      time,
      interval,
      repeat,
      action,
      context,
    })
    this.addEvent(e);
    return this;
  }

  /** Schedules a progressive event-call for 'span' seconds; returns this. */
  transition(span: number, action: ProgressiveFunction, context?: object) {
    const time = this.timeCursor;
    const until = millis(span) + time;
    const e = TEvent.createTimerEvent({
      time,
      until,
      action,
      context,
    })
    this.addEvent(e);
    return this;
  }

  /** Schedules a progressive event-call for 'span' seconds recurringly with
   * 'interval'-seconds gaps; returns this; */
  transitionEvery(interval: IntervalOptions, span: number, event: ProgressiveFunction, context?: object) {
    const time = this.timeCursor;
    const until = millis(span) + time;
    const { gap, repeat } = getOptionsForEvery(interval);
    interval = millis(gap);
    const e = TEvent.createTimerEvent({
      time,
      until,
      interval,
      repeat,
      action: event,
      context,
    })
    this.addEvent(e);
    return this;
  }

  /** Schedules a prop-style tween event which modulates the given object's properties
   * from their occurrence-time values to the given target values. This only works for
   * numeric properties. If you need more specific control, use transition(). */
  tween<T extends object>(span: number, object: T, target: PartialDeep<T>, ease?: EaseFunction) {
    ease = ease || Ease.linear.out;
    const time = this.timeCursor;
    const until = millis(span) + time;
    const e = TEvent.createTimerEvent({
      time,
      until,
      object,
      target,
      ease,
    })
    this.addEvent(e);
    return this;
  }

  /** Schedules a reoccuring prop-style tween event that modulates the given object's properties
   * from their occurrence-time values to the given target values. This only works for numeric
   * properties. If you need more specific control, use transitionEvery().
   * Interval wait time is counted from the tween's span-end time. */
  // TODO max occurences?
  tweenEvery<T extends object>(interval: IntervalOptions, span: number, object: T, target: PartialDeep<T>, ease?: EaseFunction) {
    ease = ease || Ease.linear.out;
    const time = this.timeCursor;
    const until = millis(span) + time;
    const { gap, repeat } = getOptionsForEvery(interval);
    interval = millis(gap);
    const e = TEvent.createTimerEvent({
      time,
      until,
      interval,
      repeat,
      object,
      target,
      ease,
    })
    this.addEvent(e);
    return this;
  }

  /** Schedules a list of timer events described through timer-event-options objects; returns this. */
  schedule(...events: TEvent.TimerEventOptions[]) {
    events.forEach( e => {
      this.addEvent(TEvent.createTimerEvent(e));
    })
    return this;
  }

}