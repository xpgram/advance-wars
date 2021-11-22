import { Game } from "../..";

/** A single-pulse timer which calls a callback (if one is given) one time after
 * the timer has fully elapsed. An expired timer can be restarted by simply calling start(). */
export class Timer {

  private elapsedTime: number = 0;
  private timerLength: number = 0;
  private callback: (() => void) | undefined;

  constructor(seconds: number, cb?: () => void) {
    this.timerLength = seconds;
    this.callback = cb;
    this.start();
  }

  start() {
    this.reset();
    Game.scene.ticker.add(this.update, this);
  }

  stop() {
    Game.scene.ticker.remove(this.update, this);
  }

  reset() {
    this.elapsedTime = 0;
  }

  get ticking() {
    return (this.elapsedTime > 0 && this.elapsedTime < this.timerLength);
  }

  get finished() {
    return (this.elapsedTime >= this.timerLength);
  }

  private update() {
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