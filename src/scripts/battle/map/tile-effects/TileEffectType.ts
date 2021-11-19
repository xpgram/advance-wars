import { Game } from "../../../..";
import { ImmutablePointPrimitive, Point } from "../../../Common/Point";
import { Timer } from "../../../timer/Timer";

/**  */
export abstract class TileEffectType {
  /**  */
  abstract readonly name: string;
  /**  */
  readonly location: ImmutablePointPrimitive;
  /**  */
  protected abstract timer: Timer;
  
  /**  */
  get finished() { return this._finished; }
  private _finished = false;

  constructor(options: {location: ImmutablePointPrimitive}) {
    this.location = options.location;
  }

  /**  */
  play(): void {
    this._finished = false;
    this.create();
    this.timer.start();
    Game.scene.ticker.add(this.update, this);
    Game.workOrders.send( () => {
      if (this.timer.finished)
        this.stop();
      if (this.finished)
        return true;
    });
  };

  /**  */
  stop(): void {
    this._finished = true;
    this.destroy();
    this.timer.reset();
    Game.scene.ticker.remove(this.update, this);
  }

  /**  */
  protected abstract create(): void;

  /**  */
  protected abstract update(): void;

  /**  */
  protected abstract destroy(): void;
}