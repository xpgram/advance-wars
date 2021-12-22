import { Game } from "../..";
import { Point } from "../Common/Point";
import { Common } from "../CommonUtils";
import { ViewRect } from "./ViewRect";


/** Accepts two ViewRects: actual and approach. */
export interface TravelAlgorithm {
  /** Alters actual ViewRect to be incrementally closer to target. */
  update(actual: ViewRect, target: ViewRect, focal: Point): ViewRect;
}

export class LinearApproach implements TravelAlgorithm {
  update(actual: ViewRect, target: ViewRect, focal: Point): ViewRect {
    const tileSize = Game.display.standardLength;
    const maxDist = Math.floor(tileSize*.5);
    const maxZoomDiff = .025;

    // Auto assign new borders — no approach
    actual.border = target.border;

    // Zoom
    const zVector = Common.clamp(
      target.zoom - actual.zoom, -maxZoomDiff, maxZoomDiff);
    if (zVector !== 0) {
      actual.zoomToPoint(actual.zoom + zVector, focal);
      return actual;
    }

    // TODO I could clean up the minor movements needed after zoom if I knew
    // what the final zoom position of actual would look like.
    // Probably zoomToPoint(target.zoom, focal) would do this for me.

    // Move
    const tVector = new Point(target.worldRect())
      .subtract(new Point(actual.worldRect()))
      .apply(x => Common.clamp(x, -maxDist, maxDist));
    actual.position = actual.position.add(tVector);
    return actual;
  }
}