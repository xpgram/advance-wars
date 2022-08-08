import { PIXI, PixiFilters } from "../constants";
import { Game } from "..";
import { Color } from "../scripts/color/Color";
import { Ease } from "../scripts/Common/EaseMethod";
import { ClickableContainer } from "../scripts/controls/MouseInputWrapper";
import { VirtualGamepad } from "../scripts/controls/VirtualGamepad";
import { Filters } from "../scripts/filters/Filters";
import { Timer } from "../scripts/timer/Timer";
import { Scene } from "./Scene";
import { MainMenuScene } from "./MainMenu";


/**
 * @author Dei Valko
 * @version 0.0.1
 */
export class TitleScreen extends Scene {

  private gamepad!: VirtualGamepad;
  private clickable!: ClickableContainer<PIXI.Container>;

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
    
    const wind_primary = createWindEffect(windTexture, 14.0, 0.175, true);
    this.toDestroy.push(wind_primary.timer);

    const wind_secondary = createWindEffect(windTexture, 19.0, 0.125, true);
    this.toDestroy.push(wind_secondary.timer);

    const wind_transition = createWindEffect(windTexture, 1.0, 0, false);
    wind_transition.container.filters = [new PixiFilters.MotionBlurFilter([96,0], 45)];
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
    this.visualLayers.stage.addChild(backdrop, logoGlow, wind_primary.container, logo, copyright, touchCue, wind_secondary.container, wind_transition.container);

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
      .tween(2.0, wind_transition, {alpha: 0.75}, Ease.cubic.inOut)
      .transition(1.66, n => {
          // n = Math.trunc((1-n)*255*.35 + 255*.65);
          n = Ease.cubic.in(n);
          n = Math.trunc((1-n)*255);
          wind_transition.tint = Color.RGB(n,n,n);
        })
      .do( () => {
          this.touchCueTimer.stop();
          touchCue.alpha = 1;
        })
      .every({gap: .12, max: 6}, () => touchCue.alpha = 1 - touchCue.alpha)
      .at(1.5)
      .do( () => Game.transitionToScene(MainMenuScene) );
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


function createWindEffect(tex: PIXI.Texture, baseTime: number, baseAlpha: number, applyGradient: boolean) {
  const sprSettings = [tex, tex.width*3, tex.height] as const;
  const wind1 = new PIXI.TilingSprite(...sprSettings);
  const wind2 = new PIXI.TilingSprite(...sprSettings);
  
  const wind = new PIXI.Container();
  wind.addChild(wind1, wind2);

  wind1.alpha = baseAlpha;
  wind2.alpha = baseAlpha * 4/5;

  wind2.scale.y = -1;           // Flip to prevent that additive wave effect
  wind2.y = tex.height;

  // Create gradient mask for smoke
  if (applyGradient) {
    // TODO Extract gradient generation to common pixi tools
    const { width, height } = Game.display;
    const canvas = document.createElement('canvas');
    [canvas.width, canvas.height] = [width, height];
    const context = canvas.getContext('2d');
    if (!context)
      throw `Could not get 2d context from created canvas element?`;
    const gradient = context.createLinearGradient(0,0,0,canvas.height);
    gradient.addColorStop(0.6,'white');
    gradient.addColorStop(0.9,'black');
    context.fillStyle = gradient;
    context.fillRect(0,0,width,height);
    const windAlphaMask = new PIXI.Sprite(PIXI.Texture.from(canvas));

    wind.mask = windAlphaMask;
  }

  // Setup motion timers
  const secondTime = baseTime*2;

  const timer = Timer
    .every(baseTime, () => wind1.x = 0)
    .tweenEvery(0, baseTime, wind1, {x: -tex.width})
    .every(secondTime, () => wind2.x = 0)
    .tweenEvery(0, secondTime, wind2, {x: -tex.width});

  return {
    container: wind,
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