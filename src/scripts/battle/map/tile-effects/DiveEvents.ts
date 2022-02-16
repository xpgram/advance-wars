import { Game } from "../../../..";
import { Point } from "../../../Common/Point";
import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { UnitObject } from "../../UnitObject";
import { TileEvent } from "./TileEvent";


interface DiveEventOptions {
  unit: UnitObject;
  location: Point;
  assets: BattleSceneControllers;
}

/** Plays a water sink/surface animation over the given unit. */
// TODO Besides the ratify, this is completely generalizable.
// I probably need a VfxEvent which takes an array of textures, a
// location, a ratify() call and whether to make that call before or
// after the animation plays.
export class DiveEvent extends TileEvent {
  
  protected options: DiveEventOptions;
  private vfx!: PIXI.AnimatedSprite;

  
  constructor(options: DiveEventOptions) {
    super(options.location);
    this.options = options;
  }

  private ratify() {
    const { unit } = this.options;
    unit.hiding = !unit.hiding;
  }

  protected create(): void {
    const { unit } = this.options;
    const length = Game.display.standardLength;

    // Build and play animation
    const sheet = Game.scene.resources[`VFXSpritesheet`].spritesheet as PIXI.Spritesheet;
    const textures = sheet.animations[`dive`];
    textures.push(PIXI.Texture.EMPTY);
    this.vfx = new PIXI.AnimatedSprite(textures);

    const worldPos = unit.boardLocation.multiply(length);
    // this.vfx.position.set(worldPos.x, worldPos.y);
    this.vfx.animationSpeed = 1/4;
    this.vfx.loop = false;
    this.vfx.play();

    // Configure unit for vfx
    this.ratify();
    unit.sprite.addChild(this.vfx);
  }

  protected update(): void {
    const lastidx = this.vfx.textures.length - 1;
    const curidx = this.vfx.currentFrame;

    if (curidx === lastidx)
      this.finish();
  }

  protected destroy(): void {
    this.vfx?.destroy();
    //@ts-expect-error
    this.options = undefined;
  }

}