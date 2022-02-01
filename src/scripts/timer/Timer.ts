import { Game } from "../..";
import { Common } from "../CommonUtils";
import { ProgressiveFunction, TEvent } from "./TimerEvent";

function millis(n: number) { return n * 1000; }
function seconds(n: number) { return n * 0.001; }

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

  /** Shortcut to new Timer().start().tween(); returns a Timer object. */
  static tween(span: number, action: ProgressiveFunction, context?: object) {
    return Timer.new().tween(span, action, context);
  }

  /** Shortcut to new Timer().start().tweenAfter(); returns a Timer object. */
  static tweenEvery(span: number, interval: number, action: ProgressiveFunction, context?: object) {
    return Timer.new().tweenEvery(span, interval, action, context);
  }

  /** Whether this object destroys itself after calling the last event. */
  private selfDestruct = true;

  /** True if the timer has been dismantled and is no longer useable. */
  get destroyed() { return this._destroyed; }
  private _destroyed = false;

  /** True if the timer's clock should be ticking. */
  private started = false;

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

  /** True if the events list needs to be sorted.
   * @unused */
  private dirty = false;


  constructor(seconds?: number, action?: ProgressiveFunction, context?: object) {
    action = action || Timer.NULL_ACTION;
    (seconds) && this.at(seconds);
    this.do(action, context);
    Game.scene.ticker.add(this.update, this);
  }

  /** Signals self-destruction to happen on next safe opportunity. */
  destroy() {
    this._destroyed = true;
  }

  /** Destruction method which is called at a time the timer is ready for. */
  private _destroy() {
    Game.scene.ticker.remove(this.update, this);
    this.events.forEach( e => Common.destroyObject(e) );
    this.events = [];
    this.recurringEvents = [];
    this.started = false;
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
      this.started = true;
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
    this.started = false;
    return this;
  }

  /** Stops and reset the timer's clock; returns this. */
  stopReset() {
    this.reset();
    this.stop();
    return this;
  }

  /** Resets the timer's clock and scheduled event calls to initial; returns this. Does not stop the clock. */
  reset() {
    this.elapsedMillis = 0;
    this.events.forEach( e => e.completed = false );  // TODO completedDir could be -1 | 1 to allow for bi-directional ticking.
    this.recurringEvents = [];
    return this;
  }

  /** The timer's elapsed clock time in seconds. */
  get elapsed() {
    return seconds(this.elapsedMillis);
  }

  /** True if the timer has started and hasn't yet finished. */
  get ticking() {
    return (this.started && this.elapsedMillis < this.lengthMillis);
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
  private update() {
    if (this.destroyed)
      this._destroy();
    if (!this.started || this.destroyed)
      return;

    this.handleEvents(this.events);
    this.handleEvents(this.recurringEvents);
    this.cullRecurringEvents();

    this.elapsedMillis += Game.deltaMS;

    if (this.eventsExhausted && this.selfDestruct)
      this._destroy();
  }

  /** Iterator for a list of timer events. */
  private handleEvents(events: TEvent.TimerEvent[]) {
    const elapsed = this.elapsedMillis;
    events.forEach( e => {
      if (elapsed < e.time || e.completed)
        return;

      const normal = (e.until > e.time)
        ? Common.clamp((elapsed - e.time) / (e.until - e.time), 0, 1)
        : 1;
      e.action.call(e.context, e.shape(normal));

      if (e.repeat !== 0)
        this.extendRecurringEvent(e);
      
      // Flag completed events
      if (normal === 1)
        e.completed = true;
    });
  }

  /** Creates a new (temp) timer event for the next occurrence of a repeatable. */
  private extendRecurringEvent(e: TEvent.TimerEvent) {
    const { interval, action, shape, context } = e;

    const time = e.until + e.interval;
    const span = e.until - e.time;
    const until = time + span;
    const repeat = (e.repeat > 0) ? e.repeat - 1 : -1;

    const next = TEvent.createTimerEvent({
      time, until, interval, repeat, action, shape, context
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

  /** Moves the time cursor to a particular point in time (seconds).
   * Cannot move to negative time values.
   * Pass in 'end' to move the cursor to the timer's (as of now) final timestamp. */
  at(time: number | 'end') {
    time = (time === 'end')
      ? this.lengthMillis
      : millis(time);
    this.timeCursor = Math.max(time, 0);
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
  // TODO options: {interval: number, max?: number}
  every(interval: number, action: ProgressiveFunction, context?: object) {
    const time = this.timeCursor;
    interval = millis(interval);
    const e = TEvent.createTimerEvent({
      time,
      interval,
      repeat: -1,
      action,
      context,
    })
    this.addEvent(e);
    return this;
  }

  /** Schedules a progressive event-call for 'span' seconds; returns this. */
  // TODO options: {interval: number, shape?: EaseFunction}
  tween(span: number, action: ProgressiveFunction, context?: object) {
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

  private updateTween(object: object, start: object, end: object, n: number) {
    // recursive for {obj: {obj: {x: 1}}}
    // object[key] = (end[key] - start[key]) * n + start[key];
    // can only tween numbers; throw error if not
    // undefined properties are ignored (prevents breakage on destroyed objects)
    // further protection can check if object.destroyed === true. This isn't
    //   guaranteed to do anything, but it's a common pattern.
  }

  /** Schedules a progressive event-call for 'span' seconds recurringly with
   * 'interval'-seconds gaps; returns this; */
  tweenEvery(span: number, interval: number, event: ProgressiveFunction, context?: object) {
    const time = this.timeCursor;
    const until = millis(span) + time;
    interval = millis(interval);
    const e = TEvent.createTimerEvent({
      time,
      until,
      interval,
      repeat: -1,
      action: event,
      context,
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