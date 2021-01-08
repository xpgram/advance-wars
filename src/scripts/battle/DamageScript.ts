import { UnitObject } from "./UnitObject";
import { Debug } from "../DebugUtils";
import { Map } from "./map/Map";
import { Square } from "./map/Square";

/**
 * 
 */
export class DamageScript {

    /** Initializes .Random() with a new PRNG using the given seed. */
    private static SetSeed(seed: number) {
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

    /**  */
    private static NormalAttackFormula(A: CombatState, B: CombatState, rand: number) {
        const ceil = Math.ceil;

        // Unit Rank 0: 0/0, I: +5/0, II: +10/0, V: +20/+20
        // Terrain Stars 0/+1 per star per 1 HP
        // CO Zone +10/+10, and +10/0 and 0/+10 per attack and defense stars per unit type
        // COM Towers +5/+5 per count
        // Sandstorm -30/0
        // Luck +LCK/0, where LCK is range 0 to ceil(attackerHP / 10)

        const atkRankBoosts = [0,5,10,20];
        const atkRank = atkRankBoosts[A.unit.rank];
        const atkCOZone = (A.square.COAffectedFlag) ? 10 : 0;  // TODO Which CO? God damn it.
        const luck = ceil(rand * ceil(A.HP / 10 + 1)) - 1;

        const attackStat = 100 + atkRank + atkCOZone + luck;

        const defRank = (B.unit.rank == 3) ? 20 : 0;
        const defCOZone = (B.square.COAffectedFlag) ? 10 : 0;
        const terrain = B.square.terrain.defenseRating * ceil(B.HP / 10);

        const defenseStat = 100 + defRank + defCOZone + terrain;

        return A.unit.baseDamage(B.unit) * ceil(A.HP / 10) / 10 * attackStat / defenseStat;
    }
    
    /**  */
    static NormalAttack(map: Map, attacker: UnitObject, defender: UnitObject, seed: number) {
        DamageScript.SetSeed(seed);
        const formula = DamageScript.NormalAttackFormula;
        
        const attackState = new CombatState(map, attacker);
        const defenseState = new CombatState(map, defender);

        const LCK1 = DamageScript.Random();
        const LCK2 = DamageScript.Random();

        const damageEst = formula(attackState, defenseState, 0);
        const damage = formula(attackState, defenseState, LCK1);

        defenseState.HP = Math.max(defenseState.HP - damage, 0);
        const canCounter = defenseState.unit.canCounterAttack(attackState.unit);
        const counter = formula(defenseState, attackState, LCK2) * Number(canCounter);

        return {damage: damage, counter: counter, estimate: damageEst};
    }
}

class CombatState {
    unit: UnitObject;
    square: Square;
    HP: number;
    constructor(map: Map, unit: UnitObject) {
        this.unit = unit;
        this.square = map.squareAt(unit.boardLocation);
        this.HP = unit.hp;
    }
}