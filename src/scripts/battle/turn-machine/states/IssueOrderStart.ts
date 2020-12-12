import { TurnState } from "../TurnState";
import { MoveUnit } from "./MoveUnit";
import { Point } from "../../../Common/Point";
import { ShowUnitAttackRange } from "./ShowUnitAttackRange";
import { MoveCamera } from "./MoveCamera";
import { Terrain } from "../../map/Terrain";


export class IssueOrderStart extends TurnState {
    get name() { return 'IssueOrderStart'; }
    get revertible() { return true; }   // ← If each state is either auto-skipped on undo or must deliberately cancel
    get skipOnUndo() { return false; }  //   itself via a function call, I wonder if this property is even necessary.

    protected assert() {

    }

    protected configureScene() {
        this.assets.mapCursor.show();
        this.assets.uiSystem.show();

        this.assets.camera.followTarget = this.assets.mapCursor;

        this.assets.units.traveler == null;
    }

    // TODO Rewrite this to look more like MoveUnit, the first refactored state.
    // TODO Refactor BattleSceneControllers to be more organized.
    //      Specifically, condense units and locations to one object: order
    //          order.actor: Point
    //          order.path: CardinalDirection[]
    //          order.target: Point
    //          order.action: number
    // TODO assert() should not contain algorithms.
    //      I mean, it can, but for the sake of readability it should be discouraged.
    //      Confirm all states adhere this principle.


    update() {
        // Let button.A add a unit to unit swap
        if (this.assets.gamepad.button.A.pressed) {
            let pos = this.assets.mapCursor.pos;
            let square = this.assets.map.squareAt(pos);

            // TODO This should check team affiliation
            if (square.unit) {
                if (square.unit.orderable) {
                    this.assets.units.traveler = square.unit;
                    this.battleSystemManager.advanceToState(this.advanceStates.pickMoveLocation);
                }
            }
        }
        // On B.press, show unit attack range or initiate move camera mode.
        else if (this.assets.gamepad.button.B.pressed) {
            let pos = this.assets.mapCursor.pos;
            let square = this.assets.map.squareAt(pos);

            if (square.unit) {
                this.assets.locations.focus = new Point(pos);
                this.battleSystemManager.advanceToState(this.advanceStates.showUnitAttackRange);
            }
            else
                this.battleSystemManager.advanceToState(this.advanceStates.moveCamera);
        }

        // TODO Remove / Refactor
        // Since MapCursor is a ~Map~Cursor anyway, it makes sense for it to figure this out itself.
        // Then again, it should probably only happen under certain contexts.. like this one.. only..
        let terrainType = this.assets.map.squareAt(this.assets.mapCursor.pos).terrain.type;
        if (terrainType == Terrain.Factory || terrainType == Terrain.Airport || terrainType == Terrain.Port) {
            if (this.assets.mapCursor.pointerSprite.textures[0] !== this.assets.mapCursor.cursorGraphics.constructPointer[0])
                this.assets.mapCursor.pointerSprite.textures = this.assets.mapCursor.cursorGraphics.constructPointer;
        }
        else
            if (this.assets.mapCursor.pointerSprite.textures[0] !== this.assets.mapCursor.cursorGraphics.arrowPointer[0])
                this.assets.mapCursor.pointerSprite.textures = this.assets.mapCursor.cursorGraphics.arrowPointer;
    }

    prev() {
        
    }

    advanceStates = {
        pickMoveLocation: {state: MoveUnit, pre: () => {}},
        showUnitAttackRange: {state: ShowUnitAttackRange, pre: () => {}},
        moveCamera: {state: MoveCamera, pre: () => {}}
    }
}