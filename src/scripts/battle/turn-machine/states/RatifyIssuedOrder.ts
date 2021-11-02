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

// TODO Refactor to be less busy; responsibility for action effects doesn't really need
// to be handled *here*, does it?

export class RatifyIssuedOrder extends TurnState {
  get name(): string { return "RatifyIssuedOrder"; }
  get revertible(): boolean { return false; }
  get skipOnUndo(): boolean { return false; }

  protected advanceStates = {
    checkBoardState: { state: CheckBoardState, pre: () => { } }
  }

  protected assert(): void {
    
  }

  protected configureScene(): void {
    const get = this.assertData.bind(this);
    const { map, instruction, players } = this.assets;
    const player = players.current;

    const nonActorInstructions = [Instruction.SpawnUnit, Instruction.SpawnLoadUnit];

    const seed = get(instruction.seed, 'seed for turn randomization');
    const location = get(instruction.place, 'location of actor');
    const action = get(instruction.action, `actor's action`);

    // logic for actor actions
    if (!nonActorInstructions.includes(action)) {
      const actor = get(map.squareAt(location).unit, 'unit at location');
      const path = get(instruction.path, `actor's movement path`);
      const destination = SumCardinalVectorsToVector(path).add(location);

      // Revert settings set for TrackCar.
      map.squareAt(actor.boardLocation).hideUnit = false;

      // Set traveling unit as 'spent' for this turn.
      actor.spent = true;

      // Move traveling unit on the board.
      const moveSuccessful = this.assets.map.moveUnit(actor.boardLocation, destination)
        || instruction.action === Instruction.Join;
      if (this.assets.scenario.rigsInfiniteGas && actor.type !== Unit.Rig)
        actor.gas -= map.travelCostForPath(location, path, actor.moveType);

      if (moveSuccessful == false) {
        const p1 = actor.boardLocation;
        const p2 = destination;
        this.failTransition(`Move operation was unsuccessful: [Unit ${p1.toString()} '${map.squareAt(p1).unit}' → Unit ${p2.toString()} '${map.squareAt(p2).unit}'] failed.`);
      }

      // Requires target point
      if (![Instruction.Wait].includes(action)) {
        const focal = (instruction.action === Instruction.Join)
          ? new Point()   // Bandaid. This whole thing needs a huge refactor. It has waaay too much responsibility.
          : get(instruction.focal, `point of focus for action`);

        // Attack Action
        if (instruction.action == Instruction.Attack) {
          const toRemove: UnitObject[] = [];

          const damageApply = (attacker: UnitObject, defender: UnitObject, dmg: number) => {
            if (dmg == 0)
              return;

            defender.hp -= dmg;

            if (attacker.attackMethodFor(defender) == AttackMethod.Primary)
              attacker.ammo -= 1;

            if (defender.hp == 0)
              toRemove.push(defender);
          }

          const targetLoc = this.assertData(instruction.focal, 'location of attack target');
          const target = this.assertData(map.squareAt(targetLoc).unit, 'target unit for attack');

          const battleResults = DamageScript.NormalAttack(map, actor, target, seed);

          damageApply(actor, target, battleResults.damage);
          damageApply(target, actor, battleResults.counter);

          for (const unit of toRemove)
            map.destroyUnit(unit.boardLocation);
        }

        // Capture Action
        if (instruction.action === Instruction.Capture) {
          actor.captureBuilding();
          if (actor.buildingCaptured()) {
            actor.stopCapturing();
            map.squareAt(actor.boardLocation).terrain.faction = actor.faction;
          }
        }

        // Supply Action
        if (instruction.action === Instruction.Supply) {
          map.neighborsAt(actor.boardLocation).orthogonals.forEach(square => {
            if (square.unit && square.unit.faction === actor.faction)
              square.unit.resupply();
          });
        }

        // Join two units
        if (instruction.action === Instruction.Join) {
          const otherUnit = this.assertData(map.squareAt(destination).unit, `unit to join with`);
          const { hp, gas, ammo } = actor;

          const extraHp = Math.max(hp + otherUnit.hp - UnitObject.MaxHp, 0);
          const returnedFunds = extraHp / UnitObject.MaxHp * actor.cost;
          player.funds += returnedFunds;

          otherUnit.hp += hp;
          otherUnit.gas += gas;
          otherUnit.ammo += ammo;

          actor.destroy();
        }

      }

      // Update player controls.
      this.assets.mapCursor.teleport(destination);
    }

    // logic for non-actor actions
    if (nonActorInstructions.includes(action)) {
      // Spawn Unit
      if (instruction.action === Instruction.SpawnUnit) {
        const which = get(instruction.which, `actor's action variant for enumerable ${action}`);
        const unit = this.assets.players.current.spawnUnit({
          location,
          serial: which,
          spent: true,
        });
        this.assets.players.current.expendFunds(unit.cost);
      }
    }

    // Cleanup assets used for issuing order.
    instruction.place = undefined;
    instruction.path = undefined;
    instruction.action = undefined;
    instruction.which = undefined;
    instruction.focal = undefined;

    // Advance to next state.
    this.advanceToState(this.advanceStates.checkBoardState);
  }

  update(): void {

  }

  prev(): void {

  }
}