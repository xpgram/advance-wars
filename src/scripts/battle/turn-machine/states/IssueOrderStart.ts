import { TurnState } from "../TurnState";
import { MoveUnit } from "./MoveUnit";
import { Point } from "../../../Common/Point";
import { ShowUnitAttackRange } from "./ShowUnitAttackRange";
import { MoveCamera } from "./MoveCamera";
import { Terrain } from "../../map/Terrain";
import { MapLayerFunctions } from "../../map/MapLayers";
import { Game } from "../../../..";
import { Keys } from "../../../controls/KeyboardObserver";
import { TurnEnd } from "./TurnEnd";
import { defaultUnitSpawnMap } from "../../UnitSpawnMap";
import { FieldMenu } from "./FieldMenu";
import { FactoryMenu } from "./FactoryMenu";


export class IssueOrderStart extends TurnState {
    get name() { return 'IssueOrderStart'; }
    get revertible() { return true; }   // ← If each state is either auto-skipped on undo or must deliberately cancel
    get skipOnUndo() { return false; }  //   itself via a function call, I wonder if this property is even necessary.

    advanceStates = {
        pickMoveLocation: {state: MoveUnit, pre: () => {}},
        showUnitAttackRange: {state: ShowUnitAttackRange, pre: () => {}},
        moveCamera: {state: MoveCamera, pre: () => {}},

        fieldMenu: {state: FieldMenu, pre: () => {}},
        factoryMenu: {state: FactoryMenu, pre: () => {}},
    }

    protected assert() {

    }

    protected configureScene() {
        // Reveal UI systems
        this.assets.mapCursor.show();
        this.assets.uiSystem.show();

        // Update player metrics
        this.assets.players.all.forEach( player => player.scanCapturedProperties() );

        // Update player window metrics
        this.assets.uiSystem.inspectPlayers();

        // Configure camera to follow cursor
        this.assets.camera.followTarget = this.assets.mapCursor;

        // Reset issuable unit command to none.
        this.assets.resetCommandInstruction();

        // Assign a seed for instruction randomization.
        this.assets.instruction.seed = Math.random()*Number.MAX_SAFE_INTEGER;

        // Activate control scripts.
        this.assets.scripts.nextOrderableUnit.enable();

        // Configure map cursor to update pointer graphic over certain terrains
        // const {map, mapCursor} = this.assets;
        // mapCursor.onMove( () => {
        //     const terrainType = map.squareAt(mapCursor.pos).terrain.type;
        //     const buildTerrains = [Terrain.Factory, Terrain.Airport, Terrain.Port];

        //     if (buildTerrains.some( terrain => terrain == terrainType ))
        //         mapCursor.setMode.build();
        //     else
        //         mapCursor.setMode.point();
        // });
        // TODO When uncommenting this, make sure mapCursor.clearMovementCallbacks()
        // is called in the UI reset function called between state changes.
    }

    update() {
        const { players, map, mapCursor, instruction, gamepad } = this.assets;
        const player = players.current;

        // On press A, select an allied unit to give instruction to
        if (gamepad.button.A.pressed) {
            const pos = mapCursor.pos;
            const square = map.squareAt(pos);
            const unit = square.unit;
            const player = this.assets.players.current;

            // TODO This should check team affiliation
            const orderableAlly = (unit?.orderable && unit?.faction === player.faction);
            const examinableEnemy = (unit?.faction !== player.faction);
            if (unit && (orderableAlly || examinableEnemy)) {
                instruction.place = unit.boardLocation;
                this.advanceToState(this.advanceStates.pickMoveLocation);
            }

            // The tile is empty and the terrain is a factory type.
            else if (!unit && this.assets.scenario.spawnMap.some( dict => dict.type === square.terrain.type && square.terrain.faction === player.faction )) {
                if (player.faction === square.terrain.faction)
                    this.advanceToState(this.advanceStates.factoryMenu);
            }

            // The tile has no particular function — open the Field Menu.
            else {
                this.advanceToState(this.advanceStates.fieldMenu);
            }
        }

        // On press B, show unit attack range or initiate move camera mode.
        else if (gamepad.button.B.pressed) {
            const pos = mapCursor.pos;
            const square = map.squareAt(pos);

            if (square.unit) {
                instruction.place = new Point(pos);
                this.advanceToState(this.advanceStates.showUnitAttackRange);
            } else
                this.advanceToState(this.advanceStates.moveCamera);
        }

        // On press Start, open the Field Menu.
        else if (gamepad.button.start.pressed) {
            this.advanceToState(this.advanceStates.fieldMenu);
        }


        // TODO Remove / Refactor
        const terrainType = map.squareAt(mapCursor.pos).terrain.type;
        const buildTerrains = [Terrain.Factory, Terrain.Airport, Terrain.Port];
        if (buildTerrains.some( terrain => terrain == terrainType )) {
            //mapCursor.setMode.build();
            if (this.assets.mapCursor.pointerSprite.textures[0] !== this.assets.mapCursor.cursorGraphics.constructPointer[0])
                this.assets.mapCursor.pointerSprite.textures = this.assets.mapCursor.cursorGraphics.constructPointer;
        }
        else
            //mapCursor.setMode.point();
            if (this.assets.mapCursor.pointerSprite.textures[0] !== this.assets.mapCursor.cursorGraphics.arrowPointer[0])
                this.assets.mapCursor.pointerSprite.textures = this.assets.mapCursor.cursorGraphics.arrowPointer;
    }

    prev() {
        
    }
}