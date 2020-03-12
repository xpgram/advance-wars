import { ControlScript } from "../../ControlScript";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { Map } from "../Map";
import { MapCursor } from "../MapCursor";
import { UnitObject } from "../UnitObject";

export class ShowUnitAttackRange extends ControlScript {

    private gamepad: VirtualGamepad;
    private map: Map;
    private mapCursor: MapCursor;
    private cursorHiddenByScript = false;

    // TODO These are 'public,' are they accessible even though ControlScript declares them protected?

    constructor(gp: VirtualGamepad, map: Map, cursor: MapCursor) {
        super();
        this.gamepad = gp;
        this.map = map;
        this.mapCursor = cursor;
    }

    enableScript() {

    }

    updateScript() {
        if (this.gamepad.button.B.pressed) {
            this.showAttackRange();
        }
        else if (this.gamepad.button.B.released) {
            this.hideAttackRange();
        }
    }

    disableScript() {
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