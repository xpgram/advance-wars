import { TurnState } from "../TurnState";
import { IssueOrderStart } from "./IssueOrderStart";
import { TurnEnd } from "./TurnEnd";


export class CheckBoardState extends TurnState {
    get name(): string { return "CheckBoardState"; }
    get revertible(): boolean { return false; }
    get skipOnUndo(): boolean { return false; }

    protected advanceStates = {
        startNewOrder: {state: IssueOrderStart, pre: () => {}},
        turnEnd: {state: TurnEnd, pre: () => {}},
        // teamLoss: {state: ??, pre: () => {}},
    }

    protected assert(): void {

    }
    
    protected configureScene(): void {
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

        // Next state
        this.advanceToState( (oneOrderableUnit)
            ? this.advanceStates.startNewOrder
            : this.advanceStates.turnEnd );
    }

    update(): void {

    }

    prev(): void {

    }
}