import { Common } from "../../../CommonUtils";
import { TurnState } from "../TurnState";
import { UnitObject } from "../../UnitObject";
import { CheckBoardState } from "./CheckBoardState";
import { RepairEvent } from "../../map/tile-effects/RepairEvent";
import { SupplyEvent } from "../../map/tile-effects/SupplyEvent";
import { UnitClass } from "../../EnumTypes";
import { GroundExplosionEvent } from "../../map/tile-effects/GroundExplosionEvent";
import { AirExplosionEvent } from "../../map/tile-effects/AirExplosionEvent";

export class TurnStart extends TurnState {
  get type() { return TurnStart; }
  get name() { return 'TurnStart'; }
  get revertible() { return false; }
  get skipOnUndo() { return false; }

  configureScene() {
    const { map, mapCursor, trackCar, camera, uiSystem, players, scenario, scripts, boardEvents } = this.assets;
    const player = players.current;

    // Update player stuff
    player.collectFunds();

    // Move Cursor
    if (player.units.length)
      mapCursor.teleport(player.lastCursorPosition);
    // TODO The camera should lag-follow on all cursor teleports.

    // Move UI Windows
    uiSystem.skipAnimations();

    // TODO Refactor to split steps: spend, then repair;
    // sometimes aircraft miss rig resupply events because they haven't
    // expended any maintainance gas yet.

    // Per Unit effects
    player.units.forEach( unit => {
      if (!unit.onMap)
        return;

      const neighbors = map.neighborsAt(unit.boardLocation);
      const square = neighbors.center;
      const terrain = square.terrain;

      let supplied = false;   // Records for animation intent
      let repaired = false;
      let destroyed = false;
      const location = unit.boardLocation;

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
            repaired = true;
          }

          if (unit.resuppliable()) {
            unit.resupply();
            supplied = true;
          }
          expendMaintainanceGas = false;
        }
      }

      // Resupply from adjacent supplier — hypothetical, non-strict
      if (neighbors.orthogonals.some( square => square.unit && unit.resuppliable(square.unit, {strict: false}) )) {
        expendMaintainanceGas = false;
        // Resupply and emit — strict checking; don't resupply full units
        if (neighbors.orthogonals.some( square => square.unit && unit.resuppliable(square.unit) )) {
          unit.resupply();
          supplied = true;
        }
      }

      // Resupply held units if doable (method call returns success)
      supplied = unit.resupplyHeldUnits() || supplied;

      // Expend gas if Air or Navy
      if (expendMaintainanceGas && players.day > 1)
        unit.expendMaintainanceGas();
      if (unit.destroyOnGasEmpty && unit.gas === 0) {
        unit.destroy();   // TODO This hasn't been animated yet.
        destroyed = true;
      }

      // Emit animation events   // TODO Manually add them to queue; this is weird.
      let event;

      if (destroyed) {
        if (unit.unitClass === UnitClass.Ground)
          event = new GroundExplosionEvent({location, map, trackCar});
        else
          event = new AirExplosionEvent({location, map, trackCar});
      }
      else if (repaired)
        event = new RepairEvent({location, camera});
      else if (supplied)
        event = new SupplyEvent({location, camera});

      if (event)
        boardEvents.add(event);

      // Let the players play.
      unit.orderable = true;
    });

    // Configure initial control script states
    scripts.nextOrderableUnit.resetIndex();

    this.advance(CheckBoardState);
  }

}