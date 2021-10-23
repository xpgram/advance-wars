import { TurnState } from "../TurnState";
import { IssueOrderStart } from "./IssueOrderStart";


export class CheckBoardState extends TurnState {
    get name(): string { return "CheckBoardState"; }
    get revertible(): boolean { return false; }
    get skipOnUndo(): boolean { return false; }

    protected advanceStates = {
        startNewOrder: {state: IssueOrderStart, pre: () => {}}
    }

    protected assert(): void {

    }
    
    protected configureScene(): void {
        this.advanceToState(this.advanceStates.startNewOrder);

        // The below simulates a turn change by reactivating all units.
        // Instead of checking all squares on the board, this should check all
        // units as members of a Team object, once such a class is implemented.
        let oneOrderableUnit = false;
        for (let y = 0; y < this.assets.map.height; y++)
        for (let x = 0; x < this.assets.map.width; x++) {
            let square = this.assets.map.squareAt({x:x,y:y});
            if (square.unit)
                if (square.unit.orderable)
                    oneOrderableUnit = true;
        }

        if (!oneOrderableUnit) {
            this.assets.allInPlayUnits.forEach( unit => {
                unit.orderable = true;
            });
        }
    }

    update(): void {

    }

    prev(): void {

    }
}