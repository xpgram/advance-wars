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
    const { abs } = Math;
    const tileSize = Game.display.standardLength;
    const maxDist = Math.floor(tileSize*.5);
    const maxZoomDiff = .025;

    // Auto assign new borders — no approach
    actual.border = target.border;

    // Zoom
    const zDiff = target.zoom - actual.zoom;
    const zVector = Common.clamp(
      zDiff, -maxZoomDiff, maxZoomDiff);
    if (zVector !== 0)
      actual.zoomToPoint(actual.zoom + zVector, focal);

    // Move
    const finalzoom = actual.clone();
    finalzoom.zoomToPoint(target.zoom, focal);

    // Func: when zooming, travel proportional to zoom completion, else cap speed as normal.
    let zoomRatio = abs(zVector) / abs(zDiff);
    const axisFunction = (x: number) => (target.zoom === actual.zoom)
      ? Common.clamp(x, -maxDist, maxDist)
      : x*zoomRatio;

    // Limit travel vector
    const tVector = new Point(target.worldRect())
      .subtract(new Point(finalzoom.worldRect()))
      .apply(axisFunction);

    // Apply travel vector
    actual.position = actual.position.add(tVector);

    return actual;
  }
}