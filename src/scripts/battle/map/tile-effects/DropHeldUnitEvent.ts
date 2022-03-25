import { CardinalDirection, CardinalVectorToCardinal } from "../../../Common/CardinalDirection";
import { Point } from "../../../Common/Point";
import { TrackCar } from "../../TrackCar";
import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { UnitObject } from "../../UnitObject";
import { TileEvent } from "./TileEvent";


interface DropHeldUnitEventOptions {
  actor: UnitObject;
  drop: {which: number, where: Point}[];
  assets: BattleSceneControllers;
}

export class DropHeldUnitEvent extends TileEvent {

  private options: DropHeldUnitEventOptions;

  private dropCars!: TrackCar[];

  constructor(options: DropHeldUnitEventOptions) {
    super(options.actor.boardLocation);
    this.options = {...options};
  }

  private ratifyDrop() {
    const { map, players } = this.options.assets;
    const { actor, drop } = this.options;

    if (drop.length === 0)
      return;

    drop
      .sort( (a,b) => b.which - a.which )
      .forEach( instruction => {
        const unit = actor.unloadUnit(instruction.which);
        map.placeUnit(unit, instruction.where);
        map.revealSightMapLocation(instruction.where, players.perspective, unit);
        unit.spent = true;
      });
  }

  protected create(): void {
    const { actor, drop } = this.options;

    // Setup drop trackCar animations
    this.dropCars = drop.map( d => {
      const unit = actor.cargo[d.which];
      const dirPoint = d.where.subtract(actor.boardLocation);
      const dir = CardinalVectorToCardinal(dirPoint);

      if (dir === CardinalDirection.None)
        throw new Error(`Cannot determine drop path from ${actor.boardLocation.toString()} to ${d.where.toString()}`);

      const car = new TrackCar();
      car.buildNewAnimation(unit, actor.boardLocation);
      car.directions = [dir];
      car.show();
      car.start();
      return car;
    });
  }
  
  protected update(): void {
    if (this.dropCars.every( c => c.finished )) {
      this.ratifyDrop();
      this.finish();
    }
  }

  protected destroy(): void {
    this.dropCars.forEach( c => c.destroy() );
    //@ts-expect-error
    this.options = undefined;
  }
}