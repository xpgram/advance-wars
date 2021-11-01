import { BattleSceneControllers } from "../../BattleSceneControllers";
import { StateTransitionError } from "../../TurnState";

export class RatificationError extends StateTransitionError {
  name = 'RatificationError';
}

export abstract class RatifyAction {
  protected assertData<T>(data: T | null | undefined, msg: string): T {
    if (data === null || data === undefined)
      throw new RatificationError(this.name, msg);
    return data as T;
  }
  abstract readonly name: string;
  abstract ratify(assets: BattleSceneControllers): void;
}