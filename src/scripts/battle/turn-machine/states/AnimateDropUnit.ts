import { CardinalDirection } from "../../../Common/CardinalDirection";
import { Point } from "../../../Common/Point";
import { TrackCar } from "../../TrackCar";
import { TurnState } from "../TurnState";
import { AnimateBattle } from "./AnimateBattle";

export class AnimateDropUnit extends TurnState {
  get type() { return AnimateDropUnit; }
  get name(): string { return "CheckBoardState"; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return true; }

  dropCars!: TrackCar[];

  configureScene(): void {
    const { trackCar } = this.assets;
    const { actor, goal, drop } = this.data;

    trackCar.show();

    // Setup drop trackCar animations
    this.dropCars = drop.map( d => {
      const unit = actor.loadedUnits[d.which];
      const dirPoint = d.where.subtract(goal);
      const dir = (dirPoint.equal(Point.Left))
        ? CardinalDirection.West
        : (dirPoint.equal(Point.Right))
        ? CardinalDirection.East
        : (dirPoint.equal(Point.Up))
        ? CardinalDirection.North
        : (dirPoint.equal(Point.Down))
        ? CardinalDirection.South
        : CardinalDirection.None;

      if (dir === CardinalDirection.None)
        throw new Error(`Cannot determine drop path from ${goal.toString()} to ${d.where.toString()}`);

      const car = new TrackCar();
      car.buildNewAnimation(unit, goal);
      car.directions = [dir];
      car.show();
      car.start();
      return car;
    });
  }

  update(): void {
    if (this.dropCars.every( c => c.finished ))
      this.advance(AnimateBattle);
  }

  close(): void {
    this.dropCars.forEach( c => c.destroy() );
  }

}