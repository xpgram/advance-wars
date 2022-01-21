import { Common } from "../../../CommonUtils";
import { DestructEvent } from "../../map/tile-effects/DestructEvent";
import { SpeechBubbleEvent } from "../../map/tile-effects/SpeechBubbleEvent";
import { UnitObject } from "../../UnitObject";
import { TurnState } from "../TurnState";
import { AnimateEvents } from "./AnimateEvents";


/** Handles pre-turn events such as funds collection, resupply and repair events,
 * and air/naval crash conditions. */
export class StandbyPhase extends TurnState {
  get type() { return StandbyPhase; }
  get name() { return 'StandbyPhase'; }
  get revertible() { return false; }
  get skipOnUndo() { return false; }

  configureScene() {
    const { map, trackCar, camera, players, scenario, boardEvents } = this.assets;
    const player = players.current;

    // Update player stuff
    player.collectFunds();
    player.CoUnitTurnDelay--;
    players.perspectivesTurn?.setCoBoardableIndicators();

    // Pretend-spend player funds on repairs so we know what their limit is.
    let remainingFunds = player.funds;

    // Per Unit effects
    player.units.forEach( unit => {
      if (!unit.onMap)
        return;

      const neighbors = map.neighborsAt(unit.boardLocation);
      const square = neighbors.center;
      const terrain = square.terrain;

      let supplied = false;   // Records for animation intent
      let repaired = false;
      let repairHp = 0, repairCost = 0;
      let destroyed = false;

      let expendMaintainanceGas = true;

      // Repair unit HP and resupply from properties
      if (terrain.building && terrain.faction === unit.faction) {
        if (terrain.repairType === unit.unitClass) {
          // TODO RepairEvent does the ratification, am I doubling up on code here?

          // Repair HP
          const maxUnitHp = UnitObject.MaxHp;
          const maxRepairHp = scenario.repairHp;
          const remainder = (10 - unit.hp % 10) % 10; // Range 0–9
          repairHp = Common.clamp(maxUnitHp - unit.hp, 0, maxRepairHp) + remainder;
          repairCost = unit.cost * repairHp / maxUnitHp;

          const repairable = (repairHp > 0);
          const fundsAvailable = (repairCost <= remainingFunds);
          if (repairable && fundsAvailable) {
            remainingFunds -= repairCost;
            repaired = true;
          }

          if (unit.resuppliable())
            supplied = true;

          expendMaintainanceGas = false;
        }
      }

      // Resupply from adjacent supplier — hypothetical, non-strict
      if (neighbors.orthogonals.some( square => square.unit && unit.resuppliable(square.unit, {strict: false}) )) {
        expendMaintainanceGas = false;
        // Resupply and emit — strict checking; don't resupply full units
        if (neighbors.orthogonals.some( square => square.unit && unit.resuppliable(square.unit) ))
          supplied = true;
      }

      // Resupply held units if doable (method call returns success)
      supplied = unit.resupplyHeldUnits() || supplied;

      // Expend gas if Air or Navy
      if (expendMaintainanceGas && players.day > 1)
        unit.expendMaintainanceGas();
      if (unit.destroyOnGasEmpty && unit.gas === 0) {
        destroyed = true;
      }

      // Emit animation events   // TODO Manually add them to queue; this is weird.
      let event;

      if (destroyed)
        event = new DestructEvent({unit, trackCar, assets: this.assets});
      else if (repaired)
        event = new SpeechBubbleEvent({
          message: 'repair',
          actor: unit,
          repairHp,
          repairCost,
          camera,
        });
      else if (supplied)
        event = new SpeechBubbleEvent({
          message: 'supply',
          actor: unit,
          camera,
        });

      if (event)
        boardEvents.schedule(event);

      // Let the players play.
      unit.orderable = true;
    });

    this.advance(AnimateEvents);
  }
}