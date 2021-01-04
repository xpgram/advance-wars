import { UnitObject } from "./UnitObject";
import { Debug } from "../DebugUtils";

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
    private static ValueFuzzier(value: number, percentRange: number) {
        const range = percentRange / 100;
        const fuzz = DamageScript.Random();
        return (1 - range)*value + 2*range*value*fuzz;
    }

    /**  */
    private static NormalAttackFormula(attacker: UnitObject, defender: UnitObject, attackerHP: number) {
        // const CO = attacker.team.CO;

        let dmg: number;
        dmg = attacker.baseDamage(defender);
        dmg = Math.ceil(dmg * attackerHP / 100);   // Always at least 1, unless base or HP weren't
        // dmg *= CO.damageModifier(attacker);
        // dmg *= [terrain modifier];

        return dmg;
    }
    
    /**  */
    static NormalAttack(attacker: UnitObject, defender: UnitObject, seed: number) {
        DamageScript.SetSeed(seed);
        const formula = DamageScript.NormalAttackFormula;
        const fuzz = DamageScript.ValueFuzzier;
        const fuzzAmount = 5;

        const attackerHP = attacker.hp;
        const damageRaw = formula(attacker, defender, attackerHP);
        const damage = fuzz(damageRaw, fuzzAmount);

        const defenderHP = Math.min(defender.hp - damage, 0);
        const counterRaw = (defender.canCounterAttack(attacker)) ? formula(defender, attacker, defenderHP) : 0;
        const counter = fuzz(counterRaw, fuzzAmount);

        return {damage: damage, counter: counter, estimate: damageRaw};
    }
}