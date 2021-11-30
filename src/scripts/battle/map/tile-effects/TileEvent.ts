import { Game } from "../../../..";
import { ImmutablePointPrimitive } from "../../../Common/Point";
import { Timer } from "../../../timer/Timer";

/** An animation event over the game map which will be started by the event handler. */
export abstract class TileEvent {

  readonly location: ImmutablePointPrimitive;

  constructor(location: ImmutablePointPrimitive) {
    this.location = location;
  }

  /** Whether or not this animation is ticking along. */
  get playing() { return this._playing && !this._finished; }
  private _playing = false;
  
  /** Whether or not this animation has completed. */
  get finished() { return this._finished; }
  private _finished = false;

  /** Signals the end of this animation */
  protected finish() {
    this._finished = true;
    this.stop();
  }

  /** Starts this object's animation. */
  play(): void {
    this._playing = true;
    this._finished = false;
    this.create();
    Game.scene.ticker.add(this.updateWrapper, this);
    Game.workOrders.send( () => {
      if (this.finished) {
        this.stop();
        return true;
      }
    });
  };

  /** Calls this object's update step but only when active. */
  private updateWrapper(): void {
    if (!this._finished)
      this.update();
  }

  /** Stops this object's animation and destructs its assets. */
  stop(): void {
    if (!this._playing)   // Prevents multiple stop() calls from doing anything.
      return;

    this._playing = false;
    this.finish();
    this.destroy();
    Game.scene.ticker.remove(this.updateWrapper, this);
  }

  /** Script to run on first execution. Build animation assets here. */
  protected abstract create(): void;

  /** Script to run every frame. Use to modify animation mid duration.
   * Needs to call this.finish() at some point to signal the animation's end. */
  protected abstract update(): void;

  /** Script to run on destruction. Use to disassemble assets. */
  protected abstract destroy(): void;
}