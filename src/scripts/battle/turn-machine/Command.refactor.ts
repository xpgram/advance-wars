
/* 
 * We're trying this time anew with a common inheritance pattern.
 * 
 * I need approximately the same implementation (to avoid costly rewrites,
 * and because it isn't really necessary) but a greater emphasis on dependency
 * chains.
 * 
 * Attack.schedule() should not handle Move.schedule() itself. This leads to
 * a lot of redundant code.
 * 
 * Attack.chain should instead indicate that [move, attack] are to be scheduled
 * in that order (and thus the chain can be halted by a third party at any time).
 * 
 * Move.schedule() can return a negative status code, the EventScheduler can
 * halt and continue with what it has.
 * 
 * The chain itself is independently orderable, so [dive, move] is still legal.
 * 
 * Oh, and the Attack extends CommandType isn't... strictly necessary, I just
 * find that including some commonly inheritable default behaviors would reduce
 * some boilerplate.
 * .chain could be added to the current implementation. I guess I still need
 * a third-party scheduler somewhere. I'll think about it.
 */

/**  */
enum ExitCode {
  Success = 0,
  Interrupted,
}

/** Names for sorting weight categories. */
enum Weight {
  Primary,    // First order abilities: Attack
  Secondary,  // Unit specific special actions.
  Tertiary,   // Contextual, global actions.
  Quaternary, // -
  Unpreferred,// Last in list: Wait
  None,       // Not sequentially, but indicates an item whose sort is irrelevant.
}

/** Auto generates a new serial so I don't have to hardcode them manually. */
function generateSerial() {
  serialCount++;
  return serialCount;
}
let serialCount = -1;

export class RatificationError extends Error {
  name = 'RatificationError';
}

/** Returns a CommandObject<number> corrosponding to the given serial number. */
export function getCommandObject(serial: number): CommandObject<number> {
  const command = Object.values(Command).find( c => c.serial === serial );
  if (!command)
    throw new Error(`could not retrieve command object for serial ${serial}`);
  return command;
}

export type CommandObjectClass = {
  new (): CommandObject;
}

/**  */
export abstract class CommandObject {
  abstract readonly type: CommandObjectClass;
  abstract readonly name: string;
  readonly serial = generateSerial();
  abstract readonly weight: Weight;
  abstract readonly spendsUnit: boolean;
  abstract get chain(): CommandObject[];

  /**  */
  triggerInclude() {
    return false;
  }

  /**  */
  scheduleEvents(): ExitCode {
    return ExitCode.Success;
  }

}

export module Command {

  export const Move = new class Move extends CommandObject {
    readonly type = Move;
    readonly name = "Move";
    readonly weight = Weight.None;
    readonly spendsUnit = true;
    get chain(): CommandObject[] { return [Command.Move]; }
    
    scheduleEvents(): ExitCode {
      return ExitCode.Success;
    }
  }

  export const Attack = new class Attack extends CommandObject {
    readonly type = Attack;
    readonly name = "Fire";
    readonly weight = Weight.Primary;
    readonly spendsUnit = true;
    get chain(): CommandObject[] { return [Command.Move, Command.Attack]; }

    static triggerInclude(): boolean {
      return true;
    }

    static scheduleEvents(): ExitCode {
      return ExitCode.Success;
    }
  }

}
