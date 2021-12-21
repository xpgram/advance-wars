import { CardinalDirection, SumCardinalsToVector } from "../../../Common/CardinalDirection";
import { Point } from "../../../Common/Point";
import { PositionContainer } from "../../../CommonTypes";
import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { RatificationError } from "../../turn-machine/Command";
import { Unit } from "../../Unit";
import { UnitObject } from "../../UnitObject";
import { TileEvent } from "./TileEvent";


interface MoveUnitEventOptions {
  actor: UnitObject;
  path: CardinalDirection[];
  target?: Point,
  assets: BattleSceneControllers;
}

export class MoveUnitEvent extends TileEvent {

  protected options: MoveUnitEventOptions;
  private focalSwap?: PositionContainer;

  constructor(options: MoveUnitEventOptions) {
    super(options.target || options.actor.boardLocation);
    this.options = {...options};
  }

  // TODO How should this work? This is already written by Command.Move.ratify, I could just pass it in.
  // Granted, I hvae more control here if I'm allowed to break it up.
  // A ratify() method makes all changes instantly, but if I wanted to subtract funds sequentially I'd need
  // to spread that instant change over time.
  protected ratifyMovement() {
    const { map, scenario } = this.options.assets;
    const { actor, path } = this.options;

    const place = actor.boardLocation;
    const goal = SumCardinalsToVector(path).add(place);

    if (!map.moveUnit(place, goal))
      throw new RatificationError(`could not move unit ${place.toString()} → ${goal.toString()}`);

    if (actor.type !== Unit.Rig || !scenario.rigsInfiniteGas)
      actor.gas -= map.travelCostForPath(place, path, actor.moveType);
  }

  protected create(): void {
    const { mapCursor, trackCar, camera } = this.options.assets;
    const { actor, path, target } = this.options;

    if (target) {
      mapCursor.mode = 'target';
      mapCursor.show();
    }

    this.focalSwap = camera.focalTarget;
    camera.focalTarget = trackCar.transform;

    trackCar.buildNewAnimation(actor);
    trackCar.directions = path;
    trackCar.show();
    trackCar.start();

    actor.visible = false;
  }

  protected update(): void {
    const { trackCar } = this.options.assets;
    if (trackCar.finished) {
      this.ratifyMovement();
      this.finish();
    }
  }

  protected destroy(): void {
    const { mapCursor, camera, trackCar } = this.options.assets;
    const { actor, target } = this.options;

    if (target) {
      mapCursor.mode = 'point';
      mapCursor.hide();
    }

    camera.focalTarget = this.focalSwap;
    trackCar.reset();
    trackCar.hide();
    actor.visible = true;

    //@ts-expect-error
    this.options = undefined;
    this.focalSwap = undefined;
  }
}