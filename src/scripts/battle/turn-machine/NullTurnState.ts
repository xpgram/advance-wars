import { TurnState } from "./TurnState";
import { StringDictionary } from "../../CommonTypes";
import { NextState } from "./BattleSystemManager";

/** The zeroth TurnState; an empty, blank container. */
export class NullTurnState extends TurnState {
    get name(): string { return 'Null'; }
    get revertible(): boolean { return true; }
    get skipOnUndo(): boolean { return true; }
    protected advanceStates: StringDictionary<NextState> = {};
    protected assert(): void {}
    protected configureScene(): void {}
    update(): void {}
    prev(): void {}
}