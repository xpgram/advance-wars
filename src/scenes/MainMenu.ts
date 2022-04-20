import { Game } from "..";
import { VirtualGamepad } from "../scripts/controls/VirtualGamepad";
import { Scene } from "./Scene";



/**
 * @author Dei Valko
 * @version 0.0.1
 */
export class MainMenuScene extends Scene {

  // TODO Resources

  gamepad!: VirtualGamepad;

  loadStep(): void {
    // Testing...
    // this.linker.push({name: 'background', url: 'assets/background-battle.png'});
  }

  setupStep(): void {
    this.gamepad = new VirtualGamepad();

    const g = new PIXI.Graphics();
    g.beginFill(0);
    g.drawCircle(32,32, 32);
    g.endFill();
    Game.stage.addChild(g);
  }

  updateStep(): void {
    this.gamepad.update();
    console.log(this.gamepad.button.A.pressed);
    if (this.gamepad.button.A.pressed)
      Game.switchScene(Game.gameScenes.battleScene);
  }

  destroyStep(): void {
    // TODO Ye, but not here.
    const children = Game.stage.removeChildren();
    children.forEach( c => c.destroy() );
  }

}