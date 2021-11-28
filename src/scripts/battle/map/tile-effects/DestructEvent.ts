import { Spritesheet } from "pixi.js";
import { Game } from "../../../..";
import { UnitClass } from "../../EnumTypes";
import { TrackCar } from "../../TrackCar";
import { UnitObject } from "../../UnitObject";
import { MapLayer } from "../MapLayers";
import { TileEvent } from "./TileEvent";

interface DestructEventOptions {
  unit: UnitObject;
  trackCar: TrackCar;
}

export class DestructEvent extends TileEvent {
  
  private options: DestructEventOptions;

  private image!: PIXI.Sprite;

  constructor(options: DestructEventOptions) {
    super(options.unit.boardLocation);
    this.options = {...options};
  }

  protected create(): void {
    const { unit, trackCar } = this.options;

    const boardPos = unit.boardLocation;
    const worldPos = boardPos.multiply(Game.display.standardLength);
    const variant = (unit.unitClass === UnitClass.Naval) ? 'wet' : 'dry';
    
    const sheet = Game.scene.resources[`VFXSpritesheet`].spritesheet as Spritesheet;
    const textures = sheet.animations[`explosion-${variant}`];
    textures.push(PIXI.Texture.EMPTY);
    this.image = new PIXI.AnimatedSprite(textures);

    this.image.position.set(worldPos.x, worldPos.y);
    this.image.animationSpeed = 1 / 4;
    this.image.loop = false;
    this.image.play();

    // Hide blown-up actor
    unit.destroy();
    if (trackCar.curPoint.equal(boardPos))
      trackCar.hide();

    MapLayer('ui').addChild(this.image);
  }

  protected update(): void {
    const last = this.image.textures.length - 1;
    const cur = this.image.currentFrame;
    const progress = cur/last;
    this.image.alpha = 1-(progress-.65)/.65;    // Transparency rapidly falls to ~.5 toward the end.
    
    if (cur === last)
      this.finish();
  }

  protected destroy(): void {
    this.image?.destroy();
    //@ts-expect-error
    this.image = undefined;
    //@ts-expect-error
    this.options = undefined;
  }
}