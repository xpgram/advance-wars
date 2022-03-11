import { Game } from "../..";
import { MapCursor } from "../battle/map/MapCursor";
import { Camera } from "../camera/Camera";
import { Point } from "../Common/Point";


interface Options {
  readonly stage: PIXI.Container,
  readonly mapCursor: MapCursor;
  readonly camera: Camera;
}

// TODO This is currently located in src/scripts/system, and it's hard to want to move it.
// If it's going to be there (here), though, it needs to be generalized.
// This is a controller object much like VirtualGamepad and it needs to be integrated with
// the more global systems; BattleSceneControllers should add the cursor behavior, this
// script shouldn't be coupled.

// If the above is to be considered, however, what am I factoring out, exactly?
// Game.stage already has all the tools I need.
// What's needed isn't this managing class, it's an aptly named handle to alleviate
// vagueness in the code.

export class WorldPointerController {

  private options: Options;

  constructor(options: Options) {
    this.options = options;

    const { stage, mapCursor, camera } = this.options;
    const tileSize = Game.display.standardLength;

    stage.addListener('mousemove', (e) => {
      const pointer_raw = new Point(e.data.getLocalPosition(stage));
      const mapPos = pointer_raw.apply(n => Math.floor(n / tileSize));
      mapCursor.moveTo(mapPos);
    })
  }

  destroy() {
    this.options.stage.interactive = false;
    //@ts-ignore
    this.options = undefined;
  }

  get enabled() { return this.options.stage.interactive; }
  set enabled(b) { this.options.stage.interactive = b; }

}