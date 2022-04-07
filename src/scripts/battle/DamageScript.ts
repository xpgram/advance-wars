import { UnitObject } from "./UnitObject";
import { Debug } from "../DebugUtils";
import { Map } from "./map/Map";
import { Square } from "./map/Square";
import { Point } from "../Common/Point";
import { TerrainObject } from "./map/TerrainObject";

export type BattleForecast = {
  damage: number,
  counter: number,
}

/**
 * 
 */
export class DamageScript {

  /** Initializes .Random() with a new PRNG using the given seed. */
  private static SetSeed(seed: number) {
    // TODO Does this not.. return the same number each and every time?
    // When do we affect the seed?
    // It's not a generator.
    function mulberry32() {
      var t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    DamageScript.Random = mulberry32;
  }

  /**  */
  private static Random = function () {
    Debug.error('Called DamageScript.Random() without .SetSeed()');
    return 0;
  }

  private static AttackPowerBonus(A: CombatState, rand: number): number {
    const { ceil } = Math;

    const playerA = A.unit.boardPlayer;

    // Constants
    const ComTowerBonus = 5;

    // Get attacker's stat bonuses
    const atkRank = [0, 5, 10, 20][A.unit.rank];    // TODO What if rank is 4?! Irrelevant. It'll never happen.
    const luck = ceil(rand * ceil(A.HP / 10 + 1)) - 1;
    const atkComTower = playerA.comTowerCount * ComTowerBonus;
    const atkCoZone = (playerA.withinCoRange(A.from))
      ? playerA.officer.getBonusStats(A.unit).attack
      : 0;

    return 100 + atkRank + atkCoZone + luck + atkComTower;
  }

  private static DefensePowerBonus(B: CombatState): number {
    const { ceil } = Math;

    const playerB = B.unit.boardPlayer;

    // Constants — Duplicated in AttackPowerBonus
    const ComTowerBonus = 5;

    // Get defender's stat bonuses
    const defRank = (B.unit.rank == 3) ? 20 : 0;
    const terrain = B.square.terrain.defenseRating * ceil(B.HP / 10);
    const defComTower = playerB.comTowerCount * ComTowerBonus;
    const defCoZone = (playerB.withinCoRange(B.from))
      ? playerB.officer.getBonusStats(B.unit).defense
      : 0;

    return 100 + defRank + defCoZone + terrain + defComTower;
  }

  /**  */
  private static NormalAttackFormula(A: CombatState, B: CombatState, rand: number) {
    const { ceil } = Math;

    // Unit Rank 0: 0/0, I: +5/0, II: +10/0, V: +20/+20
    // Terrain Stars 0/+1 per star per 1 HP
    // CO Zone +10/+10, and +10/0 and 0/+10 per attack and defense stars per unit type
    // COM Towers +5/+5 per count
    // Sandstorm -30/0
    // Luck +LCK/0, where LCK is range 0 to ceil(attackerHP / 10)

    // Get attacker's stat bonuses
    const atkStrength = ceil(A.HP / 10) / 10;       // A 1-sig decimal number ranged 0 to 1

    // Get attacker/defender power advantage
    const attackBonus = DamageScript.AttackPowerBonus(A, rand);
    const defenseBonus = DamageScript.DefensePowerBonus(B);
    const powerRatio = attackBonus / defenseBonus;

    // Return final damage
    const baseDamage = A.unit.baseDamage(B.unit);
    const finalDamage = baseDamage * atkStrength * powerRatio;

    // [!] Unit HP cannot be stored as a decimal.
    return ceil(finalDamage);
  }

  /**  */
  private static NormalTerrainAttackFormula(A: CombatState, rand: number) {
    const { ceil } = Math;

    const atkStrength = ceil(A.HP / 10) / 10;

    const attackBonus = DamageScript.AttackPowerBonus(A, rand);
    const powerRatio = attackBonus / 100;

    const baseDamage = 30;  // TODO I need access to the Terrain value
    const finalDamage = baseDamage * atkStrength * powerRatio;

    return ceil(finalDamage);
  }

  /**  */
  static NormalAttack(map: Map, attacker: UnitObject, from: Point, defender: UnitObject, seed: number) {
    DamageScript.SetSeed(seed);
    const formula = DamageScript.NormalAttackFormula;

    const attackState = new CombatState(map, attacker, from);
    const defenseState = new CombatState(map, defender);
    const estimateState = new CombatState(map, defender);

    const LCK1 = DamageScript.Random();
    const LCK2 = DamageScript.Random();

    const damageEst = formula(attackState, defenseState, .5);
    const damage = formula(attackState, defenseState, LCK1);

    const canCounter = defenseState.unit.canCounterAttack(attackState.unit, from);

    estimateState.HP = Math.max(estimateState.HP - damageEst, 0);
    const counterEst = formula(estimateState, attackState, .5) * Number(canCounter);

    defenseState.HP = Math.max(defenseState.HP - damage, 0);
    const counter = formula(defenseState, attackState, LCK2) * Number(canCounter);

    return {
      damage: damage,
      counter: counter,
      estimate: {
        damage: damageEst,
        counter: counterEst
      }
    };
  }

  static TerrainAttack(map: Map, attacker: UnitObject, from: Point, terrain: TerrainObject, seed: number) {
    DamageScript.SetSeed(seed);
    const formula = DamageScript.NormalTerrainAttackFormula;

    const attackState = new CombatState(map, attacker, from);

    const LCK = DamageScript.Random();

    const damageEst = formula(attackState, .5);
    const damage = formula(attackState, LCK);

    return {
      damage: damage,
      counter: 0,
      estimate: {
        damage: damageEst,
        counter: 0,
      }
    };
  }

}

class CombatState {
  unit: UnitObject;
  from: Point;
  square: Square;
  HP: number;
  constructor(map: Map, unit: UnitObject, from?: Point) {
    this.unit = unit;
    this.from = from || unit.boardLocation;
    this.square = map.squareAt(this.from);
    this.HP = unit.hp;
  }
}