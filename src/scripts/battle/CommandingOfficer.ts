import { CommandingOfficerObject } from "./CommandingOfficerObject";
import { UnitClass } from "./EnumTypes";
import { Unit } from "./Unit";

/**  */
export const CommandingOfficer = {
  Void: class VoidCO extends CommandingOfficerObject {
    readonly type = VoidCO;
    static readonly serial = -2;

    readonly name = 'Void';
    readonly allegiance = 'None';
    readonly nationality = 'rubinelle';

    readonly CoZone = 0;
  },

  None: class NoneCO extends CommandingOfficerObject {
    readonly type = NoneCO;
    static readonly serial = 0;

    readonly name = 'None';
    readonly allegiance = 'None';
    readonly nationality = 'rubinelle';

    readonly CoZone = 0;
  },

  Will: class WillCO extends CommandingOfficerObject {
    readonly type = WillCO;
    static readonly serial = 1;

    readonly name = 'Will';
    readonly allegiance = '13th Battalion';
    readonly nationality = 'rubinelle';

    readonly CoZone = 2;

    init() {
      super.init();

      this.setUnitStats({
        attack: 20,
      },
        // All direct ground units
        ...Object.values(Unit)
          .filter( type => {
            const u = new type();
            return u.isDirectOnly && u.unitClass === UnitClass.Ground;
          })
          .map( type => new type().name )
      )

      // TODO Stats for CO power? ++Move for instance.
      // TODO I forget, do Rigs and such get the movement boost on CO Power?

      return this;
    }
  },

  Brenner: class BrennerCO extends CommandingOfficerObject {
    readonly type = BrennerCO;
    static readonly serial = 2;

    readonly name = 'Brenner';
    readonly allegiance = '13th Battalion';
    readonly nationality = 'rubinelle';

    readonly CoZone = 3;
  },

  Lin: class LinCO extends CommandingOfficerObject {
    readonly type = LinCO;
    static readonly serial = 3;

    readonly name = 'Lin';
    readonly allegiance = '13th Battalion';
    readonly nationality = 'rubinelle';

    readonly CoZone = 1;
  },

  Isabella: class IsabellaCO extends CommandingOfficerObject {
    readonly type = IsabellaCO;
    static readonly serial = 4;

    readonly name = 'Isabella';
    readonly allegiance = '13th Battalion';
    readonly nationality = 'rubinelle';

    readonly CoZone = 2;
  },

  // readonly allegiance = 'Lazuria';
  // readonly allegiance = 'New Rubinelle';
  // readonly allegiance = 'IDS';
}