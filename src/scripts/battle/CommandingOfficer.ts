import { SerialGenerator } from "../Common/SerialGenerator";
import { CommandingOfficerObject, UnitStats, universalStatsBonus } from "./CommandingOfficerObject";
import { UnitClass } from "./EnumTypes";
import { UnitObject } from "./UnitObject";

const Serial = SerialGenerator(-1);

/**  */
export module CommandingOfficer {

  export class Void extends CommandingOfficerObject {
    readonly type = Void;
    static readonly serial = Serial.next().value;

    readonly name = 'Void';
    readonly allegiance = 'None';
    readonly nationality = 'rubinelle';

    readonly CoZone = 0;

    getBonusStats(unit: UnitObject): UnitStats {
      return universalStatsBonus();
    }
  }

  export class None extends CommandingOfficerObject {
    readonly type = None;
    static readonly serial = Serial.next().value;

    readonly name = 'None';
    readonly allegiance = 'None';
    readonly nationality = 'rubinelle';

    readonly CoZone = 0;

    getBonusStats(unit: UnitObject): UnitStats {
      return universalStatsBonus();
    }
  }

  export class Will extends CommandingOfficerObject {
    readonly type = Will;
    static readonly serial = Serial.next().value;

    readonly name = 'Will';
    readonly allegiance = '13th Battalion';
    readonly nationality = 'rubinelle';

    readonly CoZone = 2;

    getBonusStats(unit: UnitObject): UnitStats {
      const stats = universalStatsBonus();

      if (unit.isDirectOnly && unit.unitClass === UnitClass.Ground) {
        stats.attack += 20;
        
        if (this.CoPowerInEffect)
          stats.move += 2;
          // TODO UnitObject needs to reference its CO when returning movement range
      }

      return stats;
    }
  }

  export class Brenner extends CommandingOfficerObject {
    readonly type = Brenner;
    static readonly serial = Serial.next().value;

    readonly name = 'Brenner';
    readonly allegiance = '13th Battalion';
    readonly nationality = 'rubinelle';

    readonly CoZone = 3;

    getBonusStats(unit: UnitObject): UnitStats {
      const stats = universalStatsBonus();
      stats.defense += 20;
      return stats;
    }
  }

  export class Lin extends CommandingOfficerObject {
    readonly type = Lin;
    static readonly serial = Serial.next().value;

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
  }

  export class Isabella extends CommandingOfficerObject {
    readonly type = Isabella;
    static readonly serial = Serial.next().value;

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
  }

  // readonly allegiance = 'Lazuria';
  // readonly allegiance = 'New Rubinelle';
  // readonly allegiance = 'IDS';

}
