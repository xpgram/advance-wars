
import { Game } from "..";
import { Camera } from "./Camera";
import { Point } from "./Common/Point";
import { Common } from "./CommonUtils";

export interface FollowAlgorithm {
  update(camera: Camera): void;
}

export const QuantizedScreenPush = {
  target: Point.Origin,
  updateTarget: true,
  lastTravelVector: Point.Origin,
  quanta: Game.display.standardLength,
  
  update(camera: Camera) {
    const { floor, round } = Math;
    const { quanta } = this;

    const border = quanta*2;
    const horzBorder = floor(quanta*.5);
    const maxTravelDistance = floor(quanta*.5);

    const focal = camera.getFocalPoint();

    // TODO Build subject-frame border because camera doesn't for some reason.
    camera.borderRect.fit(new PIXI.Rectangle(
      border + horzBorder,
      border,
      camera.worldFrame.width - 2*border - 2*horzBorder,
      camera.worldFrame.height - 2*border,
    ));

    // TODO Build subject-frame as rectangle because camera doesn't for some reason.
    const viewFrame = new PIXI.Rectangle(
      camera.viewFrame.x,
      camera.viewFrame.y,
      camera.viewFrame.x + camera.viewFrame.width,
      camera.viewFrame.y + camera.viewFrame.height,
    );

    // TODO I forgot what I was here for.
    // [ ] If focal not in view, pick a target point in the direction of the focal.
    //     Draw a vector from camera center to focal and limit by speed or distance to in-view.
    // [ ] If focal is in view, pick a target point that is the closest tile position
    //     in the direction of last movement vector.
    // [ ] If focal is in view, pick a tile target *once*, not every update.

    // Update travel-to target
    if (!camera.subjectInView) {
      this.target.set(focal);
      this.updateTarget = true;
    } else if (this.updateTarget) {
      this.target.set(
        round((camera.x + this.lastTravelVector.x) / quanta) * quanta,
        round((camera.y + this.lastTravelVector.y) / quanta) * quanta,
      )
      this.updateTarget = false;
    }

    // Determine raw travel vector
    const travelVector = new Point(
      Common.displacementFromRange(this.target.x, viewFrame.left, viewFrame.right),
      Common.displacementFromRange(this.target.y, viewFrame.top, viewFrame.bottom),
    );

    // Limit camera speed this frame
    travelVector.x = Common.clamp(travelVector.x, -maxTravelDistance, maxTravelDistance);
    travelVector.y = Common.clamp(travelVector.y, -maxTravelDistance, maxTravelDistance);

    // Move the camera.
    camera.pos = camera.pos.add(travelVector);
  },
}