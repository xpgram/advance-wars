import { TurnState } from "../TurnState";
import { RatifyIssuedOrder } from "./RatifyIssuedOrder";


export class AnimateBattle extends TurnState {
    get name(): string { return "CheckBoardState"; }
    get revertible(): boolean { return true; }
    get skipOnUndo(): boolean { return true; }

    protected advanceStates = {
        ratifyIssuedOrder: {state: RatifyIssuedOrder, pre: () => {}}
    }

    protected assert(): void {

    }
    
    protected configureScene(): void {
        // Calc damage to determine battle results
        // (animate tanks firing their cannons, etc.)——skip that step
        // if (hp == 0) destroy units
        //      hide && play explosion anim
        // once finished, advance to ratify

        // I can make units themselves play the explosion clip.
        // This eliminates the need to figure out which it should be, they'll already know,
        // and to hide them since they can just blank out their own sprites.
        //
        // Also, the units can figure their real-world location and create their explosion
        // animation there, allowing them to be safely removed from the board by ratify
        // without interfering with the animation.
        // The explosion needs to be a placeable object, then. Like a particle effect that
        // self destructs once animation is complete.
        // That'll be fun to write.
        
        // Last question, damage is randomized, how do I want to handle that?
        // Yes, yes, with a seed the pattern is deterministic, but only in sequence.
        // With at least two players, how do I gaurantee they come up with the same
        // numbers, that the sequence is preserved?
        // I ask because, with this step, I have committed to calculating damage twice.
        //
        // I could save the number, although I was trying to avoid that, condense
        // everything into instruction.
        //
        // I should probably just add a damage or battle step.
        // If ratify is the one which affects the board, then the battle step just
        // calcs and records a number, probably in instruction.

        this.advanceToState(this.advanceStates.ratifyIssuedOrder);
    }

    update(): void {

    }

    prev(): void {

    }
}