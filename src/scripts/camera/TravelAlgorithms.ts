import { Game } from "../..";
import { Point } from "../Common/Point";
import { Common } from "../CommonUtils";
import { ViewRect } from "./ViewRect";


/** Accepts two ViewRects: actual and approach. */
export interface TravelAlgorithm {
  /** Alters actual ViewRect to be incrementally closer to target. */
  update(actual: ViewRect, target: ViewRect): ViewRect;
}

export class LinearApproach implements TravelAlgorithm {
  update(actual: ViewRect, target: ViewRect): ViewRect {
    const tileSize = Game.display.standardLength;
    const maxDist = Math.floor(tileSize*.5);
    const maxZoomDiff = .1;

    const tVector = new Point(target.worldRect())
      .subtract(new Point(actual.worldRect()))
      .apply(x => Common.clamp(x, -maxDist, maxDist));
    const zVector = Common.clamp(
      target.zoom - actual.zoom, -maxZoomDiff, maxZoomDiff);

    actual.position = actual.position.add(tVector);
    actual.zoom += zVector;
    actual.border = target.border;  // Vector is instant
    
    return actual;
  }
}