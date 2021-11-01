import { SumCardinalVectorsToVector } from "../../../../Common/CardinalDirection";
import { BattleSceneControllers } from "../../BattleSceneControllers";
import { CommandObject } from "./CommandObject";


const Command = {
  Wait: new (class WaitCommand extends CommandObject {
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
  }),
}