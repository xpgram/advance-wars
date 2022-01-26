import { Game } from "../..";
import { Slider } from "../Common/Slider";


const TO_MILLIS = 1000;
const TO_SECONDS = 0.001;

interface TimerEvent {
  time: number;
  event: () => void;
  context?: object;
}

/** Timer
 * Something something inspired by Lua.
 * 
 * // TODO Multiple tweens/everys? I mean, why not, right?
 */
export class Timer {

  /** NULL function which fills in missing event functions on new Timer() calls. */
  static readonly NULL_EVENT = () => {};

  /** NULL object which allows schedule retrieval from a TimerEvents list to be safe. */
  static readonly NULL_SCHEDULE: TimerEvent = {
    time: 0,
    event: Timer.NULL_EVENT,
  }

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

  /** True if the timer's clock should be ticking. */
  private started = false;

  /** The current elapsed time in milliseconds. */
  private elapsedMillis: number = 0;

  /** The list of scheduled event calls. */
  private events: TimerEvent[] = [];

  /** The current index of the next chronological event waiting to be called. */
  private eventIdx = 0;

  /** True if the events list needs to be sorted. */
  private dirty = false;

  /** An event called every iteration of some time interval. This interval is always from time=0. */
  private everyEvent?: TimerEvent;

  /** The next clock time the every-event will be called at. */
  private everyNextCallTime = 0;

  /** Whether time=0 should be included in the list of every-event pulses. */
  private everyOnStart = false;

  /** Update function for tween effects. */
  private tweenFunc?: (n: number) => void;

  /** Context for the tween function call. */
  private tweenContext?: object;

  /** Shape function for passed values to the tween update function. */
  private tweenShape = (n: number) => n;

  /** Flag signal that tween is done and can cease functioning.
   * Used to ensure that a final tween=1.0 is called to complete the effect. */
  private tweenFinished = false;  // TODO Roll this into something of higher scope?


  constructor(seconds?: number, event?: () => void, context?: object) {
    this.at(seconds || 0, event || Timer.NULL_EVENT, context);
    Game.scene.ticker.add(this.update, this);
  }

  destroy() {
    Game.scene.ticker.remove(this.update, this);
    // TODO Deconstruct all event calls, too
  }

  /** The timer's elapse length in milliseconds. This is always reflective of the timestamp of the last scheduled event. */
  private get lengthMillis() {
    this.sortEvents();
    return this.events[this.events.length-1].time;
  }

  /** The timer's elapse length in seconds. This is always reflective of the timestamp of the last scheduled event. */
  get length() {
    return this.lengthMillis * TO_SECONDS;
  }

  /** Starts the timer's clock. */
  start() {
    this.sortEvents();
    this.started = true;
  }

  /** Resets the timer's clock, then starts it. */
  startReset() {
    this.reset();
    this.start();
  }

  /** Stops the timer's clock. May be resumed with start(). */
  stop() {
    this.started = false;
  }

  /** Stops and reset the timer's clock. */
  stopReset() {
    this.reset();
    this.stop();
  }

  /** Resets the timer's clock and scheduled event calls to initial. Does not stop the clock. */
  reset() {
    this.elapsedMillis = 0;
    this.eventIdx = 0;
    this.everyNextCallTime = (!this.everyOnStart)
      ? this.everyEvent?.time || 0
      : 0;
    this.tweenFinished = false;
  }

  /** The timer's elapsed clock time in seconds. */
  get elapsed() {
    return this.elapsedMillis * TO_SECONDS;
  }

  /** True if the timer is start and hasn't yet finished. */
  get ticking() {
    return (this.started && this.elapsedMillis < this.lengthMillis);
  }

  /** True if the timer has finished. */
  get finished() {
    return (this.elapsedMillis >= this.length);
  }

  /** True if all timer events have been called. */
  private get eventsExhausted() {
    return this.eventIdx >= this.events.length;
  }

  /** The current event the timer is waiting to call. */
  private get currentEvent() {
    return (this.eventIdx < this.events.length)
      ? this.events[this.eventIdx]
      : Timer.NULL_SCHEDULE;
  }

  /** Handles timer management. */
  private update() {
    if (!this.started)
      return;

    this.elapsedMillis += Game.deltaMS;
    
    // Force chronological order — this goes through a 'dirty' check, so it shouldn't
    // affect performance. It's just here to clean up during-runtime event additions.
    this.sortEvents();

    // Initiate event callbacks
    this.handleEvents();
    this.handleEveryEvent();
    this.handleTweenEvent();

    if (this.finished && this.selfDestruct)
      this.destroy();
  }

  /** Manages at-event calls. */
  private handleEvents() {
    if (this.eventsExhausted)
      return;
    while (this.currentEvent.time <= this.elapsedMillis) {
      this.currentEvent.event.call(this.currentEvent.context);
      this.eventIdx++;
    }
  }

  /** Manages every-event calls. */
  private handleEveryEvent() {
    if (!this.everyEvent)
      return;
    while (this.elapsedMillis >= this.everyNextCallTime) {
      this.everyEvent.event.call(this.everyEvent.context);
      this.everyNextCallTime += this.everyEvent.time;
    }
  }

  /** Manages tween-event calls. */
  private handleTweenEvent() {
    if (!this.tweenFunc || this.tweenFinished)
      return;

    const { min } = Math;
    const timerProgress = min(this.elapsedMillis / this.length, 1);
    const n = this.tweenShape(timerProgress);
    this.tweenFunc.call(this.tweenContext, n);

    if (timerProgress === 1)
      this.tweenFinished = true;
  }

  /** Mutates the events schedule to be in chronological order. If the clock was somehow
   * started before the events were sorted, previously called events may be called again. */
  sortEvents() {
    if (!this.dirty)
      return this;
    const cur = this.currentEvent;
    this.events.sort( (a,b) => a.time - b.time );
    this.eventIdx = this.events.findIndex( e => e === cur );
    return this;
  }

  /** Tells the timer not to destroy itself on finish; returns this. */
  noSelfDestruct() {
    this.selfDestruct = false;
    return this;
  }

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