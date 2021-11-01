import { Point } from "pixi.js";
import { CardinalDirection } from "../../../../Common/CardinalDirection";
import { Instruction } from "../../../EnumTypes";
import { UnitObject } from "../../../UnitObject";
import { BattleSceneControllers } from "../../BattleSceneControllers";
import { StateTransitionError } from "../../TurnState";

export class RatificationError extends StateTransitionError {
  name = 'RatificationError';
}

type InstructionData = {
  action: Instruction,
  which?: number,
  place?: Point,
  actor?: UnitObject,
  path?: CardinalDirection[],
  destination?: Point,
  focal?: Point,
  target?: UnitObject,
}

export abstract class CommandObject {
  protected assertData<T>(data: T | null | undefined, msg: string): T {
    if (data === null || data === undefined)
      throw new RatificationError(this.name, `Missing data: ${msg}`);
    return data as T;
  }

  /** Data used by the inheriting ratify steps. */
  protected abstract instruction: Object; 

  // TODO Can I make this dummy container static and non-updateable
  // unless a different instruction is provided?
  // To eliminate redundant configuring.
  protected instructionData!: InstructionData;

  /**  */
  fillInstructionContainer(assets: BattleSceneControllers): void {
    const { instruction, map } = assets;
    const { action, which, place, path, focal } = instruction;

    // Every key string must have an associated value from the dummy container.
    const keys = Object.keys(this.instruction);

    const get = <T>(data: T, required: boolean, msg: string): T => {
      return (required)
        ? this.assertData(data, msg)
        : undefined;
    }

    // fill as much of the dummy container as possible
    const ins: InstructionData = {
      action: this.assertData(action, `action signifier`),
    };

    ins.place = get(place, keys.includes('place'), `action location`);

    this.instructionData = ins;
  }

  /** The title for this ratification step; useful for debugging. */
  abstract readonly name: string;

  /**  */
  triggerInclude(assets: BattleSceneControllers): boolean {
    return this.triggerIncludeScript(assets);
  }

  /** Returns true if the conditions are present for this command to be
   * included, probably in a menu. */
  abstract triggerIncludeScript(assets: BattleSceneControllers): boolean;

  /**  */
  ratify(assets: BattleSceneControllers): void {
    this.ratifyScript(assets);
  }

  /** The script which effects changes on the board.
   * @throws RatificationError */
  abstract ratifyScript(assets: BattleSceneControllers): void;
}