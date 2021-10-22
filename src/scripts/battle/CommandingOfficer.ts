import { CommandingOfficerObject } from "./CommandingOfficerObject";

/**  */
export const CommandingOfficer = {
  Void: class VoidCO extends CommandingOfficerObject {
    readonly type = VoidCO;
    static readonly serial = -2;
  }
}