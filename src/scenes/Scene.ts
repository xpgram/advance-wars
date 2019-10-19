let UNBUILT = 0;
let READY = 1;

/**
 * @author Dei Valko
 * @version 1.0.0
 */
export abstract class Scene {
    private state: number;

    /** Whether the scene object still needs to set up its constructs. */
    get mustInitialize() { return this.state == UNBUILT; };
    /** Whether the scene object is set up and ready to be used. */
    get ready() { return this.state == READY; };

    constructor() {
        this.state = UNBUILT;
    }

    /** Initialize step sets up the scene and readies it for the game-loop. */
    init() {
        if (this.state == UNBUILT) {
            this.initStep();
            this.state = READY;
        } else
            throw new Error("Attempted to reconstruct a constructed scene.");
    }

    /** Update step describes frame-by-frame events. */
    update(delta: number) {
        if (this.state == READY)
            this.updateStep(delta);
    }

    /** Destroy step disassembles the scene object and un-readies it for game-looping. */
    destroy() {
        if (this.state == READY) {
            this.destroyStep();
            this.state = UNBUILT;
        } else
            throw new Error("Attempted to destroy an unconstructed scene.");
    }

    abstract initStep(): void;
    abstract updateStep(delta: number): void;
    abstract destroyStep(): void;
}