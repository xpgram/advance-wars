import { Game } from "../..";
import { TransitionShapes } from "../Common/TransitionShapes";
import { Common } from "../CommonUtils";

const TO_MILLIS = 1000;
const TO_SECONDS = 0.001;

interface TimerEventOptions {
  time: number;         // Start time.
  until?: number;       // End time.
  interval?: number,    // How long to wait after until to repeat; =time by default
  repeat?: number,      // n<0 forever, n=0 single, n>0 specifies additional times
  action: (n: number) => void;    // n is proportional to current time and start/end
  shape?: (n: number) => number;  // shape function for the input to action()
  context?: object;               // object context to call action() with
}

interface TimerEvent {
  time: number;
  until: number;
  interval: number;
  repeat: number;
  completed: boolean;
  action: (n: number) => void;
  shape: (n: number) => number;
  context?: object;
}

function createTimerEvent(e: TimerEventOptions): TimerEvent {
  return Common.assignDefaults(e, {
    until: e.time,
    interval: e.time,
    repeat: 0,
    shape: TransitionShapes.linear,
    completed: false,
  });
}

/**
 * Something something inspired by Lua.
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

  /** Shortcut to new Timer().at(); returns a Timer object. */
  static at(time: number, event: () => void, context?: object) {
    return new Timer().at(time, event, context);
  }

  /** Shortcut to new Timer().every(); returns a Timer object. */
  static every(time: number, event: () => void, context?: object) {
    return new Timer().every(time, event, context);
  }

  /** Shortcut to new Timer().tween(); returns a Timer object. */
  static tween(time: number, event: (n: number) => void, context?: object, shape?: (n: number) => number) {
    return new Timer(time).tween(event, context, shape);
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


  constructor(seconds?: number, event?: () => void, context?: object) {
    this.at(seconds || 0, event || Timer.NULL_ACTION, context);
    Game.scene.ticker.add(this.update, this);
  }

  destroy() {
    Game.scene.ticker.remove(this.update, this);
    this.events.forEach( e => Common.destroyObject(e) );
    this.recurringEvents = [];
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
    this.events.forEach( e => e.completed = false );
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
    return this.events.every( e => e.completed );
  }

  /** Handles timer management. */
  private update() {
    if (!this.started)
      return;

    this.handleEvents(this.events);
    this.handleEvents(this.recurringEvents);
    this.cullRecurringEvents();

    this.elapsedMillis += Game.deltaMS;

    if (this.eventsExhausted && this.selfDestruct)
      this.destroy();
  }

  /** Iterator for a list of timer events. */
  private handleEvents(events: TimerEvent[]) {
    const elapsed = this.elapsedMillis;
    const nextOccurrences: TimerEvent[] = [];

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

    return nextOccurrences;
  }

  /** Creates a new (temp) timer event for the next occurrence of a repeatable. */
  private extendRecurringEvent(e: TimerEvent) {
    const { interval, action, shape, context } = e;

    const time = e.until + e.interval;
    const duration = e.until - e.time;
    const until = time + duration;
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

  // TODO Refactor .at(s,{}), .every(s,i,{}), .tween(s,e,{}) member and static
  // TODO Write .after(i,{}), .tweenEvery(s,e,i,{}), .schedule(TimerEvent[])
  //            .tweenAfter(i,ie,{})
  // .after() and .tweenAfter() schedule themselves i-seconds after the last
  // definite time call. So,
  //   Timer
  //     .at(8)
  //     .at(2)
  //     .after(1)
  // places the after event at 3 seconds, not 9.
  // Likewise,
  // Timer.schedule([
  //   {time: }
  // ])
  // Actually, I don't know how .schedule() should work here.

  /** Schedules an event-call at some time value; returns this. */
  at(time: number, event: () => void, context?: object) {
    time *= TO_MILLIS;
    const timerEvent = {time, event, context};
    this.events.push(timerEvent);
    return this;
  }

  // removeEvent(event: () => void, context?: object) { }
  // TODO Should I?
  // Seems easier to just have a positive-only construction style.
  // Like, how much fiddling is reasonable?
  // These are supposed to be set-and-forget, you know.

  /** Schedules an event-call every 'time' seconds; returns this.
   * Every-events are by nature infinite and must be destroyed manually. */
  every(time: number, event: () => void, context?: object, onStart: boolean = false) {
    time *= TO_MILLIS;
    const timerEvent = {time, event, context};
    this.everyEvent = timerEvent;
    this.everyNextCallTime = timerEvent.time;
    this.everyOnStart = onStart;
    return this;

    // TODO Timer.at(5, { Timer.every(3, {...}, onStart=true) })
    // How does Timer.every() inside the Timer.at() get memory cleared?
    // We literally can't interact with it.
    // I think passing in Timers as children instead of event functions, like as an
    // overload alternative, would allow child-timer management that could still
    // interact with such things. I don't know, though.
    //
    // Timer.at(5, Timer.every(3, {...}));  ← Pulsar with delayed start. Ideally.
    //
    // Should every() force you to declare max calls?
    // You could answer 'infinite', but I think psychologically this could enable
    // the realization that infinite everys can't clean themselves up.
    // Allowing Timers instead of void functions is great, but it doesn't stop
    // people from writing an every() inside a void function.
  }

  /** Schedules a progressive event call for the duration of the timer; returns this.
   * Timer duration is always reflective of its last chronological event, so be mindful
   * that Timer(time) is deliberate and knowingly overridden. */
  tween(iter: (n: number) => void, context?: object, shape?: (n: number) => number) {
    this.tweenFunc = iter;
    this.tweenContext = context;
    (shape) && (this.tweenShape = shape);
    return this;
  }

}