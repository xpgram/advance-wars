import { Game } from "../..";
import { Point } from "../Common/Point";
import { Common } from "../CommonUtils";
import { Camera } from "./Camera_refactor";
import { ViewRect } from "./ViewRect";

// TODO I wanted to confine PositionalAlg to returning target ViewRects only,
// but I need the full camera sometimes to answer questions.
// So, what then is the difference between Positional and Travel?
// How do I force devs to return two different-purpose views in either alg?
// Will my father ever come home?
// I can answer the first two if I think about them really hard, but I won't.

/** Accepts a ViewRect and a focal target: target and subject. */
export interface PositionalAlgorithm {
  /** Returns a ViewRect which keeps focal in view. */
  update(rect: ViewRect, focal: Point, camera: Camera): ViewRect;
}

export class ScreenPush implements PositionalAlgorithm {
  private lastTravelVector = new Point();

  private quantize(x: number, bias: number): number {
    const { floor, ceil, sign } = Math;
    const self = (n: number) => n;
    const trunc = [floor, self, ceil][sign(bias) + 1];
    const size = Game.display.standardLength;
    return trunc(x / size) * size;
  }
  
  update(rect: ViewRect, focal: Point, camera: Camera): ViewRect {
    const { floor } = Math;

    const last = rect.clone();

    // Find new target position
    const view = rect.subjectRect();
    const travelVector = new Point(
      Common.displacementFromRange(focal.x, view.left, view.right),
      Common.displacementFromRange(focal.y, view.top, view.bottom),
    );
    rect.position = rect.position.add(travelVector);

    // Quantize
    const srect = rect.subjectRect();
    const asrect = camera.currentTransform().subjectRect();
    const border = rect.border;

    const qx = (Common.within(focal.x, asrect.left, asrect.right))
      ? this.quantize(srect.x, this.lastTravelVector.x) - border.left
      : rect.position.x;
    const qy = (Common.within(focal.y, asrect.top, asrect.bottom))
      ? this.quantize(srect.y, this.lastTravelVector.y) - border.top
      : rect.position.y;

    rect.position.set(qx, qy);

    // Set new quantize parameters for next update
    const vector = rect.vectorFrom(last);
    this.lastTravelVector.set(
      vector.position.x !== 0 ? vector.position.x : this.lastTravelVector.x,
      vector.position.y !== 0 ? vector.position.y : this.lastTravelVector.y,
    );

    return rect;
  }

}
