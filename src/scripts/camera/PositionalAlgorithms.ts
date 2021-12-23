import { Game } from "../..";
import { Point } from "../Common/Point";
import { Common } from "../CommonUtils";
import { ViewRect } from "./ViewRect";


/** Accepts a ViewRect and a focal target: target and subject. */
export interface PositionalAlgorithm {
  /** Returns a ViewRect which keeps focal in view. */
  update(rect: ViewRect, focal: Point): ViewRect;
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
  
  update(rect: ViewRect, focal: Point): ViewRect {
    const { floor } = Math;

    const last = rect.clone();

    // Find new target position
    const view = rect.subjectRect();
    const travelVector = new Point(
      Common.displacementFromRange(focal.x, view.left, view.right),
      Common.displacementFromRange(focal.y, view.top, view.bottom),
    );
    rect.position = rect.position.add(travelVector);

    // TODO Lets solve the vibrating cursor first
    // Quantize
    // if (subjectInView && actual === target) ?
    // if (focal.apply(floor).equal(focal)) {
    //   rect.position.set(
    //     this.quantize(rect.position.x, this.lastTravelVector.x),
    //     this.quantize(rect.position.y, this.lastTravelVector.y),
    //   )
    // }

    // Set new quantize parameters for next update
    // const vector = rect.vectorFrom(last);
    // this.lastTravelVector.set(
    //   vector.position.x !== 0 ? vector.position.x : this.lastTravelVector.x,
    //   vector.position.y !== 0 ? vector.position.y : this.lastTravelVector.y,
    // );

    return rect;
  }

}
