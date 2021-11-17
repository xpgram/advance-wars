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

  readonly illustration: PIXI.Sprite;
  readonly eyeshot: PIXI.Sprite;

  constructor() {
    const sheet = Game.scene.resources['CoSpritesheet'].sheet;

    const name = this.name.toLowerCase(); // ..?
    const color = 0;

    this.illustration = new PIXI.Sprite(sheet.textures[`${name}-p${color}-full`]);
    this.eyeshot = new PIXI.Sprite(sheet.textures[`${name}-p${color}-eyes`]);
  }
}