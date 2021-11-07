import { TurnState } from "../TurnState";
import { AnimateBattle } from "./AnimateBattle";

export class AnimateMoveUnit extends TurnState {
  get name() { return 'AnimateMoveUnit'; }
  get revertible() { return true; }
  get skipOnUndo() { return true; }

  configureScene() {
    const { map, camera, trackCar } = this.assets;
    const { actor, path } = this.data;

    // Clear markings from the board
    map.clearMovementMap();

    // Set camera to follow the car
    camera.followTarget = trackCar;

    // Reset track car's animation and show it
    trackCar.buildNewAnimation(actor);
    trackCar.directions = path;
    trackCar.show();
    trackCar.start();
  }

  update() {
    const { trackCar } = this.assets;
    if (trackCar.finished)
      this.advanceToState(AnimateBattle);
  }

  prev() {
    const { camera, mapCursor } = this.assets;
    camera.followTarget = mapCursor;
  }
}