import { Game } from "..";
import { Color } from "../scripts/color/Color";
import { Ease } from "../scripts/Common/EaseMethod";
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

  private toDestroy: {destroy(): void}[] = [];

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
    
    const wind_primary = createWindEffect(windTexture, 12.0, 0.22);
    this.toDestroy.push(wind_primary.timer);

    const wind_transition = createWindEffect(windTexture, 1.8, 0);
    this.toDestroy.push(wind_transition.timer);

    const logo = Sprite('title-logo.png');
    logo.position.set(halfWidth, 48);

    const logoGlow = Sprite('title-logo-glow.png');
    logoGlow.position.set(logo.x, logo.y - 5);

    const touchCue = Sprite('touch-to-start.png');
    touchCue.position.set(halfWidth, 142);

    const copyright = Sprite('copyright.png');
    copyright.position.set(halfWidth, renderHeight - copyright.height - 4);

    // Add pieces to scene
    this.visualLayers.stage.addChild(backdrop, logoGlow, wind_primary.wind, copyright, logo, touchCue, wind_transition.wind);

    // "Press Start" idle behavior
    this.touchCueTimer = Timer
      .wait(1.25)
      .tween(0.075, touchCue, {alpha: 0})
      .wait(0.75)
      .tween(0.075, touchCue, {alpha: 1})
      .loop();
    this.toDestroy.push(this.touchCueTimer);

    // "Press Start" interaction behavior (pre-scene-transition effect)
    this.pressStartAnim = new Timer()
      .tween(1.33, wind_transition, {alpha: 0.66}, Ease.sqrt.inOut)
      .transition(1.0, n => {
          n = Math.trunc((1-n)*255*.35 + 255*.65);
          wind_transition.tint = Color.RGB(n,n,n);
        })
      .do( () => {
          this.touchCueTimer.stop();
          touchCue.alpha = 1;
        })
      .every({gap: .12, max: 6}, () => touchCue.alpha = 1 - touchCue.alpha)
      .at(1.0)
      .do( () => Game.transitionToScene(BattleScene) );
    this.toDestroy.push(this.pressStartAnim);
  }

  updateStep(): void {
    this.gamepad.update();
    if (this.gamepad.button.A.pressed || this.clickable.button.pressed)
      this.pressStartAnim.start();
  }

  destroyStep(): void {
    this.toDestroy.forEach( t => t.destroy() );
  }

}


function createWindEffect(tex: PIXI.Texture, baseTime: number, baseAlpha: number) {
  const sprSettings = [tex, tex.width*3, tex.height] as const;
  const wind1 = new PIXI.TilingSprite(...sprSettings);
  const wind2 = new PIXI.TilingSprite(...sprSettings);
  
  const wind = new PIXI.Container();
  wind.addChild(wind1, wind2);

  wind1.alpha = baseAlpha;
  wind2.alpha = baseAlpha * 4/5;

  wind2.scale.y = -1;           // Flip to prevent that additive wave effect
  wind2.y = tex.height;

  const secondTime = baseTime*1.66;

  const timer = Timer
    .every(baseTime, () => wind1.x = 0)
    .tweenEvery(0, baseTime, wind1, {x: -tex.width})
    .every(secondTime, () => wind2.x = 0)
    .tweenEvery(0, secondTime, wind2, {x: -tex.width});

  return {
    wind,
    timer,
    get alpha() {
      return wind1.alpha;
    },
    set alpha(n) {
      wind1.alpha = n;
      wind2.alpha = n*4/5;
    },
    get tint() {
      return wind1.tint;
    },
    set tint(n) {
      wind1.tint = n;
      wind2.tint = n;
    },
  };
}