import { Game } from "..";
import { Keys } from "../scripts/controls/KeyboardObserver";
import { ClickableContainer } from "../scripts/controls/MouseInputWrapper";
import { VirtualGamepad } from "../scripts/controls/VirtualGamepad";
import { Timer } from "../scripts/timer/Timer";
import { BattleScene } from "./BattleScene";
import { Scene } from "./Scene";



/**
 * @author Dei Valko
 * @version 0.0.1
 */
export class TitleScreen extends Scene {

  private gamepad!: VirtualGamepad;
  private clickable!: ClickableContainer;

  private windTimer!: Timer;
  private touchCueTimer!: Timer;

  private pressStartAnim!: Timer;

  loadStep(): void {
    this.linker.push({name: 'TitleScreenSheet', url: 'assets/sheets/title-screen.json'});
  }

  setupStep(): void {
    this.gamepad = new VirtualGamepad();
    this.clickable = new ClickableContainer(this.visualLayers.stage);

    const { renderWidth, renderHeight } = Game.display;
    const halfWidth = renderWidth * .5;

    const textures = this.texturesFrom('TitleScreenSheet');
    const Sprite = (s: string) => new PIXI.Sprite(textures[s]);

    // Assemble basic pieces
    const backdrop = Sprite('title-screen.png');

    const windTexture = textures['dusty-wind-overlay.png'];
    const wind = new PIXI.TilingSprite(
      windTexture,
      windTexture.width * 3,
      windTexture.height
    );
    wind.alpha = .25;

    const logo = Sprite('title-logo.png');
    logo.position.set(halfWidth, 48);

    const logoGlow = Sprite('title-logo-glow.png');
    logoGlow.position.set(logo.x, logo.y - 5);

    const touchCue = Sprite('touch-to-start.png');
    touchCue.position.set(halfWidth, 142);

    const copyright = Sprite('copyright.png');
    copyright.position.set(halfWidth, renderHeight - copyright.height - 4);

    // Add pieces to scene
    this.visualLayers.stage.addChild(backdrop, logoGlow, wind, copyright, logo, touchCue);

    // Set up animation
    this.windTimer = Timer
      .tween(12.0, wind, {position: {x: -windTexture.width}})
      .wait()
      .do( () => wind.x = 0 )
      .do( () => this.windTimer.reset() )
      .noSelfDestruct();

    this.touchCueTimer = Timer
      .wait(1.25)
      .tween(0.075, touchCue, {alpha: 0})
      .wait(0.75)
      .tween(0.075, touchCue, {alpha: 1})
      .at('end')
      .do( () => this.touchCueTimer.reset() )
      .noSelfDestruct();

    this.pressStartAnim = new Timer()
      .do( () => {
        this.touchCueTimer.stop();
        touchCue.alpha = 1;
      })
      .every({time: .12, max: 7}, () => touchCue.alpha = 1 - touchCue.alpha)
      .at(1.0)
      .do( () => Game.transitionToScene(BattleScene) );

  }

  updateStep(): void {
    this.gamepad.update();
    if (this.gamepad.button.A.pressed || this.clickable.button.pressed)
      this.pressStartAnim.start();
  }

  destroyStep(): void {
    this.windTimer.destroy();
    this.touchCueTimer.destroy();
  }

}