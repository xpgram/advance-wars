import { ControlScript } from "../../ControlScript";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { Map } from "../map/Map";
import { MapCursor } from "../map/MapCursor";

/** Deprecated and in fact not used.
 * I leave this here as an example of how ControlScripts should look, though. */
class ShowUnitAttackRange extends ControlScript {

    private gamepad: VirtualGamepad;
    private map: Map;
    private mapCursor: MapCursor;
    private cursorHiddenByScript = false;

    constructor(gp: VirtualGamepad, map: Map, cursor: MapCursor) {
        super();
        this.gamepad = gp;
        this.map = map;
        this.mapCursor = cursor;
    }

    protected enableScript() {

    }

    protected updateScript() {
        if (this.gamepad.button.B.pressed) {
            this.showAttackRange();
        }
        else if (this.gamepad.button.B.released) {
            this.hideAttackRange();
        }
    }

    protected disableScript() {
        this.hideAttackRange();
    }

    private showAttackRange() {
        let unit = this.map.squareAt(this.mapCursor.pos).unit;

        if (unit) {
            if (!this.mapCursor.hidden) {
                this.mapCursor.hide();
                this.map.generateAttackRangeMap(unit);
                this.cursorHiddenByScript = true;
            }
        }
    }

    private hideAttackRange() {
        if (this.cursorHiddenByScript) {
            this.mapCursor.show();
            this.map.clearMovementMap();
            this.cursorHiddenByScript = false;
        }
    }
}