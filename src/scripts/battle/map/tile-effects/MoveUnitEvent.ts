import { CardinalDirection, SumCardinalVectorsToVector } from "../../../Common/CardinalDirection";
import { Point } from "../../../Common/Point";
import { TransformContainer } from "../../../CommonTypes";
import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { RatificationError } from "../../turn-machine/Command";
import { Unit } from "../../Unit";
import { UnitObject } from "../../UnitObject";
import { TileEvent } from "./TileEvent";


interface MoveUnitEventOptions {
  actor: UnitObject;
  path: CardinalDirection[];
  assets: BattleSceneControllers;
}

export class MoveUnitEvent extends TileEvent {

  private options: MoveUnitEventOptions;
  private cameraTargetSwap!: TransformContainer | Point | null;

  constructor(options: MoveUnitEventOptions) {
    super(options.actor.boardLocation);
    this.options = {...options};
  }

  // TODO How should this work? This is already written by Command.Move.ratify, I could just pass it in.
  // Granted, I hvae more control here if I'm allowed to break it up.
  // A ratify() method makes all changes instantly, but if I wanted to subtract funds sequentially I'd need
  // to spread that instant change over time.
  private ratifyMovement() {
    const { map, scenario } = this.options.assets;
    const { actor: unit, path } = this.options;

    const place = unit.boardLocation;
    const goal = SumCardinalVectorsToVector(path).add(place);

    if (!map.moveUnit(place, goal))
      throw new RatificationError(`could not move unit ${place.toString()} → ${goal.toString()}`);

    unit.spent = true;
    if (unit.type !== Unit.Rig || !scenario.rigsInfiniteGas)
      unit.gas -= map.travelCostForPath(place, path, unit.moveType);
  }

  protected create(): void {
    const { trackCar, camera } = this.options.assets;
    const { actor, path } = this.options;

    this.cameraTargetSwap = camera.followTarget;
    camera.followTarget = trackCar;

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
    const { camera, trackCar } = this.options.assets;
    const { actor } = this.options;

    camera.followTarget = this.cameraTargetSwap;
    trackCar.reset();
    trackCar.hide();
    actor.visible = true;

    //@ts-expect-error
    this.options = undefined;
    this.cameraTargetSwap = null;
  }
}