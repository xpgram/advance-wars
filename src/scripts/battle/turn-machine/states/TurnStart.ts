import { Common } from "../../../CommonUtils";
import { TurnState } from "../TurnState";
import { UnitObject } from "../../UnitObject";
import { CheckBoardState } from "./CheckBoardState";
import { RepairEvent } from "../../map/tile-effects/RepairEvent";
import { Point } from "pixi.js";

export class TurnStart extends TurnState {
  get type() { return TurnStart; }
  get name() { return 'TurnStart'; }
  get revertible() { return false; }
  get skipOnUndo() { return false; }

  configureScene() {
    const { map, mapCursor, uiSystem, players, scenario, scripts, boardEvents } = this.assets;
    const player = players.current;

    // Update player stuff
    player.collectFunds();

    // Move Cursor
    if (player.units.length)
      mapCursor.teleport(player.lastCursorPosition);
    // TODO The camera should lag-follow on all cursor teleports.

    // Move UI Windows
    uiSystem.skipAnimations();

    // Per Unit effects
    player.units.forEach( unit => {
      if (!unit.onMap)
        return;

      const neighbors = map.neighborsAt(unit.boardLocation);
      const square = neighbors.center;
      const terrain = square.terrain;

      let expendMaintainanceGas = true;

      // Repair unit HP and resupply from properties
      if (terrain.building && terrain.faction === unit.faction) {
        if (terrain.repairType === unit.unitClass) {
          // TODO Move repair logic to UnitObject; resupply and repair
          // should emit event to their player object for the animation step.
          // if (unit.repairable())
          //   unit.repair();

          // Repair HP
          const maxUnitHp = UnitObject.MaxHp;
          const maxRepairHp = scenario.repairHp;
          const repairHp = Common.clamp(maxUnitHp - unit.hp, 0, maxRepairHp);
          const costToRepair = unit.cost * repairHp / maxUnitHp;

          const repairable = (repairHp > 0);
          const fundsAvailable = (costToRepair <= player.funds);
          if (repairable && fundsAvailable) {
            unit.hp += repairHp;
            player.expendFunds(costToRepair);
            boardEvents.add(new RepairEvent({location: unit.boardLocation}));
          }

          if (unit.resuppliable())
            unit.resupply();
          expendMaintainanceGas = false;
        }
      }

      // Resupply from Rig/APC
      if (neighbors.orthogonals.some( square => square.unit && unit.resuppliable(square.unit) )) {
        unit.resupply();
        expendMaintainanceGas = false;
      }

      // TODO TCopters shouln't tho. Mechs gettin' resupped by T's might be a little shit.
      unit.resupplyHeldUnits();

      // Expend gas if Air or Navy
      if (expendMaintainanceGas && players.day > 1)
        unit.expendMaintainanceGas();
      if (unit.destroyOnGasEmpty && unit.gas === 0)
        unit.destroy();
        // Emit an event to the animator

      // Let the players play.
      unit.orderable = true
    });

    // Configure initial control script states
    scripts.nextOrderableUnit.resetIndex();

    this.advance(CheckBoardState);
  }

}