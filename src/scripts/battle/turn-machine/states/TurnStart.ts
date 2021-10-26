import { TurnState } from "../TurnState";
import { CheckBoardState } from "./CheckBoardState";

export class TurnStart extends TurnState {
    get name() { return ''; }
    get revertible() { return false; }
    get skipOnUndo() { return false; }

    advanceStates = {
        checkBoardState: {state: CheckBoardState, pre: () => {}}
    }

    assert() {
        // That there are no configuration conflicts
    }

    configureScene() {
        const units = this.assets.players.current.units;

        // Move Cursor
        if (units.length)
            this.assets.mapCursor.teleport(units[0].boardLocation);
            // TODO The camera should lag-follow on all cursor teleports.

        // Per Unit effects
        units.forEach( unit => {
            // TODO Repair HP — This needs to be extracted into an animation step.
            // Also, funds and other jazz.
            const square = this.assets.map.squareAt(unit.boardLocation);
            const terrain = square.terrain;
            if (terrain.building && terrain.faction === unit.faction)
                if (terrain.repairType === unit.unitClass)
                    unit.hp += this.assets.scenario.repairHp;
                    // this.assets.players.current.expendFunds(unit.cost * .2);

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