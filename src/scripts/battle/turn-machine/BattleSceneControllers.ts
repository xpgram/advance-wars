import { MapCursor } from "../MapCursor";
import { Map } from "../Map";
import { Camera } from "../../Camera";
import { Game } from "../../..";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { InfoWindowSystem } from "../ui-windows/InfoWindowSystem";
import { TrackCar } from "../TrackCar";
import { MapLayers } from "../MapLayers";
import { Slider } from "../../Common/Slider";
import { Unit } from "../Unit";
import { UnitObject } from "../UnitObject";
import { CardinalDirection } from "../../Common/CardinalDirection";
import { Point } from "../../Common/Point";
import { StringDictionary } from "../../CommonTypes";
import { ShowUnitAttackRange } from "../control-scripts/showUnitAttackRange";


export class BattleSceneControllers {

    gamepad: VirtualGamepad;
    camera: Camera;
    map: Map;
    mapCursor: MapCursor;
    uiSystem: InfoWindowSystem;

    trackCar: TrackCar;

    /** A collection of references to notable unit objects. */
    units: {
        traveler: UnitObject | null,
        target: UnitObject | null
    } = {
        traveler: null,
        target: null
    }

    /** A collection of notable point objects. */
    locations: {
        travelDestination: Point | null
    } = {
        travelDestination: null
    }

    scripts = {
        showUnitAttackRange: new ShowUnitAttackRange(this.gamepad, this.map, this.mapCursor),
        //...
    }
    // ↑ iterate with
    // for (let script of (this.scripts as StringDictionary<ControlScript>)) {
    //     script.update();
    // }
    // Getting that to work may be a teense tricky. I don't know.


    // Brought from Battle Scene — Please refactor
    unitsList: UnitObject[] = [];
    cameraZoomSlider = new Slider({
        track: 'max',
        granularity: 0.1
    });

    constructor(options: BattleSceneOptions) {
        
        // Instantiate
        
        this.gamepad = new VirtualGamepad();

        // Setup Map
        this.map = new Map(25,9);
        this.mapCursor = new MapCursor(this.map, this.gamepad); // TODO A gamepad proxy for whichever is current-player

        // TODO Since MapLayers are dependent on map being initialized, why aren't they properties of it?
        // I think because MapLayers is globally accessible, but that probably isn't necessary; I can link
        // it to units here, which I think are the only 'external' things that need it.
        // Terrain objects need it, but they're in the map, it should be trivial to fix.

        // Setup Camera
        this.camera = new Camera(Game.stage);
        
        let cameraView = new PIXI.Rectangle(0, 0, Game.display.width, Game.display.height);
        (MapLayers['top'] as PIXI.Container).filterArea = cameraView;
        (MapLayers['bottom'] as PIXI.Container).filterArea = cameraView;    // TODO Is this doing anything? It was meant to cull processing on filters, I believe.

        // Setup UI Window System
        // TODO This was a rushed, demo implementation. Clean it up.
        this.uiSystem = new InfoWindowSystem();
        this.uiSystem.gp = this.gamepad;
        this.uiSystem.map = this.map;
        this.uiSystem.cursor = this.mapCursor;
        this.uiSystem.camera = this.camera;
        // this.infoWindow = new InfoWindow(this.map, this.camera, this.gamepad);
        // this.infoWindow.inspectTile(this.cursor.pos);

        // Setup static background image.
        let backdrop = new PIXI.Sprite( Game.scene.resources['background'].texture );
        Game.backdrop.addChild(backdrop);

        // Units demo
        this.spawnRandomUnits();

        // trackCar demo
        this.trackCar = new TrackCar();

        // Apply z-sort correction to scene objects.
        MapLayers['top'].sortChildren();
        MapLayers['ui'].sortChildren();

        // The objective here is to build a complete battle scene given scenario options.
        // Then it is to start the turn engine.
    }

    /** Hides all UI and player-interface systems. */
    hidePlayerSystems() {
        this.mapCursor.hide();
        this.trackCar.hide();
        this.uiSystem.hide();
    }

    /** For demo purposes. Deprecate this. */
    spawnRandomUnits() {
        // Spawn units
        let unitTypes = [Unit.Infantry, Unit.Mech, Unit.Bike, Unit.Tank, Unit.MdTank, Unit.WarTank,
            Unit.Recon, Unit.Rig, Unit.AntiAir, Unit.Flare, Unit.Artillery, Unit.AntiTank, Unit.Rockets,
            Unit.Missiles, Unit.TCopter, Unit.BCopter, Unit.Duster, Unit.Fighter, Unit.Bomber, Unit.Seaplane,
            /*Unit.Stealth, Unit.Seeker,*/ Unit.Lander, Unit.Gunboat, Unit.Cruiser, Unit.Submarine, Unit.Carrier, Unit.Battleship];

        let unitsToSpawn = Math.floor(Math.pow(Math.random(), 2)*25) + 15;

        for (let i = 0; i < unitsToSpawn; i++) {
            let unit = new unitTypes[ Math.floor(Math.random()*unitTypes.length) ]();
            unit.init(null);            // This, I believe, adds graphics to scene. Unit would have to be destroyed on placement fail.
            this.unitsList.push(unit);

            // Easy dice roll function for stats.
            let roll = (n: number) => {
                return Math.round((Math.pow(-Math.pow(Math.random(), 4) + 1, 2)) * n);
            }

            // Random unit status
            unit.hp = roll(100);
            unit.gas = roll(unit.maxGas);
            unit.ammo = Math.round(Math.random() * unit.maxAmmo);

            // Hide the unit in case placement fails (just for this demo)
            unit.visible = false;

            // Randomly place units on the map.
            // There is no rhyme or reason to placement, and there may be many units,
            // so don't bother attempting to place more than a few times.
            for (let i = 0; i < 10; i++) {
                let x = Math.floor(Math.random()*this.map.width);
                let y = Math.floor(Math.random()*this.map.height);

                // If placement is good, do so and reveal the unit.
                if (this.map.squareAt({x:x,y:y}).occupiable(unit) &&
                    this.map.squareAt({x:x,y:y}).terrain.getMovementCost(unit.moveType) != 0) {
                    this.map.placeUnit(unit, {x:x, y:y});
                    unit.visible = true;
                    break;
                }
            }
        }
    }
}

type BattleSceneOptions = {
    mapData: {
        width: number,
        height: number
    }
}