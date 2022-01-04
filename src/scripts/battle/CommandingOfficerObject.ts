import { Game } from "../..";
import { StringDictionary } from "../CommonTypes";

type UnitStats = {
  attack: number,
  defense: number,
  range: number,
  move: number,
  vision: number,
}

type UnitStatsPartial = {
  attack?: number,
  defense?: number,
  range?: number,
  move?: number,
  vision?: number,
}

const UNIVERSAL_CO_ATK_DEF_BOOST: UnitStats = {
  attack: 20,
  defense: 20,
  range: 0,
  move: 0,
  vision: 0,
}

const DEFAULT_STATS: UnitStats = {
  attack: 0,
  defense: 0,
  range: 0,
  move: 0,
  vision: 0,
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

  readonly unitStatTable: StringDictionary<UnitStats> = {};

  /** Returns an entry from the unit stats table.
   * All element names are acceptable; any non-entries will assume default values. */
  getUnitStats(name: string): UnitStats {
    const coUnit = (name === 'CO');

    let stats = this.unitStatTable[name] || DEFAULT_STATS;
    if (coUnit) stats = {...stats, ...UNIVERSAL_CO_ATK_DEF_BOOST};
    return stats;
  }

  /** Sets only the described fields for all given element names on the unit stats table. */
  protected setUnitStats(stats: UnitStatsPartial, ...names: string[]) {
    names.forEach( name => {
      const oldStats = this.unitStatTable[name] || {};
      stats = {...DEFAULT_STATS, ...oldStats, ...stats};
      this.unitStatTable[name] = stats as UnitStats;
    })
  }

  /** Initializes object for use.
   * If overriding, must call super.init() as first line; consider this like
   * you would a constructor. */
  init() {
    const sheet = Game.scene.resources['CoSpritesheet'].spritesheet as PIXI.Spritesheet;
    const uiSheet = Game.scene.resources['UISpritesheet'].spritesheet as PIXI.Spritesheet;

    const name = this.name.toLowerCase(); // ..?
    const allegiance = this.allegiance.toLowerCase().replace(' ', '-');
    const color = 0;

    this._illustration = new PIXI.Sprite(sheet.textures[`${name}-p${color}-full.png`]);
    this._eyeshot = new PIXI.Sprite(sheet.textures[`${name}-p${color}-eyes.png`]);
    this._insignia = new PIXI.Sprite(uiSheet.textures[`insignia-${allegiance}.png`]);

    return this;
  }
}