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

  readonly illustration!: PIXI.Sprite;
  readonly eyeshot!: PIXI.Sprite;

  init() {
    const sheet = Game.scene.resources['CoSpritesheet'].spritesheet as PIXI.Spritesheet;

    const name = this.name.toLowerCase(); // ..?
    const color = 0;

    this.illustration = new PIXI.Sprite(sheet.textures[`${name}-p${color}-full.png`]);
    this.eyeshot = new PIXI.Sprite(sheet.textures[`${name}-p${color}-eyes.png`]);

    return this;
  }
}