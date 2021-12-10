
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
    const { floor } = Math;
    const { quanta } = this;

    const border = quanta*2;
    const horzBorder = floor(quanta*.5);
    const maxTravelDistance = floor(quanta*.5);

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

    const focal = camera.getFocalPoint();
    const travelVector = new Point();

    // TODO I forgot what I was here for.
    // [ ] If focal not in view, pick a target point in the direction of the focal.
    //     Draw a vector from camera center to focal and limit by speed or distance to in-view.
    // [ ] If focal is in view, pick a target point that is the closest tile position
    //     in the direction of last movement vector.
    // [ ] If focal is in view, pick a tile target *once*, not every update.
    const frame = new PIXI.Rectangle();
    const tvectorX = Common.displacementFromRange(focal.x, frame.left, frame.right);
    // Perfect! Finally.

    // TODO Clunky travel dist around subject-frame gap
    // Pattern is [distance from left], 0, [distance from right]
    if (!Common.within(focal.x, viewFrame.left, viewFrame.right))
      travelVector.x = focal.x - ((focal.x < viewFrame.left) ? viewFrame.left : viewFrame.right);
    if (!Common.within(focal.y, viewFrame.top, viewFrame.bottom))
      travelVector.y = focal.y - ((focal.y < viewFrame.top) ? viewFrame.top : viewFrame.bottom);

    // Limit camera speed this frame
    travelVector.x = Common.clamp(travelVector.x, -maxTravelDistance, maxTravelDistance);
    travelVector.y = Common.clamp(travelVector.y, -maxTravelDistance, maxTravelDistance);

    // Move the camera.
    camera.pos = camera.pos.add(travelVector);
  },
}