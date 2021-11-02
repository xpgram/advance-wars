import { CardinalDirection, SumCardinalVectorsToVector } from "../../../../Common/CardinalDirection";
import { Point } from "../../../../Common/Point";
import { Instruction } from "../../../EnumTypes";
import { UnitObject } from "../../../UnitObject";
import { BattleSceneControllers } from "../../BattleSceneControllers";

export class RatificationError extends Error {
  constructor(name: string, message: string) {
    super(`${name} → ${message}`);
    this.name = 'RatificationError';
  }
}

/**  */
type CommandObject = {

}

/**  */
const instructionData: {
  action: Instruction,
  which?: number,
  place?: Point,
  actor?: UnitObject,
  path?: CardinalDirection[],
  destination?: Point,
  focal?: Point,
  target?: UnitObject,
} = {
  action: -1,
}

/**  */
function updateInstructionData(assets: BattleSceneControllers) {
  
}

/**  */
function fillData(step: string, data: Object, assets: BattleSceneControllers): void {
  updateInstructionData(assets);
  
  Object.keys(data).forEach( key => {
    if (!instructionData[key])
      throw new RatificationError(step, `Missing data: ${key}`);
    data[key] = instructionData[key];
  })
}

/**  */
export module Command {
  export const Wait: CommandObject = {
    ratify(assets: BattleSceneControllers): void {
      const data: {} = {
        
      }
      fillData(data, assets);
    }
  }
  export const Attack: CommandObject = {

  }
}

/**  */
const Commad = {
  Wait: {
    name = 'RatifyWait';

    triggerInclude(assets: BattleSceneControllers): boolean {
      // TODO This should be... somewhere.
      // This code is going to be copied a ~lot~.

      const { instruction, map } = assets;
      const { place, path } = instruction;
      const location = this.assertData(place, `unit location`);
      const actor = this.assertData(map.squareAt(location).unit, `unit at location`);
      const travelPath = this.assertData(path, `actor's movement path`);
      const destination = SumCardinalVectorsToVector(travelPath).add(location);
      return map.squareAt(destination).occupiable(actor);
    }

    ratify(assets: BattleSceneControllers): void {
      const { instruction } = assets;
      const { place, path } = instruction;
      const location = this.assertData(place, `unit location`);
      const destination = 
      // call on RatifyMove?
      // return
  
      // TODO I can get rid of most of the above.
      // Map won't move when a tile is occupied,
      // and all I need to verify is that a move was successful.
    }
  },
}