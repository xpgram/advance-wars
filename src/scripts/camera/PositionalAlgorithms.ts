import { Point } from "../Common/Point";
import { Common } from "../CommonUtils";
import { ViewRect } from "./ViewRect";


/** Accepts a ViewRect and a focal target: target and subject. */
export interface PositionalAlgorithm {
  /** Alters ViewRect to keep focal in view. */
  update(rect: ViewRect, focal: Point): ViewRect;
}

export class ScreenPush implements PositionalAlgorithm {
  update(rect: ViewRect, focal: Point): ViewRect {
    const view = rect.subjectRect();
    const travelVector = new Point(
      Common.displacementFromRange(focal.x, view.left, view.right),
      Common.displacementFromRange(focal.y, view.top, view.bottom),
    );

    rect.setPosition(rect.position.add(travelVector));
    return rect;
  }
}