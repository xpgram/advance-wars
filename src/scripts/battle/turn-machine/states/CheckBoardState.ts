import { TurnState } from "../TurnState";
import { IssueOrderStart } from "./IssueOrderStart";
import { TurnEnd } from "./TurnEnd";


export class CheckBoardState extends TurnState {
    get name(): string { return "CheckBoardState"; }
    get revertible(): boolean { return false; }
    get skipOnUndo(): boolean { return false; }

    protected advanceStates = {
        startNewOrder: {state: IssueOrderStart, pre: () => {}},
        // teamLoss: {state: ??, pre: () => {}},
    }

    protected assert(): void {

    }
    
    protected configureScene(): void {
        // TODO Check players for win conditions, etc.
        
        this.advanceToState(this.advanceStates.startNewOrder);
    }

    update(): void {

    }

    prev(): void {

    }
}