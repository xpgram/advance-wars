import { TurnStateController } from "./TurnStateController";

export abstract class TurnState {
    /** Reference to the game state controller (battle). */
    protected controller: TurnStateController;

    /** The name of this game state. Useful for debugging. */
    abstract name: string;

    /** Whether this state refuses to execute when reached from a future state.
     * If this setting is true, the desired behavior is to reach further back in state history when regressing. */
    skipOnUndo = false;

    constructor(cont: TurnStateController) {
        this.controller = cont;
    }

    /** Returns false if this state's scene dependencies aren't met on state initiation.
     * Useful for reporting when the previous state transitioned to next without providing the
     * information next needs to operate. */
    abstract assertDependencies(): boolean;

    /** Explicitly enables control scripts relevant to the state (important to avoid conflicts.)
     * ControlScripts not enabled here are necessarily disabled. */
    protected abstract configureScene(): void;

    /** Any frame-by-frame tasks the state script needs to have done. Generally used to watch
     * for state-advancement conditions. */
    abstract update(): void;

    /** Un-changes whatever scene information might have changed as a result of this state's control. */
    abstract undo(): void;

    open() {
        this.configureScene();
    }

    close() { }

    destroy() {
        //@ts-ignore
        this.controller = null;
    }

    nextState: NextState | null = null;

    // Move to 'real' implementations of TurnState
    advanceStates = {
        // Ex.
        pickAttackTarget: {state: PickAttackTargetState, pre: () => {} },
        finalizeState: {state: FinalizeOrderState, pre: () => {} }

        // When picking an action, each action leads to a different scenario.
        // pickAttackTarget would let you pick an adjacent unit to brutalize.
        // Picking 'Wait' would end that unit's turn.
        // I'm still working out the details, but I want a stack + multi-destination state system.
        // .prev() undoes anything this state tried to before control is relinquished to the previous state in the stack.
        // .next() runs a callback described by the given new state to do any pre-setup this state might need to.
        // Often, it probably won't need to.
        // I'm tired.

        // pre(), speicifically, is probably not needed,
        // but a way to send messages to new states will be.
        // controller.assets is ~kind of~ that service, but I dunno.

        // Basically, I need to decide if 'attack execution step' gets which
        // attack is to be done from controller.assets or a special message from
        // the previous state. Assets sounds easier, but I wonder.
    }
}

type TurnStateConstructor = {
    new (cont: TurnStateController): TurnState;
}

// I'm saving this as an idea in case I run into a scenario that might need it.
type NextState = {
    state: TurnStateConstructor,
    pre: Function
}