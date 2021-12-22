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
    const { max } = Math;
    const tileSize = Game.display.standardLength;
    const maxDist = Math.floor(tileSize*.5);
    const maxZoomDiff = .025;

    const preZoom = actual.clone();

    // Zoom
    const zVector = Common.clamp(
      target.zoom - actual.zoom, -maxZoomDiff, maxZoomDiff);
    actual.zoomToPoint(actual.zoom + zVector, focal);

    // Get travel distance from zoom operation
    const zoomVector = actual.vectorFrom(preZoom);
    const zoomTravelDist = zoomVector.position;

    // Limit distance by zoom travel
    const tVector = new Point(target.worldRect())
      .subtract(new Point(actual.worldRect()));
    const maxTx = max(tVector.x - zoomTravelDist.x, 0);
    const maxTy = max(tVector.x - zoomTravelDist.y, 0);
    tVector.set(
      Common.clamp(tVector.x, -maxTx, maxTx),
      Common.clamp(tVector.y, -maxTy, maxTy),
    )

    // Normal camera movement
    actual.position = actual.position.add(tVector);

    // Auto assign new borders — no approach
    actual.border = target.border;
    
    return actual;
  }
}