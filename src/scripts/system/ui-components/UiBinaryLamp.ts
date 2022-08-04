import { PIXI } from "../../../constants";
import { Timer } from "../../timer/Timer";
import { UiComponent } from "./UiComponent";


export type TextureSet = {
  background: PIXI.Texture,
  lamp: PIXI.Texture,
}

const ANIM_TIME = 4/60;

/** A "light indicator" which can be signalled on or off. */
export class UiBinaryLamp extends UiComponent {
  
  protected bgSprite = new PIXI.Sprite();
  protected lampSprite = new PIXI.Sprite();

  protected timer?: Timer;

  constructor(textures: TextureSet) {
    super();
  
    this.bgSprite.texture = textures.background;
    this.lampSprite.texture = textures.lamp;
    this.lampSprite.anchor.set(.5);
    this.lampSprite.position.set(this.bgSprite.width/2, this.bgSprite.height/2);
    this.lampSprite.alpha = 0;

    this.container.addChild(
      this.bgSprite,
      this.lampSprite,
    )
  }

  destroy() {
    super.destroy();
    this.timer?.destroy();
  }

  lampOn() {
    this.timer?.destroy();
    this.timer = Timer.tween(ANIM_TIME, this.lampSprite, {alpha: 1});
  }

  lampOff() {
    this.timer?.destroy();
    this.timer = Timer.tween(ANIM_TIME, this.lampSprite, {alpha: 0});
  }

  skip() {
    this.timer?.skip();
  }

}