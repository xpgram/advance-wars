import { Game } from "../..";

export interface CommandingOfficerType {
  new (): CommandingOfficerObject;
  readonly serial: number;
}

export abstract class CommandingOfficerObject {
  abstract readonly type: CommandingOfficerType;
  static readonly serial: number = -1;
  get serial(): number { return this.type.serial; }

  abstract readonly name: string;
  abstract readonly allegiance: string;

  readonly illustration!: PIXI.Sprite;
  readonly eyeshot!: PIXI.Sprite;
  readonly insignia!: PIXI.Sprite;

  init() {
    const sheet = Game.scene.resources['CoSpritesheet'].spritesheet as PIXI.Spritesheet;
    const uiSheet = Game.scene.resources['UISpritesheet'].spritesheet as PIXI.Spritesheet;

    const name = this.name.toLowerCase(); // ..?
    const allegiance = this.allegiance.toLowerCase().replace(' ', '-');
    const color = 0;

    this.illustration = new PIXI.Sprite(sheet.textures[`${name}-p${color}-full.png`]);
    this.eyeshot = new PIXI.Sprite(sheet.textures[`${name}-p${color}-eyes.png`]);
    this.insignia = new PIXI.Sprite(uiSheet.textures[`insignia-${allegiance}.png`]);

    return this;
  }
}