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

    const aView = actual.worldRect();
    const tView = target.worldRect();

    const tVector = new Point(tView)
      .subtract(new Point(aView))
      .apply(x => Common.clamp(x, -maxDist, maxDist));
    const zVector = Common.clamp(
      target.zoom - actual.zoom, -maxZoomDiff, maxZoomDiff);
    // bVector => border

    actual.setPosition( actual.position.add(tVector) );
    actual.setZoom( actual.zoom + zVector );
    return actual;
  }
}