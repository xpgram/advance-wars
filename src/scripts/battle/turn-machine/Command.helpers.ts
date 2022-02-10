import { Command } from "./Command";
import { instructionData } from "./InstructionData";

export module CommandHelpers {

  /**  */
  export class RatificationError extends Error {
    name = 'RatificationError';
  }

  /** Schedule() response status. */
  export enum ExitCode {
    Success = 0,
    Interrupted,
  }

  /** Names for sorting weight categories; indicates menu order. */
  export enum Weight {
    /** First order abilities: Attack */
    Primary,
    /** Unit specific special actions. */
    Secondary,
    /** Contextual, global actions. */
    Tertiary,
    /** Secondary contextual, global actions. */
    Quaternary,
    /** Last in list: Wait */
    Unpreferred,
    /** Bottom in list; indicates an item whose sort is irrelevant. */
    None,
  }

  /** Interface all Commands must adhere to. */
  export type CommandObject = {
    /**  */
    readonly type: CommandObject,
    /** Name string; use as menu option title. */
    readonly name: string,
    /** Command identification serial. */
    readonly serial: number,
    /** Sort order value. */
    readonly weight: Weight,
    /** True if this command's execution leaves the actor unable to take further action. */
    readonly spendsUnit: boolean,
    /**  */
    readonly chain: CommandObject[],
    /** Returns true if this command should be included in a ListMenu. */
    triggerInclude: () => boolean,
    /** Effects changes on the board. */
    scheduleEvent: () => ExitCode,
  }

  /** Auto generates a new serial so I don't have to hardcode them manually. */
  export const Serial = SerialGen();
  function* SerialGen(): Generator<number, number, number> {
    let serial = -1;
    while (true) {
      serial++;
      yield serial;
    }
  }
  
  /** Returns a CommandObject<number> corrosponding to the given serial number. */
  export function getCommandObject(serial: number): CommandObject {
    const command = Object.values(Command).find( c => c.serial === serial );
    if (!command)
      throw new Error(`could not retrieve command object for serial ${serial}`);
    return command;
  }

  /** Given a command object, schedules all ratification events relevant to the
   * execution of that command. */
  export function scheduleEvents(command: CommandObject) {
    for (const cmd of command.chain) {
      const code = cmd.scheduleEvent();
      if (code !== ExitCode.Success)
        break;
    }
  }

}
