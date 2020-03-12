
/** Generic inheritable. A pattern script which is dis/enablable, the contents of
 * which must be written into an abstract inherited method. */
export abstract class ControlScript {
    /** Whether this script updates. */
    private active: boolean = true;

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

    /** The main control script. Runs once per cycle, whatever a cycle may be. */
    protected abstract updateScript(): void;
    /** The opening script. Runs once during enabling. */
    protected abstract enableScript(): void;
    /** The closing script. Runs once during disabling. */
    protected abstract disableScript(): void;
}