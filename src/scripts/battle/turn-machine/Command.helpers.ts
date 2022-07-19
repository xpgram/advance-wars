import { RegionMap } from "../unit-actions/RegionMap";
import { Command } from "./Command";
import { TurnStateConstructor } from "./TurnState";

export module CommandHelpers {

  /** Error-type pertaining to an issue with confirming board changes. */
  export class RatificationError extends Error {
    name = 'RatificationError';
  }

  /** Schedule() response status. */
  export enum ExitCode {
    Success = 0,
    Interrupted,
    SchedulingFault,
  }

  /** Names for sorting weight categories; indicates menu order. */
  export enum Weight {
    /** First order abilities: Attack. */
    Primary,
    /** Second order abilities: Unit specific special actions. */
    Secondary,
    /** Third order abilities: Unit specific special actions secondary. */
    Tertiary,
    /** Fourth order abilities: Unit specific special actions tertiary. */
    Quaternary,
    /** Primary-contextual actions. */
    Context1,
    /** Secondary-contextual actions. */
    Context2,
    /** Fulcrum of the list, usually the bottom. */
    Wait,
    /** Post-last: appears after Wait; actions which shouldn't be accidentally choosable. */
    Unpreferred,
    /** Bottom in list; indicates an item whose sort is irrelevant. */
    None,
  }

  /** Interface all Commands must adhere to. */
  export type CommandObject = {
    /** A reference to this command object's type. */
    readonly type: CommandObject,
    /** A list of Commands and the order they must be scheduled when this
     * command is invoked. */
    readonly chain: CommandObject[],
    /** A list of TurnStates which must be ingressed through to complete
     * the information prerequisites to invoke this command. */
    readonly ingressSteps: TurnStateConstructor[],
    /** Name string; use as menu option title. */
    readonly name: string,
    /** Command identification serial. */
    readonly serial: number,
    /** Sort order value. */
    readonly weight: Weight,
    /** True if this command's execution leaves the actor unable to take further action. */
    readonly spendsUnit: boolean,
    /** Returns true if this command should be included in a ListMenu. */
    triggerInclude: () => boolean,
    /** Effects changes on the board. */
    scheduleEvent: () => ExitCode,
  }

  /** Describes an object which describes an area-of-effect via an
   * assigned RegionMap member. */
  export type UniqueStats = {
    effectAreaMap?: RegionMap,
    range?: NumericRange,
    damage?: number,
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
