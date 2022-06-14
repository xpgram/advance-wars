import { Game } from "../../../..";
import { PIXI } from "../../../../constants";
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

  configureScene() {
    const { minimap } = this.assets;
    minimap.updateContents();
    minimap.show();
    
    this.dimmer.beginFill(0);
    this.dimmer.drawRect(0,0, Game.display.renderWidth, Game.display.renderHeight);
    this.dimmer.endFill();
    this.dimmer.alpha = 0;
    Game.scene.visualLayers.hud.addChildAt(this.dimmer, 0);
    Timer.tween(this.fadeTime, this.dimmer, {alpha: this.fadeMax});
  }

  update() {
    const { gamepad } = this.assets;

    if (gamepad.button.B.pressed)
      this.regress();
  }

  close() {
    Timer.tween(this.fadeTime, this.dimmer, {alpha: 0})
      .at('end')
      .do(() => this.dimmer.destroy());
  }

}