import { Game } from "../../../..";
import { CardinalDirection, SumCardinalsToVector } from "../../../Common/CardinalDirection";
import { Point } from "../../../Common/Point";
import { Rectangle } from "../../../Common/Rectangle";
import { PositionContainer } from "../../../CommonTypes";
import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { CommandHelpers } from "../../turn-machine/Command.helpers";
import { Unit } from "../../Unit";
import { CommonRangesRetriever } from "../../unit-actions/RegionMap";
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

    // TODO When skipping animations, this still needs to reveal all relevant places.
    // I guess a second pass wouldn't really hurt anything.
    // I'ma do this step first.

    // TODO I jus realize this be identical to ResetPerspective.
    // So. A feature of Map, then? I guess.

    const visRegion = CommonRangesRetriever({min: 0, max: actor.vision});
    for (let i = 0; i < path.length; i++) {
      const loc = place.add(SumCardinalsToVector(path.slice(0,i+1)));
      visRegion.points.forEach( p => {
        const tilePoint = loc.add(p);
        if (!map.validPoint(tilePoint))
          return;
        
        const tile = map.squareAt(tilePoint);
        const deepSight = (loc.manhattanDistance(tilePoint) <= 1)
          || players.perspective.officer.CoPowerInEffect;
        const revealable = !tile.terrain.conceals || deepSight;
        if (revealable)
          tile.hiddenFlag = false;
      })
    }
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

    // TODO When trackCar moves from one tile to another, reveal that vis region.

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