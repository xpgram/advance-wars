import { Scene } from "./Scene";
import { Map } from "../scripts/battle/Map";
import { Game } from "..";
import { Camera } from "../scripts/Camera";
import { VirtualGamepad } from "../scripts/controls/VirtualGamepad";
import { MapCursor } from "../scripts/battle/MapCursor";
import { MapLayers } from "../scripts/battle/MapLayers";
import { InfoWindowSystem } from "../scripts/battle/ui-windows/InfoWindowSystem";
import { Unit } from "../scripts/battle/Unit";
import { UnitObject } from "../scripts/battle/UnitObject";
import { Slider } from "../scripts/Common/Slider";
import { Debug } from "../scripts/DebugUtils";
import { TrackCar } from "../scripts/battle/TrackCar";
import { CardinalDirection } from "../scripts/Common/CardinalDirection";
import { BattleSceneControllers } from "../scripts/battle/turn-machine/BattleSceneControllers";
import { BattleSystemManager } from "../scripts/battle/turn-machine/BattleSystemManager";

/**
 * @author Dei Valko
 * @version 0.2.0
 */
export class BattleScene extends Scene {

    battleSystem!: BattleSystemManager;
    controllers!: BattleSceneControllers;

    unitSwap: UnitObject | null = null;

    loadStep(): void {
        this.linker.push({name: 'NormalMapTilesheet', url: 'assets/sheets/normal-map-tiles-sm.json'});
        this.linker.push({name: 'NormalMapLandscapeSheet', url: 'assets/sheets/normal-map-landscapes.json'});
        this.linker.push({name: 'UnitSpritesheet', url: 'assets/sheets/unit-sprites.json'});
        this.linker.push({name: 'UISpritesheet', url: 'assets/sheets/ui-sprites.json'});
        this.linker.push({name: 'background', url: 'assets/background-battle.png'});

        this.linker.push({name: 'font-map-ui', url: 'assets/font-map-ui.xml'});
        this.linker.push({name: 'font-small-ui', url: 'assets/font-small-ui.xml'});
        this.linker.push({name: 'font-script', url: 'assets/font-script.xml'});
        this.linker.push({name: 'font-menu', url: 'assets/font-menu.xml'});
        this.linker.push({name: 'font-table-header', url: 'assets/font-table-header.xml'});
        this.linker.push({name: 'font-title', url: 'assets/font-title.xml'});
        this.linker.push({name: 'font-label', url: 'assets/font-label.xml'});
    }

    setupStep(): void {
        //this.controllers = new BattleSceneControllers({mapData: {width: 0, height: 0}});
        this.battleSystem = new BattleSystemManager({
            // stub
        });
        
        this.controllers = this.battleSystem.controllers;
        
        // Testing unit sprites
        // let unitName = 'seeker/red/idle';
        // let sheet = Game.app.loader.resources['UnitSpritesheet'].spritesheet;
        // let frames = sheet.animations[unitName];
        // frames.push(frames[1]);                     // This has to be done when the sheet is loaded, and so should be done in json, I guess; asking the units to do it causes muy problemas (too many frames.)
        // for (let i = 0; i < 5; i++) {
        //     let unit = new PIXI.AnimatedSprite(sheet.animations[unitName]);
        //     unit.animationSpeed = 1 / 12.5;     // Or 5 / 60, which is 5 frame updates per second.
        //     //unit.scale.x = -1;                // Then running could be 10 / 60.
        //     unit.x = unit.y = 32;               // And driving could be 15 / 60.
        //     unit.x += 16*i;
        //     unit.play();                        // Alt: idle = 4 / 50, which is 4 frames over 5/6ths a second.
        //     if (i % 3 == 0)                     //   running = 4 / 25       .42 seconds
        //         unit.tint = 0x888888;           //   driving = 3 / 12       .25 seconds
        //     Game.stage.addChild(unit);
        // }

        //// Syncing all units sprites:
        // Let there be a ticker of speed 0.08, whatever that is.
        // On update, increase a counter toward a maximum value (ping-ponging.)
        // Also on update, callback any listeners with the new value, so they can pull their new texture from sheet.animations['which'][frameIdx].
        // It would be smart of me to verify frameIdx is valid.
        // Eh.

        // Idle anim speed:        1/12.5   // Ping-pongs 3 frames      ← Both infantry and vehicles follow this one
        // Legs move anim speed:   1/6.25   // Ping-pongs 3 frames      // There are only 8 of these total. // TODO Copy frame 1 as 3 in texture-packer source.
        // Wheels move anim speed: 1/4      // Loops 3 frames           // Movement sprites do not need to be synced
        // Unit-spent tint:        0x888888
        // Unit-right is unit-left with scale.x = -1
        // MovementRailcar does ~not~ pause animation once it reaches its destination. It is just usually too fast to notice this.
    }

    updateStep(delta: number): void {

        // Migration of code in this step is massively incomplete.
        // I haven't even started the process.
        // A lot of this, which is almost entirely demo code, will be moved to various
        // turn states as toggleable scripts or as state-specific update scripts.
        // Some of it might remain here, though.
        // gamepad.update() shouldn't.
        // 
        // Speaking of gamepad, I need a gamepad manager that can handle losing and regaining
        // connections to more than one controller, and which will pass these connections on
        // to its VirtualGamepads.
        // This gamepad manager should route control of the first controller to P1, second to P2,
        // the first to P2 if there is no second, and the keyboard to all of them unless 2+ controllers
        // are connected.

        this.controllers.gamepad.update();  // Update gamepad state (should probably be in main game loop)

        // Window resize: camera-view rectangle fix.
        if (Game.display.width != (MapLayers['top'] as PIXI.Container).filterArea.width
            || Game.display.height != (MapLayers['top'] as PIXI.Container).filterArea.height) {

            let cameraView = new PIXI.Rectangle(0, 0, Game.display.width, Game.display.height);
            (MapLayers['top'] as PIXI.Container).filterArea = cameraView;
            (MapLayers['bottom'] as PIXI.Container).filterArea = cameraView;
        }

        // Proof that buttons work.
        /*if (this.controllers.gamepad.button.A.pressed) {
            this.controllers.trackCar.start();

            let square = this.controllers.map.squareAt(this.controllers.mapCursor.pos);
            if (square.unit)
                this.unitSwap = square.unit;
            if (!square.unit && this.unitSwap && square.occupiable(this.unitSwap)) {
                this.controllers.map.squareAt(this.unitSwap.boardLocation).unit = null;
                this.controllers.map.placeUnit(this.unitSwap, this.controllers.mapCursor.pos);
                this.unitSwap = null;
                MapLayers['top'].sortChildren();
                this.controllers.uiSystem.inspectTile(square);
            }
        }*/

        // Playin wit units
        // TODO Make this an activateable script for controllers.
        if (this.controllers.gamepad.button.B.pressed) {
            for (let unit of this.controllers.unitsList)
                unit.transparent = true;
        }
        if (this.controllers.gamepad.button.B.released) {
            for (let unit of this.controllers.unitsList) 
                unit.transparent = false;
        }

        // TODO Make this an activateable script for controllers.
        if (this.controllers.gamepad.button.Y.pressed) {
            this.controllers.cameraZoomSlider.incrementFactor = -this.controllers.cameraZoomSlider.incrementFactor;
        }
        // Hardcoded constants are just different screen widths.
        this.controllers.camera.zoom = (320/448) + ((1 - 320/448) * this.controllers.cameraZoomSlider.value);
        this.controllers.cameraZoomSlider.increment();

        // Stage centering when stage is too smol
        // This, uh... don't look at it.
        // TODO Don't look at it.
        this.controllers.camera.followTarget = ((scene: BattleScene) => { return {
            get x() { return scene.controllers.mapCursor.transform.exact.x; },
            get y() { return scene.controllers.mapCursor.transform.exact.y; }
        }})(this);
        if (this.controllers.camera.width >= this.controllers.map.width*16 + 80 && this.controllers.camera.height >= this.controllers.map.height*16 + 64)
            this.controllers.camera.followTarget = {
                x: this.controllers.map.width*8,
                y: this.controllers.map.height*8
            }
        else if (this.controllers.camera.width >= this.controllers.map.width*16 + 80)
            this.controllers.camera.followTarget = ((scene: BattleScene) => { return {
                x: this.controllers.map.width*8,
                get y() { return scene.controllers.mapCursor.transform.exact.y; }
            }})(this);
        else if (this.controllers.camera.height >= this.controllers.map.height*16 + 64)
            this.controllers.camera.followTarget = ((scene: BattleScene) => { return {
                get x() { return scene.controllers.mapCursor.transform.exact.x; },
                y: this.controllers.map.height*8
            }})(this);
        //   Here's what the above block is doing and what to focus on when refactoring:
        // As *soon* as the map is too small not to fit neatly inside the camera frame,
        // the x or y (or both) coordinate that we're 'following' snaps to the middle of
        // the map, and at that point, zooming out just means zoomin out evenly from the center.
        //   Another note: The cursor has a draw order issue with the camera that I haven't
        // kinked out yet. The camera needs to shift the stage (or itself) *after* the cursor
        // has moved, but *before* draw has been called. Otherwise you get mom's massage head
        // as a tile selector.
    }

    destroyStep(): void {
    }
}