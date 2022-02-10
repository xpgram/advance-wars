import { Game } from "../../../..";
import { CardinalDirection, SumCardinalsToVector } from "../../../Common/CardinalDirection";
import { Point } from "../../../Common/Point";
import { Rectangle } from "../../../Common/Rectangle";
import { PositionContainer } from "../../../CommonTypes";
import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { CommandHelpers } from "../../turn-machine/Command.helpers";
import { Unit } from "../../Unit";
import { UnitObject } from "../../UnitObject";
import { TileEvent } from "./TileEvent";


const { RatificationError } = CommandHelpers;

interface MoveUnitEventOptions {
  actor: UnitObject;
  path: CardinalDirection[];
  goal: Point;
  target?: Point;
  assets: BattleSceneControllers;
}

export class MoveUnitEvent extends TileEvent {

  protected options: MoveUnitEventOptions;
  private focalSwap?: PositionContainer;
  private goalWorldPosition: Point;

  constructor(options: MoveUnitEventOptions) {
    super(options.target || options.goal);
    this.options = {...options};
    this.goalWorldPosition = options.goal.multiply(Game.display.standardLength);
  }

  // TODO How should this work? This is already written by Command.Move.ratify, I could just pass it in.
  // Granted, I hvae more control here if I'm allowed to break it up.
  // A ratify() method makes all changes instantly, but if I wanted to subtract funds sequentially I'd need
  // to spread that instant change over time.
  protected ratifyMovement() {
    const { map, scenario, players } = this.options.assets;
    const { actor, path, goal } = this.options;

    const place = actor.boardLocation;

    if (!map.moveUnit(place, goal))
      throw new RatificationError(`could not move unit ${place.toString()} → ${goal.toString()}`);

    if (actor.type !== Unit.Rig || !scenario.rigsInfiniteGas)
      actor.gas -= map.travelCostForPath(place, path, actor.moveType);

    // Make neighbors visible — (part of ambush animation)
    map.neighborsAt(goal).orthogonals.forEach( square => square.hideUnit = false );
  }

  protected create(): void {
    const { mapCursor, trackCar, camera } = this.options.assets;
    const { actor, path, target } = this.options;

    if (target) {
      mapCursor.mode = 'target';
      mapCursor.show();
    }

    // Calculate camera focal point determiner
    const size = Game.display.standardLength;
    const viewRect = camera.transform.worldRect();
    const unitRect = new Rectangle(trackCar.transform, size, size);
    const alreadyOnScreen = viewRect.intersects(unitRect);

    // Set camera focal point during move
    this.focalSwap = camera.focalTarget;
    camera.focalTarget = (alreadyOnScreen)
      ? {position: this.goalWorldPosition}  // Prefers the goal position if the camera doesn't
      : trackCar.transform;                 // need to move to 'see' the whole movement path.

    // Configure track car
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