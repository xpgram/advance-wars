import { Game } from "..";
import { Camera } from "./Camera";
import { Point } from "./Common/Point";
import { Rectangle } from "./Common/Rectangle";
import { Common } from "./CommonUtils";
import { Keys } from "./controls/KeyboardObserver";

// TODO [x] FollowAlgorithm (rename?) for following targets
// TODO [ ] TravelAlgorithm for approaching camera ViewRect
export interface FollowAlgorithm {
  update(camera: Camera): void;
}


export class QuantizedScreenPush {
  private target = Point.Origin;
  private lastTravelVector = Point.Origin;
  private quanta = Game.display.standardLength;
  private lastZoom = -1;

  update(camera: Camera) {
    this.updateTarget(camera);
    this.approach(camera);
  }

  /**  */
  // TODO This should be a service offered by camera, honestly.
  private getTileSize(zoom: number) {
    return this.quanta * zoom;
  }

  /**  */
  private updateTarget(camera: Camera) {
    const { floor, ceil, sign } = Math;
    const self = (n: number) => n;

    // Suspend grid-snapping flag — tmp until I finish camera refactor
    const zooming = (this.lastZoom !== camera.zoom);

    const tileSize = this.getTileSize(camera.zoom);
    const focal = camera.getFocalPoint().multiply(camera.zoom);
    const viewFrame = this.getViewFrame(camera);

    // Returns either the focal point or a quantized target point in the direction of bias.
    function getAxis(focal: number, bias: number, camX: number, camW: number) {
      const left = camX;
      const right = camX + camW;
      
      if (!Common.within(focal, left, right) || zooming)
        return focal;

      const trunc = [floor, self, ceil][sign(bias) + 1];
      const cameraSide = (bias < 0) ? left : right;

      return trunc(cameraSide / tileSize) * tileSize;
    }

    // Quantize the camera lead axis-independently.
    this.target.set(
      getAxis(focal.x, this.lastTravelVector.x, viewFrame.x, viewFrame.width),
      getAxis(focal.y, this.lastTravelVector.y, viewFrame.y, viewFrame.height),
    );

    // Update tracker for zoom detection
    this.lastZoom = camera.zoom;
  }

  /**  */
  private approach(camera: Camera) {
    const tileSize = this.getTileSize(camera.zoom);
    const maxTravelDistance = Math.floor(tileSize*.5 / camera.zoom);
    const frame = this.getViewFrame(camera);

    // Determine raw travel vector
    const travelVector = new Point(
      Common.displacementFromRange(this.target.x, frame.left, frame.right),
      Common.displacementFromRange(this.target.y, frame.top, frame.bottom),
    );

    // Limit camera speed this frame
    travelVector.x = Common.clamp(travelVector.x, -maxTravelDistance, maxTravelDistance);
    travelVector.y = Common.clamp(travelVector.y, -maxTravelDistance, maxTravelDistance);

    // Move the camera.
    camera.pos = camera.pos.add(travelVector);
    this.lastTravelVector.set(
      travelVector.x !== 0 ? travelVector.x : this.lastTravelVector.x,
      travelVector.y !== 0 ? travelVector.y : this.lastTravelVector.y,
    );
  }

  /**  */
  private getViewFrame(camera: Camera) {
    const tileSize = this.getTileSize(camera.zoom);

    const border = tileSize*2;
    const horzBorder = Math.floor(tileSize*.5);

    // TODO Build subject-frame border because camera doesn't for some reason.
    camera.borderRect = new PIXI.Rectangle(
      border + horzBorder,
      border,
      camera.worldFrame.width - 2*border - 2*horzBorder - tileSize,
      camera.worldFrame.height - 2*border - tileSize,
    );

    // TODO Build subject-frame as rectangle because camera doesn't for some reason.
    return new PIXI.Rectangle(
      camera.viewFrame.x,
      camera.viewFrame.y,
      camera.viewFrame.width,
      camera.viewFrame.height,
    );
  }

}
