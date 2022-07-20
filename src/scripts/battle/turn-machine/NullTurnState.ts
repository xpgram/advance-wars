import { TurnState } from "./TurnState";
import { NextState } from "./BattleSystemManager";

/** The zeroth TurnState; an empty, blank container. */
export class NullTurnState extends TurnState {
    get type() { return NullTurnState; }
    get name(): string { return 'Null'; }
    get revertible(): boolean { return true; }
    get skipOnUndo(): boolean { return true; }
    protected advanceStates: Record<string, NextState> = {};
    protected assert(): void {}
    protected configureScene(): void {}
    update(): void {}
    prev(): void {}
}