import { TurnState } from "../TurnState";
import { TransformContainer } from "../../../CommonTypes";
import { PointPrimitive, Point } from "../../../Common/Point";
import { Camera } from "../../../Camera";
import { Game } from "../../../..";
import { Debug } from "../../../DebugUtils";
import { BattleSystemManager } from "../BattleSystemManager";

export class MoveCamera extends TurnState {
    get name(): string { return "MoveCamera"; }
    get revertible(): boolean { return true; }
    get skipOnUndo(): boolean { return true; }

    private followTargetSwap!: TransformContainer | PointPrimitive | null;

    private cameraSpeed = 6;        // How many tiles the camera travels per 60 frames.
    private followPoint: Point;     // The point the camera follows in this mode.
    private lastMoveDir = new Point();  // The last axis input to the camera driver.

    constructor(manager: BattleSystemManager) {
        super(manager);

        let tileSize = Game.display.standardLength;
        this.followPoint = new Point({
            x: this.assets.mapCursor.pos.x * tileSize,
            y: this.assets.mapCursor.pos.y * tileSize
        });
    }

    protected assert(): void {
        
    }

    protected configureScene(): void {
        // Fade units to reveal map
        if (this.assets.gamepad.button.leftTrigger.up)
            this.setUnitTransparency(true);

        // Save old camera configuration
        this.followTargetSwap = this.assets.camera.followTarget;

        // Note: This assumes that Camera is using the BorderedScreenPush follow algorithm.
        // It would be ideal to save the camera's follow algorithm and provide BorderedScreenPush ourselves.

        // Assume control of camera
        this.assets.camera.followTarget = this.followPoint;
    }

    update(): void {
        // When B is released, revert to previous state.
        if (this.assets.gamepad.button.B.up)
            this.battleSystemManager.regressToPreviousState();
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
            dirPoint.x *= this.cameraSpeed;
            dirPoint.y *= this.cameraSpeed;

            // TODO Use follow point to move the camera because...
            // For now, move followPoint out of the way to it doesn't trigger the camera's aggressive follow algorithm.
            this.followPoint.x = this.assets.camera.center.x + dirPoint.x;
            this.followPoint.y = this.assets.camera.center.y + dirPoint.y;

            // Move the camera
            this.assets.camera.x += dirPoint.x;
            this.assets.camera.y += dirPoint.y;

            // TODO Adjusting this.followPoint does not adjust camera.followTarget, even though
            // they should be the same object. Why?
            this.assets.camera.followTarget = this.followPoint;
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
            let place = {x: Math.floor(x / tileSize),
                         y: Math.floor(y / tileSize)};
        
            // Final move order
            this.assets.mapCursor.teleport(place);
        }

        // Reconfigure old camera
        this.assets.camera.followTarget = this.followTargetSwap;

        // Fix UI after cursor movement.
        // TODO this.assets.uiSystem.skipAnimation();
    }

    /** Sets all units' transparency flag to the given value. */
    private setUnitTransparency(val: boolean) {
        this.assets.unitsList.forEach( unit => {
            unit.transparent = val;
        });
    }

    advanceStates = {

    }
}