import { Game } from "../../../..";
import { PIXI } from "../../../../constants";
import { Slider } from "../../../Common/Slider";
import { Debug } from "../../../DebugUtils";
import { Timer } from "../../../timer/Timer";
import { TurnState } from "../TurnState";


export class ShowMinimap extends TurnState {
  get type() { return ShowMinimap; }
  get name() { return 'ShowMinimap'; }
  get revertible() { return true; }
  get skipOnUndo() { return false; }

  private readonly dimmer = new PIXI.Graphics();
  private readonly fadeTime = .15;
  private readonly fadeMax = .4;
  private readonly troopIconModeSlider = new Slider({
    max: 3,
    granularity: 1,
    looping: true,
  });

  configureScene() {
    const { minimap, scripts } = this.assets;
    minimap.rebuildContents();
    minimap.show();
    scripts.manualMoveCamera.enable();

    this.troopIconModeSlider.setToMin();
    
    this.dimmer.beginFill(0);
    this.dimmer.drawRect(0,0, Game.display.renderWidth, Game.display.renderHeight);
    this.dimmer.endFill();
    this.dimmer.alpha = 0;
    Game.scene.visualLayers.hud.addChildAt(this.dimmer, 0);
    Timer.tween(this.fadeTime, this.dimmer, {alpha: this.fadeMax});
  }

  update() {
    const { scripts, gamepad, stagePointer, minimap } = this.assets;

    // Signal on minimap.click that the camera should move to pointer location.
    if (minimap.clickController.button.down) {
      const pos = minimap.clickController
        .pointerLocation()
        .multiply(1/4)
        .apply(Math.floor)
        .multiply(16);
      scripts.manualMoveCamera.toPointerPosition(pos);
    }

    // Allow swapping of troop-icon modes for ease of visibility
    if (gamepad.button.X.pressed) {
      const modes = ['blink','on','off'] as const;
      this.troopIconModeSlider.increment();
      minimap.troopMode = modes[this.troopIconModeSlider.output];
    }
    
    // On press B, regress to last state
    if (gamepad.button.B.pressed || gamepad.button.select.pressed || stagePointer.clicked())
      this.regress();
  }

  close() {
    const { mapCursor, uiSystem, scripts } = this.assets;
    mapCursor.teleportTo(scripts.manualMoveCamera.finalCursorPosition());
    uiSystem.skipAnimations();

    Timer.tween(this.fadeTime, this.dimmer, {alpha: 0})
      .at('end')
      .do(() => this.dimmer.destroy());
  }

}