
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

/**  */
export abstract class CommandObject {
  static type: CommandObject;
  // TODO How do we... refer to types if they aren't remembered?
  // Like, `if (typeof cmd === Command.N)`, what is N ?
  // `if (typeof cmd === typeof Command.N)`? That would probably work, actually.
  // I don't know if I could get typescript to play nicely, though.
  // ...
  // No, I could.
  // `cmd as typeof Command.Move` would inherit all properties unique to Move.
  // `cmd as Command.Move.type` would also work. Hm. Okay.
  //
  // Can I write a static class then?
  // I want default, overridable behaviors.
  // I want unique properties (inputs) to certain Commands, though I forget why.
  // I want [move, this] or [move, attack] when attack is this to mean something.
  // Maybe an abstract behavior that executes chain[i].schedule() until return != 0
  // so that I don't have to write a manager thing somewhere.

  abstract readonly name: string;
  readonly serial = generateSerial();
  abstract readonly weight: Weight;
  abstract readonly spendsUnit: boolean;
  abstract readonly chain: CommandObject[];


  constructor(options:) {
    this.name = options.name;
    this.weight = options.weight;
    this.spendsUnit = options.spendsUnit;
    this.chain = options.chain;
    this.triggerInclude = options.triggerInclude || (() => false);
    this.scheduleEvents = options.scheduleEvents;
  }

  /**  */
  triggerInclude() {
    return false;
  }

  /**  */
  scheduleEvents(): CommandExitCode {
    return 0;
  }

}

export module Command {

  export const Move = new CommandType();

}
