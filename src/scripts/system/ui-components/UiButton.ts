import { Game } from "../../..";
import { PIXI } from "../../../constants";
import { ClickableContainer } from "../../controls/MouseInputWrapper";
import { UiComponent } from "./UiComponent";


/** Describes the textures a button needs to function. */
export type UiButtonTextureSet = {
  enabled: PIXI.Texture,
  disabled: PIXI.Texture,
  hovered: PIXI.Texture,
  depressed: PIXI.Texture,
}


/**
 * Describes a graphical button object which may be clicked.
 * // TODO UiComponent could describe its sprite object, and a decorator could handle the texture updating. */
export class UiButton extends UiComponent {

  /** Reference to the UI visual component. */
  readonly sprite = new PIXI.Sprite();

  /**  */
  protected readonly textureSet: UiButtonTextureSet;

  /** Reference to the clickable container. */
  readonly pointer = new ClickableContainer(this.sprite);

  /** Whether this button is enabled for user interactions. */
  disabled = false;

  /** The boolean check for whether the button's associated activity is being invoked.
   * This allows gamepad buttons which don't interface with the pointer-hover system
   * to also provide visual feedback. */
  triggerIndicatorLight?: () => boolean;

  // TODO Should this have an onClick callback, or just yield the reference to pointer?
  // I feel like the latter doesn't require me to duplicate a bunch of code.
  // pointer an have onEnter() or onMouseDown() or whatever you want.


  constructor(textures: UiButtonTextureSet, triggerIndicatorLight?: () => boolean) {
    super();
    this.textureSet = textures;
    this.sprite.texture = this.textureSet.enabled;
    this.container.addChild(this.sprite);
    this.triggerIndicatorLight = triggerIndicatorLight;
  }

  destroy() {
    super.destroy();
    this.sprite.destroy({children: true});
    this.pointer.destroy();
    this.triggerIndicatorLight = undefined;
  }

  protected update() {
    super.update();
    const { sprite, pointer, textureSet } = this;

    if (this.disabled) {
      sprite.texture = textureSet.disabled;
      return;
    }

    const artificialTrigger = this.triggerIndicatorLight && this.triggerIndicatorLight();

    // I'm just assuming this per-frame reassignment isn't expensive.
    sprite.texture =
      (pointer.button.down)
      ? textureSet.depressed
      : (pointer.pointerOver || artificialTrigger)
      ? textureSet.hovered
      : textureSet.enabled;
  }

}