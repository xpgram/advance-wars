import { Common } from "../../../CommonUtils";
import { Unit } from "../../Unit";
import { TurnState } from "../TurnState";
import { CheckBoardState } from "./CheckBoardState";

export class TurnStart extends TurnState {
  get name() { return ''; }
  get revertible() { return false; }
  get skipOnUndo() { return false; }

  advanceStates = {
    checkBoardState: { state: CheckBoardState, pre: () => { } }
  }

  assert() {
    // That there are no configuration conflicts
  }

  configureScene() {
    const player = this.assets.players.current;

    // Update player stuff
    player.collectFunds();

    // Move Cursor
    if (player.units.length)
      this.assets.mapCursor.teleport(player.units[0].boardLocation);
    // TODO The camera should lag-follow on all cursor teleports.

    // Move UI Windows
    this.assets.uiSystem.skipAnimations();

    // Per Unit effects
    player.units.forEach( unit => {
      const neighbors = this.assets.map.neighborsAt(unit.boardLocation);
      const square = neighbors.center;
      const terrain = square.terrain;

      // Repair unit HP and resupply from properties
      if (terrain.building && terrain.faction === unit.faction) {
        if (terrain.repairType === unit.unitClass) {
          // Repair HP
          const maxUnitHp = 100;  // TODO This should be a static property of UnitObject or something.
          const maxRepairHp = this.assets.scenario.repairHp;
          const repairHp = Common.confine(maxUnitHp - unit.hp, 0, maxRepairHp);
          const costToRepair = unit.cost * repairHp / maxUnitHp;
          if (costToRepair <= unit.boardPlayer.funds) {
            unit.hp += repairHp;
            unit.boardPlayer.expendFunds(costToRepair);
          }

          // TODO This should be an event that gets handled by the resupply animation step.
          if (unit.resuppliable())
            unit.resupply();
        }
      }

      // Resupply from Rig/APC
      if (neighbors.orthogonals.some( square => unit.resuppliable(square.unit) ))
        unit.resupply();

      // Let the players play.
      unit.orderable = true
    });

    this.advanceToState(this.advanceStates.checkBoardState);
  }

  update() {
    // Observer for next-state's pre-conditions
  }

  prev() {
    // Undo when rolling back
  }
}