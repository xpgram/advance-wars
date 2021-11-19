import { Game } from "../../../..";
import { ImmutablePointPrimitive, Point } from "../../../Common/Point";
import { Timer } from "../../../timer/Timer";
import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";

/** An animation event over the game map which will be started by the event handler. */
export abstract class TileEventType {
  /** The board location this event takes place at. */
  readonly location: ImmutablePointPrimitive;
  /** A timer which auto-destructs this object on completion. */
  protected abstract timer: Timer;

  protected get assets() {
    if (this._assets === undefined)
      throw new Error(`This TileEffect has no reference to game assets but requires them. Was it added to an EventQueue?`);
    return this._assets;
  }
  private _assets!: BattleSceneControllers;
  
  /** Whether or not this animation has completed. */
  get finished() { return this._finished; }
  private _finished = false;

  constructor(options: {location: ImmutablePointPrimitive}) {
    this.location = options.location;
  }

  /** Starts this object's animation. */
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

  /** Stops this object's animation and destructs its assets. */
  stop(): void {
    this._finished = true;
    this.destroy();
    this.timer.reset();
    Game.scene.ticker.remove(this.update, this);
  }

  /** Script to run on first execution. Build animation assets here. */
  protected abstract create(): void;

  /** Script to run every frame. Use to modify animation mid duration. */
  protected abstract update(): void;

  /** Script to run on destruction. Use to disassemble assets. */
  protected abstract destroy(): void;
}