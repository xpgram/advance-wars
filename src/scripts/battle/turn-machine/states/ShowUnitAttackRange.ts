import { TurnState } from "../TurnState";
import { Game } from "../../../..";

const EXIT_FRAME_DELAY = 2;

export class ShowUnitAttackRange extends TurnState {
  get type() { return ShowUnitAttackRange; }
  get name(): string { return "ShowUnitAttackRange"; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return true; }

  protected configureScene(): void {
    const { map, trackCar } = this.assets;
    const { placeTile, actor } = this.data;

    if (actor.attackReady) {
      map.generateAttackRangeMap(actor);  // Prepare unit's attack range.
      trackCar.buildNewAnimation(actor);  // Enable the trackcar as a visual cue.
      trackCar.show();
      placeTile.hideUnit = true;
    } else {  // No attack range: on small delay, return to previous state.
      const frameSchedule = Game.frameCount + EXIT_FRAME_DELAY;
      Game.workOrders.send( () => {
        if (Game.frameCount === frameSchedule) {
          if (!this.destroyed)
            this.regress();
          return true;
        }
      }, this);
    }
  }

  update(): void {
    const { gamepad } = this.assets;

    // On release B, return to previous state.
    if (gamepad.button.B.up)
      this.regress();
  }

  prev(): void {
    const { map } = this.assets;
    const { placeTile } = this.data;
    placeTile.hideUnit = false;
    map.clearMovementMap();
  }

}