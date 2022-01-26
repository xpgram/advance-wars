import { Game } from "../..";
import { Slider } from "../Common/Slider";

const MILLIS = 1000;

/** A single-pulse timer which calls a callback (if one is given) one time after
 * the timer has fully elapsed. An expired timer can be restarted by simply calling start(). */
export class Timer {

  private _started = false;

  private elapsedTime: number = 0;
  private timerLength: number = 0;
  private callback: (() => void) | undefined;

  constructor(seconds: number, cb?: () => void) {
    this.timerLength = seconds * MILLIS;
    this.callback = cb;
    Game.scene.ticker.add(this.update, this);
  }

  destroy() {
    Game.scene.ticker.remove(this.update, this);
  }

  start() {
    this._started = true;
  }

  startReset() {
    this.reset();
    this.start();
  }

  stop() {
    this._started = false;
  }

  stopReset() {
    this.reset();
    this.stop();
  }

  reset() {
    this.elapsedTime = 0;
  }

  get elapsed() {
    return this.elapsedTime;
  }

  get ticking() {
    return (this._started && this.elapsedTime < this.timerLength);
  }

  get finished() {
    return (this.elapsedTime >= this.timerLength);
  }

  private update() {
    if (!this._started)
      return;

    if (this.finished) {
      if (this.callback)
        this.callback();
      this.stop();
    }
    else {
      this.elapsedTime += Game.deltaMS;
    }
  }

  // autoDestroy = true
  // This sets the timer to destroy itself after the last .at() call, or its max time.
  // If this is not true, or if there is an .every(), this timer cannot destroy itself unless a max time is given.

  at(time: number, cb: () => void, context?: object) {
    // schedules an event at some time value.
  }

  every(options: {interval: number, from?: number, firstInterval?: number, onStart?: boolean}, cb: () => void, context?: object) {
    // Schedules an event at every interval of some time value since the starting value.
    // This is Pulsar behavior, so I don't know if I care about implementation here.

    // interval       : time between calls
    // firstInterval  : can be different from regular interval; cursor behavior
    // from           : from when the interval starts counting; from is the first pulse time
    // onStart        : whether to pulse on time == 0; this is absolute and unaffected by 'from'!

    // from = from || 0
    // from2 = from + firstInterval
    // firstTime = clock - from
    // secondTime = firstTime - from2
    //
    // firstPulse = (from !== 0 && firstTime === 0)
    // secondPulse = (secondTime === 0)
    // intervalTicking = (secondTime > 0)
    // intervalPulse = (secondTime % interval === 0)
    // startPulse = (clock === 0 && onStart)
    // if (intervalTicking && intervalPulse || startPulse || firstPulse || secondPulse)

    // Okay. Comment code. I didn't mean to go that hard.
    // I think, with few mistakes, that should cover pulses at these times:
    //  - time = 0      if onStart
    //  - time = from   if from > 0
    //  - time = from + firstInterval
    //  - time = from + firstInterval + interval
    //  - time = from + firstInterval + interval + ...
    // If not, I guess I can just follow this chart I just wrote.
  }

  tween(time: {length: number, at?: number}, cb: (slider: Slider) => void, context?: object) {
    // for time 'length', call the cb function
    // cb gets passed a slider whose track position is moderated by the time interval.
    // Slider options should be an optional parameter

    // Did I think about implementation at all?
    // How... hold on.

    // timer = new Timer(2);      // 2 seconds
    // timer.tween({
    //   object,
    //   prop: 'x',         // What would be the best way to pass in a property to tweak?
    //   from?: obj.x       // 'from' is current by default
    //   to?: obj.x + 120,  // 'to' is current by default (convenience)
    //   shape?: v => Math.pow(v, 2),   // linear by default
    //   operator?: slider => {}
    // });
    //
    // This part is implicit:
    //   f: slider => { obj.x = slider.output*(end-start) + start; },
    //
    // Ex:
    // new Timer(1.2).tween({
    //   object: illustration,
    //   prop: 'x',
    //   to: -64,
    // });
    // 
    // For 1.2 seconds, move 'illustration' from its current x to -64,
    // auto deconstruct tween object afterward.
    //
    // If I wanted to use tween() to manage a spiral-in animation, how would I do that?
    // Maybe I should keep the slider cb?
    // Yeah. I was trying to reduce the boilerplate, but I think for the purpose of
    // intricate animation I want to be able to directly state how the slider output
    // is applied to anything.

    // I gotta get back to my day job.

    // Timer.tween(3, {
    //   shape?: v => number,
    //   f: slider => {},
    //   context?: object,
    // })
    //
    // Okay. This works.
    // tween is a static method. It creates a new timer object of 3 seconds, does
    // the stuff and auto-destructs it after its finished. A reference is returned
    // in case you want it to skip or destroy early.
    // Should it return a reguler Timer object? What if you .at()?
    // Actually, what if you .at()?
    //
    // Timer.tween(3, {...})
    //   .at(1.5, () => { particle explosion })
    //   .at(2.0, () => { particle explosion })
    //
    // I don't know... how I want that to work under the hood, but wouldn't that
    // be cool? A naive user might want their tween effect to be a child of a longer
    // timer, but I think I need to just define it strictly as an 'of-length' effect
    // for simplicity. You can .at(2, Timer.tween()) on a higher-order timer if you
    // really need that, which is what I planned from the beginning anyway.
  }
}