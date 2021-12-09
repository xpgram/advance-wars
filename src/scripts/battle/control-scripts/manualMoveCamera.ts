import { Camera } from "../../Camera";
import { Point } from "../../Common/Point";
import { TransformContainer } from "../../CommonTypes";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { ControlScript } from "../../ControlScript";
import { TurnModerator } from "../TurnModerator";

const CAMERA_SPEED = 7;   // How many tiles the camera travels per 60 frames (per second).

/**  */
export class ManualMoveCamera extends ControlScript {
  defaultEnabled(): boolean { return false; }

  private camera: Camera;
  private gamepad: VirtualGamepad;

  private lastMoveDir = Point.Origin;
  private followTargetSwap: TransformContainer | Point | null = null;
  private players: TurnModerator;


  constructor(gamepad: VirtualGamepad, camera: Camera, players: TurnModerator) {
    super();
    this.gamepad = gamepad;
    this.camera = camera;
    this.players = players;
  }

  /** Sets all units' transparency flag to the given value. */
  private setUnitTransparency(show: boolean) {
    const { gamepad, players } = this;

    const showUnits = (gamepad.button.leftTrigger.down);
    const showStatusUnits = (gamepad.button.rightTrigger.down);

    players.allUnits.forEach( unit => {
      const statusUnit = (unit.faction === players.current.faction && unit.statusApplied);
      unit.transparent = !show && !showUnits && !(showStatusUnits && statusUnit);
    });
  }

  protected enableScript(): void {
    const { gamepad, camera } = this;

    this.setUnitTransparency(false);

    // Save old camera configuration — disable the camera's follow algorithm
    this.followTargetSwap = camera.followTarget;
    camera.followTarget = null;
  }

  protected updateScript(): void {
    const { camera, map, gamepad } = this;
    const { dpad } = gamepad.axis;

    // Update last axis input, if any were given.
    if (dpad.point.x !== 0) this.lastMoveDir.x = dpad.point.x;
    if (dpad.point.y !== 0) this.lastMoveDir.y = dpad.point.y;

    const dirPoint = dpad.point.unit();
    const travelPoint = dirPoint.multiply(CAMERA_SPEED);
    camera.pos = camera.pos.add(travelPoint);

    // Confine the camera to the map space
    // TODO
  }

  protected disableScript(): void {
    const { camera } = this;
    this.setUnitTransparency(true);
    camera.followTarget = this.followTargetSwap;
  }
  
}