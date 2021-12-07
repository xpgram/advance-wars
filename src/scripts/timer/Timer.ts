import { Game } from "../..";

/** A single-pulse timer which calls a callback (if one is given) one time after
 * the timer has fully elapsed. An expired timer can be restarted by simply calling start(). */
export class Timer {

  private _started = false;

  private elapsedTime: number = 0;
  private timerLength: number = 0;
  private callback: (() => void) | undefined;

  constructor(seconds: number, cb?: () => void) {
    this.timerLength = seconds;
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

  reset() {
    this.elapsedTime = 0;
  }

  get elapsed() {
    return this.elapsedTime;
  }

  get ticking() {
    return (this.elapsedTime > 0 && this.elapsedTime < this.timerLength);
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
      this.elapsedTime += Game.delta;
    }
  }
}