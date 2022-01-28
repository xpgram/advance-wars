import { Game } from "../..";
import { EasingFunction, EaseMethod } from "../Common/EaseMethod";
import { Common } from "../CommonUtils";

const TO_MILLIS = 1000;
const TO_SECONDS = 0.001;

/**  */
type TweenFunction = (n: number) => void;

interface TimerEventOptions {
  time: number;         // Start time.
  until?: number;       // End time.
  interval?: number,    // How long to wait after until to repeat; =time by default
  repeat?: number,      // n<0 forever, n=0 single, n>0 specifies additional times
  action: TweenFunction;  // n is proportional to current time and start/end
  shape?: EasingFunction;  // shape function for the input to action()
  context?: object;       // object context to call action() with
}

interface TimerEvent {
  time: number;
  until: number;
  interval: number;
  repeat: number;
  completed: boolean;
  action: TweenFunction;
  shape: EasingFunction;
  context?: object;
}

function createTimerEvent(e: TimerEventOptions): TimerEvent {
  return Common.assignDefaults(e, {
    until: e.time,
    interval: e.time,
    repeat: 0,
    shape: EaseMethod.linear,
    completed: false,
  });
}

/**
 * Something something inspired by Lua.
 * 
 * Newly created timers are started by default. To stop them, call .stop() before
 * their first assigned update step, like at the end of their schedule chain.
 * 
 * @author Dei Valko
 */
export class Timer {

  /** NULL function which describes the default, no-effect event action. */
  static readonly NULL_ACTION = () => {};

  /** NULL object which describes the default, no-effect timer event. */
  static readonly NULL_EVENT = createTimerEvent({
    time: 0,
    action: Timer.NULL_ACTION,
  });

  /** Helper for static Timer calls which auto-start timers by default. */
  private static new() {
    return new Timer().start();
  }

  /** Shortcut to new Timer().start().at(); returns a Timer object. */
  static at(time: number, event: TweenFunction, context?: object) {
    return Timer.new().at(time, event, context);
  }

  /** Shortcut to new Timer().start().after(); returns a Timer object. */
  static after(wait: number, event: TweenFunction, context?: object) {
    return Timer.new().at(wait, event, context);
  }

  /** Shortcut to new Timer().start().every(); returns a Timer object. */
  static every(time: number, interval: number, event: TweenFunction, context?: object) {
    return Timer.new().every(time, interval, event, context);
  }

  /** Shortcut to new Timer().start().tween(); returns a Timer object. */
  static tween(time: number, span: number, event: TweenFunction, context?: object, shape?: EasingFunction) {
    return Timer.new().tween(time, span, event, context, shape);
  }

  /** Shortcut to new Timer().start().tweenAfter(); returns a Timer object. */
  static tweenAfter(wait: number, span: number, event: TweenFunction, context?: object, shape?: EasingFunction) {
    return Timer.new().tween(wait, span, event, context, shape);
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
  private events: TimerEvent[] = [];

  /** The list of scheduled recurring event calls.
   * Useful for Timer.every() without mutating the original schedule. */
  private recurringEvents: TimerEvent[] = [];

  /** The time-occurrence of the last event scheduled.
   * Used for determining .after() event placement. */
  private lastScheduledEventTime = 0;

  /** True if the events list needs to be sorted.
   * @unused */
  private dirty = false;


  constructor(seconds?: number, event?: TweenFunction, context?: object) {
    this.at(seconds || 0, event || Timer.NULL_ACTION, context);
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
    return this.lengthMillis * TO_SECONDS;
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
    return this.elapsedMillis * TO_SECONDS;
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
  private handleEvents(events: TimerEvent[]) {
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
  private extendRecurringEvent(e: TimerEvent) {
    const { interval, action, shape, context } = e;

    const time = e.until + e.interval;
    const span = e.until - e.time;
    const until = time + span;
    const repeat = (e.repeat > 0) ? e.repeat - 1 : -1;

    const next = createTimerEvent({
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

  /** Helper method which does some additional bookkeeping with each event pushed
   * onto the schedule. */
  private addEvent(event: TimerEvent) {
    this.events.push(event);
    this.lastScheduledEventTime = event.until;
  }

  /** Schedules an event-call at some time value; returns this. */
  at(time: number, event: TweenFunction, context?: object) {
    time *= TO_MILLIS;
    const e = createTimerEvent({
      time,
      action: event,
      context,
    });
    this.addEvent(e);
    return this;
  }

  /** Schedules an event-call at some time value after the last one scheduled; returns this. */
  after(wait: number, event: (n: number) => void, context?: object) {
    const time = this.lastScheduledEventTime + wait*TO_MILLIS;
    const e = createTimerEvent({
      time,
      action: event,
      context,
    })
    this.addEvent(e);
    return this;
  }

  /** Schedules an event-call at 'time' and every 'interval' seconds after; returns this.
   * Every-events are by nature infinite and prevent the timer from self-destructing. */
  every(time: number, interval: number, event: TweenFunction, context?: object, occurrences?: number) {
    time *= TO_MILLIS;
    interval *= TO_MILLIS;
    const e = createTimerEvent({
      time,
      interval,
      repeat: (occurrences) ? occurrences - 1 : -1,
      action: event,
      context,
    })
    this.addEvent(e);
    return this;
  }

  /** Schedules a progressive event-call at 'time' for 'span' seconds; returns this. */
  tween(time: number, span: number, event: TweenFunction, context?: object, shape?: EasingFunction) {
    time *= TO_MILLIS;
    const until = span*TO_MILLIS + time;
    const e = createTimerEvent({
      time,
      until,
      action: event,
      shape,
      context,
    })
    this.addEvent(e);
    return this;
  }

  /** Schedules a progressive event-call at some time value after the last one scheduled
   * and for 'span' seconds; returns this. */
  tweenAfter(wait: number, span: number, event: TweenFunction, context?: object, shape?: EasingFunction) {
    const time = this.lastScheduledEventTime + wait*TO_MILLIS;
    const until = span*TO_MILLIS + time;
    const e = createTimerEvent({
      time,
      until,
      action: event,
      shape,
      context,
    })
    this.addEvent(e);
    return this;
  }

  /**  */
  // TODO Too many parameters. This *has* to be an options object.
  // probably:
  // tweenEvery(options: {blah blah blah}, event: TweenFunction, context?: object) { }
  // shape?: is a contender for making this standard across the tween functions. I'll consider.
  // I don't honestly know if shape is really worth it, though. Does it really simplify anything?
  // Boys are gonna modify their input inside the tween anyway, and it's not like complicated shapes
  // are cached between timer events; I don't even know how I would do that.
  tweenEvery(time: number, span: number, interval: number, event: TweenFunction, context?: object, shape?: EasingFunction, occurrences?: number) {
    time *= TO_MILLIS;
    const until = span*TO_MILLIS + time;
    interval *= TO_MILLIS;
    const e = createTimerEvent({
      time,
      until,
      interval,
      repeat: (occurrences) ? occurrences - 1 : -1,
      action: event,
      context,
    })
    this.addEvent(e);
    return this;
  }

  /** Schedules a list of timer events described through timer-event-options objects; returns this. */
  schedule(...events: TimerEventOptions[]) {
    events.forEach( e => {
      this.addEvent(createTimerEvent(e));
    })
    return this;
  }

}