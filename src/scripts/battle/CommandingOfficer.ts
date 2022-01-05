import { CommandingOfficerObject, UnitStats, universalStatsBonus } from "./CommandingOfficerObject";
import { UnitClass } from "./EnumTypes";
import { Unit } from "./Unit";
import { UnitObject } from "./UnitObject";

/**  */
export const CommandingOfficer = {
  Void: class VoidCO extends CommandingOfficerObject {
    readonly type = VoidCO;
    static readonly serial = -2;

    readonly name = 'Void';
    readonly allegiance = 'None';
    readonly nationality = 'rubinelle';

    readonly CoZone = 0;

    getBonusStats(unit: UnitObject): UnitStats {
      return universalStatsBonus();
    }
  },

  None: class NoneCO extends CommandingOfficerObject {
    readonly type = NoneCO;
    static readonly serial = 0;

    readonly name = 'None';
    readonly allegiance = 'None';
    readonly nationality = 'rubinelle';

    readonly CoZone = 0;

    getBonusStats(unit: UnitObject): UnitStats {
      return universalStatsBonus();
    }
  },

  Will: class WillCO extends CommandingOfficerObject {
    readonly type = WillCO;
    static readonly serial = 1;

    readonly name = 'Will';
    readonly allegiance = '13th Battalion';
    readonly nationality = 'rubinelle';

    readonly CoZone = 2;

    getBonusStats(unit: UnitObject): UnitStats {
      const stats = universalStatsBonus();

      if (unit.isDirectOnly && unit.unitClass === UnitClass.Ground)
        stats.attack += 20;

      return stats;
    }
  },

  Brenner: class BrennerCO extends CommandingOfficerObject {
    readonly type = BrennerCO;
    static readonly serial = 2;

    readonly name = 'Brenner';
    readonly allegiance = '13th Battalion';
    readonly nationality = 'rubinelle';

    readonly CoZone = 3;

    getBonusStats(unit: UnitObject): UnitStats {
      const stats = universalStatsBonus();
      stats.defense += 20;
      return stats;
    }
  },

  Lin: class LinCO extends CommandingOfficerObject {
    readonly type = LinCO;
    static readonly serial = 3;

    readonly name = 'Lin';
    readonly allegiance = '13th Battalion';
    readonly nationality = 'rubinelle';

    readonly CoZone = 1;

    getBonusStats(unit: UnitObject): UnitStats {
      const stats = universalStatsBonus();
      if (unit.unitClass === UnitClass.Ground) {
        stats.attack += 20;
        stats.defense += 20;
      }
      return stats;
    }
  },

  Isabella: class IsabellaCO extends CommandingOfficerObject {
    readonly type = IsabellaCO;
    static readonly serial = 4;

    readonly name = 'Isabella';
    readonly allegiance = '13th Battalion';
    readonly nationality = 'rubinelle';

    readonly CoZone = 2;

    getBonusStats(unit: UnitObject): UnitStats {
      const stats = universalStatsBonus();
      stats.attack += 10;
      stats.defense += 10;
      return stats;
    }
  },

  // readonly allegiance = 'Lazuria';
  // readonly allegiance = 'New Rubinelle';
  // readonly allegiance = 'IDS';
}