import { BattleSceneControllers } from "./battle/turn-machine/BattleSceneControllers";

/** Generic inheritable. A pattern script which is dis/enablable, the contents of
 * which must be written into an abstract inherited method. */
export abstract class ControlScript {
    /** Whether this script updates. */
    private active: boolean;

    /** Reference to game assets for fine-tuning. */
    protected assets: BattleSceneControllers;

    
    constructor(assets: BattleSceneControllers) {
        this.assets = assets;
        this.active = this.defaultEnabled();
    }

    destroy() {
        //@ts-expect-error
        this.assets = undefined;
    }

    /** Updates or runs the main script. Will not run even if called if the script is disabled. */
    update() {
        if (this.active)
            this.updateScript();
    }

    /** Turns the script on, enabling its cycle-by-cycle processing. */
    enable() {
        if (!this.active) {
            this.enableScript();
            this.active = true;
        }
    }

    /** Turns the script off, preventing it from processing. */
    disable() {
        if (this.active) {
            this.disableScript();
            this.active = false;
        }
    }

    /** Whether or not this script is enabled by default, disabled by request. */
    abstract defaultEnabled(): boolean;
    /** The main control script. Runs once per cycle, whatever a cycle may be. */
    protected abstract updateScript(): void;
    /** The opening script. Runs once during enabling. */
    protected abstract enableScript(): void;
    /** The closing script. Runs once during disabling. */
    protected abstract disableScript(): void;
}