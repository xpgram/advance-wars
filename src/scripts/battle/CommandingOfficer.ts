import { CommandingOfficerObject } from "./CommandingOfficerObject";

/**  */
export const CommandingOfficer = {
  Void: class VoidCO extends CommandingOfficerObject {
    readonly type = VoidCO;
    static readonly serial = -2;

    readonly name = 'Void';
    readonly allegiance = 'None';
  },

  None: class NoneCO extends CommandingOfficerObject {
    readonly type = NoneCO;
    static readonly serial = 0;

    readonly name = 'None';
    readonly allegiance = 'None';
  },

  Will: class WillCO extends CommandingOfficerObject {
    readonly type = WillCO;
    static readonly serial = 1;

    readonly name = 'Will';
    readonly allegiance = '13th Battalion';
  },

  Brenner: class BrennerCO extends CommandingOfficerObject {
    readonly type = BrennerCO;
    static readonly serial = 2;

    readonly name = 'Brenner';
    readonly allegiance = '13th Battalion';
  },

  Lin: class LinCO extends CommandingOfficerObject {
    readonly type = LinCO;
    static readonly serial = 3;

    readonly name = 'Lin';
    readonly allegiance = '13th Battalion';
  },

  Isabella: class IsabellaCO extends CommandingOfficerObject {
    readonly type = IsabellaCO;
    static readonly serial = 4;

    readonly name = 'Isabella';
    readonly allegiance = '13th Battalion';
  },

  // readonly allegiance = 'Lazuria';
  // readonly allegiance = 'New Rubinelle';
  // readonly allegiance = 'IDS';
}