import { VirtualGamepad } from "./VirtualGamepad";
import { Debug } from "../DebugUtils";

/** 
 */
export class PlayerControlProxy {

    private controllers: VirtualGamepad[] = []; // The list of controllers
    private _portNumber = 0;                    // The current controller being listened to.

    constructor(...gamepads: VirtualGamepad[]) {
        if (gamepads.length <= 0)
            Debug.error("PlayerControlProxy was given no controllers.");

        this.controllers = gamepads;
    }

    destroy(): void {
        //@ts-ignore
        this.controllers = null;
    }

    /** Returns the gamepad being focused or "listened to." */
    get gamepad(): VirtualGamepad {
        return this.controllers[this.portNumber];
    }

    /** Tells this proxy to switch to the given controller number. */
    routeToPortNumber(n: number) {
        if (n < 0 || n >= this.controllers.length)
            Debug.error(`Cannot assign to controller port which does not exist: #${n}`);
        this._portNumber = n;
    }

    /** The controller index being listened to (or given by this object on request.) */
    get portNumber(): number {
        return this._portNumber;
    }

    /** The number of virtual controllers "connected" to this controller proxy. */
    get numControllers(): number {
        return this.controllers.length;
    }
}