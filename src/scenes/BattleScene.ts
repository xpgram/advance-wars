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

/**
 * @author Dei Valko
 * @version 0.2.0
 */
export class BattleScene extends Scene {

    // Objectives:
    // - Get all this setup into the scenario builder (asset/controller package)
    // - Get BattleSystemController to control it via turn state scripts

    map!: Map;
    camera!: Camera;
    gamepad!: VirtualGamepad;        // TODO Link this up as a property of Game.
    cursor!: MapCursor;
    infoWindow!: InfoWindowSystem;

    unitsList: UnitObject[] = [];
    unitSwap: UnitObject | null = null;

    car!: TrackCar;

    cameraZoomSlider = new Slider({
        track: 'max',
        granularity: 0.1
    });

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
        this.map = new Map(25, 9);

        let unitTypes = [Unit.Infantry, Unit.Mech, Unit.Bike, Unit.Tank, Unit.MdTank, Unit.WarTank,
            Unit.Recon, Unit.Rig, Unit.AntiAir, Unit.Flare, Unit.Artillery, Unit.AntiTank, Unit.Rockets,
            Unit.Missiles, Unit.TCopter, Unit.BCopter, Unit.Duster, Unit.Fighter, Unit.Bomber, Unit.Seaplane,
            Unit.Stealth, Unit.Seeker, Unit.Lander, Unit.Gunboat, Unit.Cruiser, Unit.Submarine, Unit.Carrier, Unit.Battleship];

        // Create some unts, bb ye
        let numUnits = Math.floor(Math.pow(Math.random(), 2)*25) + 15;
        for (let i = 0; i < numUnits; i++) {
            let unit = new unitTypes[ Math.floor(Math.random()*unitTypes.length) ]();
            unit.init(null);

            this.unitsList.push(unit);

            let roll = (n: number) => {
                return Math.round((Math.pow(-Math.pow(Math.random(), 4) + 1, 2)) * n);
            }

            unit.hp = roll(100);
            unit.gas = roll(unit.maxGas);
            unit.ammo = Math.round(Math.random() * unit.maxAmmo);
            unit.sprite.x = unit.sprite.y = -100;  // I can't destroy units yet, so here.
            unit.uiBox.x = unit.uiBox.y = -100;

            for (let i = 0; i < 10; i++) {   // Only attempt 5 times
                let x = Math.floor(Math.random()*this.map.width);
                let y = Math.floor(Math.random()*this.map.height);

                if (this.map.squareAt({x:x,y:y}).occupiable(unit) &&
                    this.map.squareAt({x:x,y:y}).terrain.getMovementCost(unit.moveType) != 0) {
                    this.map.placeUnit(unit, {x:x, y:y});
                    break;
                }
            }
        }
        MapLayers['top'].sortChildren();
        MapLayers['ui'].sortChildren();

        this.camera = new Camera(Game.stage);
        // Do it here.
        // Also, since I need it several places, I should probably initialize it here instead of in new Map()
        // ↑ I think this is referring to the camera?

        // This needs to go somewhere else, like MapLayers.init() or TerrainMethods.startPaletteAnimation(),
        // but how do I inform them... oh, never mind. They don't need to know where the camera's x/y is.
        let cameraView = new PIXI.Rectangle(0, 0, Game.display.width, Game.display.height);
        (MapLayers['top'] as PIXI.Container).filterArea = cameraView;
        (MapLayers['bottom'] as PIXI.Container).filterArea = cameraView;
        // I think this ('bottom', anyway) was meant to cull processing by filters placed on them.
        // I don't know if this has any appreciable effect.

        // Set a backdrop for viewing pleasures
        let backdrop = new PIXI.Sprite( Game.app.loader.resources['background'].texture );
        Game.backdrop.addChild( backdrop );

        // Testing out gamepads, babay
        this.gamepad = new VirtualGamepad();
        this.cursor = new MapCursor(this.map, this.gamepad);
        this.camera.followTarget = this.cursor;

        // Info Window
        this.infoWindow = new InfoWindowSystem();
        this.infoWindow.gp = this.gamepad;
        this.infoWindow.map = this.map;
        this.infoWindow.cursor = this.cursor;
        this.infoWindow.camera = this.camera;
        // this.infoWindow = new InfoWindow(this.map, this.camera, this.gamepad);
        // this.infoWindow.inspectTile(this.cursor.pos);

        

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

        let c =  CardinalDirection;
        let unit = new Unit.Recon();
        unit.init();
        this.car = new TrackCar({x:3, y:3},
            [c.East, c.East, c.North, c.East, c.East, c.South, c.South, c.South, c.West, c.South, c.West, c.South, c.South, c.East, c.East, c.East, c.East],
            unit,
            true);
    }

    updateStep(delta: number): void {

        this.gamepad.update();      // Update gamepad state (should probably be in main game loop)

        // Proof that buttons work.
        if (this.gamepad.button.A.pressed) {
            this.car.start();

            let square = this.map.squareAt(this.cursor.pos);
            if (square.unit)
                this.unitSwap = square.unit;
            if (!square.unit && this.unitSwap && square.occupiable(this.unitSwap)) {
                this.map.squareAt(this.unitSwap.boardLocation).unit = null;
                this.map.placeUnit(this.unitSwap, this.cursor.pos);
                this.unitSwap = null;
                MapLayers['top'].sortChildren();
                this.infoWindow.inspectTile(square);
            }
        }

        if (this.gamepad.button.X.pressed) {
            let square = this.map.squareAt(this.cursor.pos);
            square.hidden = !square.hidden;
        }
        if (this.gamepad.button.B.pressed) {
            let square = this.map.squareAt(this.cursor.pos);
            square.moveable = !square.moveable;
        }

        // Playin wit units
        if (this.gamepad.button.B.pressed) {
            for (let unit of this.unitsList)
                unit.transparent = true;
        }
        if (this.gamepad.button.B.released) {
            for (let unit of this.unitsList) 
                unit.transparent = false;
        }

        if (this.gamepad.button.Y.pressed) {
            this.cameraZoomSlider.incrementFactor = -this.cameraZoomSlider.incrementFactor;
        }
        // Hardcoded constants are just different screen widths.
        this.camera.zoom = (320/448) + ((1 - 320/448) * this.cameraZoomSlider.value);
        this.cameraZoomSlider.increment();

        // Stage centering when stage is too smol
        // This, uh... don't look at it.
        // TODO Don't look at it.
        this.camera.followTarget = ((scene: BattleScene) => { return {
            get x() { return scene.cursor.transform.exact.x; },
            get y() { return scene.cursor.transform.exact.y; }
        }})(this);
        if (this.camera.width >= this.map.width*16 + 80 && this.camera.height >= this.map.height*16 + 64)
            this.camera.followTarget = {
                x: this.map.width*8,
                y: this.map.height*8
            }
        else if (this.camera.width >= this.map.width*16 + 80)
            this.camera.followTarget = ((scene: BattleScene) => { return {
                x: this.map.width*8,
                get y() { return scene.cursor.transform.exact.y; }
            }})(this);
        else if (this.camera.height >= this.map.height*16 + 64)
            this.camera.followTarget = ((scene: BattleScene) => { return {
                get x() { return scene.cursor.transform.exact.x; },
                y: this.map.height*8
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