
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
  private getTileSize(zoom: number) {
    if (Game.devController.pressed(Keys.K))
      console.log(this.quanta * zoom);
    return this.quanta * zoom;
  }

  /**  */
  private updateTarget(camera: Camera) {
    const tileSize = this.getTileSize(camera.zoom);
    const focal = camera.getFocalPoint();

    if (!camera.subjectInView) {
      this.target.set(focal);
      this.updateTargetFlag = true;
    }
    
    else if (this.updateTargetFlag) {
      this.updateTargetFlag = false;

      const { viewFrame } = camera;

      // Truncates an integer x or x+w in the directional bias of vx.
      const func = (x: number, vx: number, w: number) => {
        const trunc = [Math.floor, Math.round, Math.ceil][Math.sign(vx) + 1];
        return trunc((x + Number(vx > 0)*w) / tileSize) * tileSize;
      }

      // Set the target point to the nearest map tile in the direction of last travel.
      this.target.set(
        func(viewFrame.x, this.lastTravelVector.x, viewFrame.width),
        func(viewFrame.y, this.lastTravelVector.y, viewFrame.height),
      )
    }
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
    this.lastTravelVector.set(travelVector);
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
