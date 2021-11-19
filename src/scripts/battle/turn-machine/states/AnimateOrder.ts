import { TurnState } from "../TurnState";
import { AnimateBattle } from "./AnimateBattle";
import { AnimateDropUnit } from "./AnimateDropUnit";
import { AnimateMoveUnit } from "./AnimateMoveUnit";
import { AnimateStandbyEvents } from "./AnimateStandbyEvents";

/** This step is a shorthand for collection of animation steps. */
export class AnimateOrder extends TurnState {
  get type() { return AnimateOrder; }
  get name(): string { return 'AnimateOrder'; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return true; }

  protected configureScene(): void {
    this.advance(
      AnimateMoveUnit,
      AnimateDropUnit,
      AnimateStandbyEvents,
      AnimateBattle,
    );
  }

}