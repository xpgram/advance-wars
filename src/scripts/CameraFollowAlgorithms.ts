
import { Game } from "..";
import { Camera } from "./Camera";
import { Point } from "./Common/Point";
import { Common } from "./CommonUtils";
import { Keys } from "./controls/KeyboardObserver";

export interface FollowAlgorithm {
  update(camera: Camera): void;
}

export class QuantizedScreenPush {
  private target = Point.Origin;
  private updateTargetFlag = true;
  private lastTravelVector = Point.Origin;
  private quanta = Game.display.standardLength;

  update(camera: Camera) {
    this.updateTarget(camera);
    this.approach(camera);
  }

  /**  */
  private updateTarget(camera: Camera) {
    const { round } = Math;
    const { quanta } = this;
    const focal = camera.getFocalPoint();

    if (!camera.subjectInView) {
      this.target.set(focal);
      this.updateTargetFlag = true;
    }
    
    else if (this.updateTargetFlag) {
      this.updateTargetFlag = false;

      const { viewFrame } = camera;

      const camTile = new Point(viewFrame).multiply(1 / quanta);
      const camTileIdeal = camTile.round();

      if (camTile.notEqual(camTileIdeal)) {
        this.target.set(
          round((viewFrame.x + this.lastTravelVector.x/4 + Number(this.lastTravelVector.x > 0)*viewFrame.width) / quanta) * quanta,
          round((viewFrame.y + this.lastTravelVector.y/4 + Number(this.lastTravelVector.y > 0)*viewFrame.height) / quanta) * quanta,
        )
      }
    }
  }

  /**  */
  private approach(camera: Camera) {
    const { quanta } = this;
    const maxTravelDistance = Math.floor(quanta*.5);
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
    this.lastTravelVector.set(travelVector);
  }

  /**  */
  private getViewFrame(camera: Camera) {
    const { quanta } = this;

    const border = quanta*2;
    const horzBorder = Math.floor(quanta*.5);

    // TODO Build subject-frame border because camera doesn't for some reason.
    camera.borderRect = new PIXI.Rectangle(
      border + horzBorder,
      border,
      camera.worldFrame.width - 2*border - 2*horzBorder - quanta,
      camera.worldFrame.height - 2*border - quanta,
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
