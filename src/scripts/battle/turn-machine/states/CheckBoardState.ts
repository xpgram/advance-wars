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
        let oneOrderableUnit = this.assets.players.current.units.some( u => u.orderable );
        
        this.advanceToState( (oneOrderableUnit)
            ? this.advanceStates.startNewOrder
            : this.advanceStates.turnEnd );
    }

    update(): void {

    }

    prev(): void {

    }
}