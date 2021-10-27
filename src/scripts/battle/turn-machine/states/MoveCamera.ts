import { TurnState } from "../TurnState";
import { TransformContainer } from "../../../CommonTypes";
import { Point } from "../../../Common/Point";
import { Game } from "../../../..";
import { Common } from "../../../CommonUtils";

const CAMERA_SPEED = 7;     // How many tiles the camera travels per 60 frames.

export class MoveCamera extends TurnState {
    get name(): string { return "MoveCamera"; }
    get revertible(): boolean { return true; }
    get skipOnUndo(): boolean { return true; }

    private followTargetSwap!: TransformContainer | Point | null;
    private lastMoveDir = new Point();  // The last axis input to the camera driver.

    protected assert(): void {
        
    }

    protected configureScene(): void {
        // Fade units to reveal map
        if (this.assets.gamepad.button.leftTrigger.up)
            this.setUnitTransparency(true);

        // Save old camera configuration
        this.followTargetSwap = this.assets.camera.followTarget;

        // Disable the camera's follow algorithm
        this.assets.camera.followTarget = null;
    }

    update(): void {
        // On release B, revert to previous state.
        if (this.assets.gamepad.button.B.up)
            this.battleSystemManager.regressToPreviousState(this);
        // Otherwise, move the camera according to movement axis.
        else {
            // Get directional axis
            let dirPoint = this.assets.gamepad.axis.dpad.point;

            // Update last axis input if any were given.
            if (dirPoint.x != 0) this.lastMoveDir.x = dirPoint.x;
            if (dirPoint.y != 0) this.lastMoveDir.y = dirPoint.y;

            // Correct diagonal distance to some line of length ~1.
            if (Math.abs(dirPoint.x) == Math.abs(dirPoint.y)) {
                dirPoint.x *= .71;  // Ratio of 1 to sqrt(2)
                dirPoint.y *= .71;
            }

            // Adjust axis by intended camera speed
            dirPoint.x *= CAMERA_SPEED;
            dirPoint.y *= CAMERA_SPEED;

            // Move the camera
            this.assets.camera.x += dirPoint.x;
            this.assets.camera.y += dirPoint.y;

            // Confine the camera to the map space
            let tileSize = Game.display.standardLength;
            let min = new Point();
            let max = new Point(this.assets.map.width * tileSize, this.assets.map.height * tileSize);

            min.x -= this.assets.camera.frameBorder.x;
            min.y -= this.assets.camera.frameBorder.y;
            max.x -= this.assets.camera.frameBorder.width;
            max.y -= this.assets.camera.frameBorder.height;

            this.assets.camera.x = Common.confine(this.assets.camera.x, min.x, max.x);
            this.assets.camera.y = Common.confine(this.assets.camera.y, min.y, max.y);
        }

        // Allow leftTrigger to show units during camera movement.
        if (this.assets.gamepad.button.leftTrigger.pressed)
            this.setUnitTransparency(false);
        else if (this.assets.gamepad.button.leftTrigger.released)
            this.setUnitTransparency(true);
    }

    prev(): void {
        // Opaquify units to resume gameplay
        this.setUnitTransparency(false);

        // Move mapCursor somewhere appropriate
        let camera = this.assets.camera;
        let tileSize = Game.display.standardLength;
        // TODO Camera view border should be extracted from camera itself.

        if (this.lastMoveDir.notEqual(Point.Origin)) {
            // x-coord placement set to cursor or camera view edge
            let x = this.assets.mapCursor.transform.x;
            if (this.lastMoveDir.x < 0) x = camera.x + tileSize*3;
            if (this.lastMoveDir.x > 0) x = camera.x + camera.width - tileSize*4;

            // y-coord placement set to cursor or camera view edge
            let y = this.assets.mapCursor.transform.y;
            if (this.lastMoveDir.y < 0) y = camera.y + tileSize*2;
            if (this.lastMoveDir.y > 0) y = camera.y + camera.height - tileSize*3;

            // Pare down values to board coordinates
            let place = new Point(
                Math.floor(x / tileSize),
                Math.floor(y / tileSize)
            );
        
            // Final move order
            this.assets.mapCursor.teleport(place);
        }

        // Reconfigure old camera
        this.assets.camera.followTarget = this.followTargetSwap;

        // Fix UI after cursor movement.
        this.assets.uiSystem.skipAnimations();
    }

    /** Sets all units' transparency flag to the given value. */
    private setUnitTransparency(val: boolean) {
        this.assets.allInPlayUnits.forEach( unit => {
            unit.transparent = val;
        });
    }

    advanceStates = {

    }
}