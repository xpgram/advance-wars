import { TurnState } from "../TurnState";
import { CheckBoardState } from "./CheckBoardState";
import { UnitObject } from "../../UnitObject";
import { Point } from "../../../Common/Point";
import { MapLayer } from "../../map/MapLayers";
import { CardinalVector, SumCardinalVectorsToVector, CardinalDirection } from "../../../Common/CardinalDirection";
import { Debug } from "../../../DebugUtils";
import { DamageScript } from "../../DamageScript";
import { AttackMethod, Instruction } from "../../EnumTypes";
import { Unit } from "../../Unit";
import { threadId } from "worker_threads";
import { Common } from "../../../CommonUtils";
import { Command, getCommandObject } from "../Command";
import { instructionData } from "../InstructionData";

// TODO Refactor to be less busy; responsibility for action effects doesn't really need
// to be handled *here*, does it?

export class RatifyIssuedOrder extends TurnState {
  get name(): string { return "RatifyIssuedOrder"; }
  get revertible(): boolean { return false; }
  get skipOnUndo(): boolean { return false; }

  protected advanceStates = {
    checkBoardState: { state: CheckBoardState, pre: () => { } },
  }

  protected assert(): void {
    
  }

  protected configureScene(): void {
    const get = this.assertData.bind(this);
    const { map, instruction } = this.assets;

    const nonActorInstructions = [Instruction.SpawnUnit, Instruction.SpawnLoadUnit];

    const action = get(instruction.action, `serial for action to be taken`);
    const location = get(instruction.place, 'location of actor');

    const tileEmpty = (!map.squareAt(location).unit);

    // Revert settings set for TrackCar.
    map.squareAt(location).hideUnit = false;

    // Retrieve and execute command
    const command = getCommandObject(action);
    command.ratify();

    // Drop units // TODO bad implementation; doesn't make use of Drop.ratify()
    if (!tileEmpty) {
      const { actor } = this.data;
      this.data.drop
        .sort( (a,b) => b.which - a.which )
        .forEach( d => {
          const { which, where } = d;
          const unit = actor.unloadUnit(which);
          map.placeUnit(unit, where);
          unit.spent = true;
        });
    }

    // Update player controls.
    if (instruction.path) {
      const path = get(instruction.path, `actor's movement path`);
      const destination = SumCardinalVectorsToVector(path).add(location);
      this.assets.mapCursor.teleport(destination);
    }

    // Advance to next state.
    this.advanceToState(this.advanceStates.checkBoardState);
  }

  update(): void {

  }

  prev(): void {

  }
}