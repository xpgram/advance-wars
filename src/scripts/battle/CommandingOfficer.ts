import { CommandingOfficerObject } from "./CommandingOfficerObject";

/**  */
export const CommandingOfficer = {
  Void: class VoidCO extends CommandingOfficerObject {
    readonly type = VoidCO;
    static readonly serial = -2;

    readonly name = 'Void';
  },

  None: class NoneCO extends CommandingOfficerObject {
    readonly type = NoneCO;
    static readonly serial = 0;

    readonly name = 'None';
  },

  Will: class WillCO extends CommandingOfficerObject {
    readonly type = WillCO;
    static readonly serial = 1;

    readonly name = 'Will';
  },

  Brenner: class BrennerCO extends CommandingOfficerObject {
    readonly type = BrennerCO;
    static readonly serial = 2;

    readonly name = 'Brenner';
  },

  Lin: class LinCO extends CommandingOfficerObject {
    readonly type = LinCO;
    static readonly serial = 3;

    readonly name = 'Lin';
  },

  Isabella: class IsabellaCO extends CommandingOfficerObject {
    readonly type = IsabellaCO;
    static readonly serial = 4;

    readonly name = 'Isabella';
  },
}