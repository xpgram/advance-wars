import { PIXI } from "../../constants";
import { Game } from "../..";
import { UnitObject } from "./UnitObject";

export type UnitStats = {
  attack: number,
  defense: number,
  range: number,
  move: number,
  vision: number,
}

export function universalStatsBonus(): UnitStats {
  return {
    attack: 10,
    defense: 10,
    range: 0,
    move: 0,
    vision: 0,
  }
}

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
  abstract readonly nationality: 'rubinelle' | 'lazurian';

  /** How far from the CO unit the CO's effects can be felt. */
  abstract readonly CoZone: number;


  get illustration() { return this._illustration; }
  private _illustration!: PIXI.Sprite;

  get eyeshot() { return this._eyeshot; }
  private _eyeshot!: PIXI.Sprite;

  get insignia() { return this._insignia; }
  private _insignia!: PIXI.Sprite;

  get insigniaSplash() { return this._insigniaSplash; }
  private _insigniaSplash!: PIXI.Texture;

  get insigniaIcon() { return this._insigniaIcon; }
  private _insigniaIcon!: PIXI.Texture;


  readonly unitStatTable: Record<string, UnitStats> = {};

  /** For a given unit object, returns a UnitStats container for stat changes
   * to be applied within the CO Zone. */
  abstract getBonusStats(unit: UnitObject): UnitStats;

  /** Whether this officer is in CO Power state.
   * Toggleable from without, but a useful reference for returning bonus stat modifiers. */
  CoPowerInEffect = false;

  /** Initializes object for use.
   * If overriding, must call super.init() as first line; consider this like
   * you would a constructor. */
  init() {
    const sheet = Game.scene.resources['CoSpritesheet'].spritesheet as PIXI.Spritesheet;
    const uiSheet = Game.scene.resources['UISpritesheet'].spritesheet as PIXI.Spritesheet;

    const name = this.name.toLowerCase(); // ..?
    const allegiance = this.allegiance.toLowerCase().replace(' ', '-');
    const CoColor = 0;  // The palette swap variant.

    this._illustration = new PIXI.Sprite(sheet.textures[`${name}-p${CoColor}-full.png`]);
    this._eyeshot = new PIXI.Sprite(sheet.textures[`${name}-p${CoColor}-eyes.png`]);
    this._insignia = new PIXI.Sprite(uiSheet.textures[`insignia-${allegiance}.png`]);
    this._insigniaSplash = uiSheet.textures[`insignia-${allegiance}-large.png`];

    // TODO These are not actually team-color icons, which means I need to rename them
    // ~and~ come up with a re-coloring system to match whatever team they're on.
    this._insigniaIcon = uiSheet.textures[`icon-team-red.png`];

    return this;
  }
}