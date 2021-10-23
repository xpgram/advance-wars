import { MapCursor } from "../map/MapCursor";
import { Map } from "../map/Map";
import { Camera } from "../../Camera";
import { Game } from "../../..";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { InfoWindowSystem } from "../ui-windows/InfoWindowSystem";
import { TrackCar } from "../TrackCar";
import { MapLayer, MapLayerFunctions } from "../map/MapLayers";
import { Unit } from "../Unit";
import { UnitObject } from "../UnitObject";
import { Point } from "../../Common/Point";
import { CameraZoom } from "../control-scripts/cameraZoom";
import { StringDictionary } from "../../CommonTypes";
import { ControlScript } from "../../ControlScript";
import { CommandInstruction } from "./CommandInstruction";
import { MenuWindow } from "../ui-windows/MenuWindow";

import { data as mapData } from '../../../battle-maps/lands-end';
import { BoardPlayer } from "../BoardPlayer";
import { Faction } from "../EnumTypes";


type BattleSceneOptions = {
    // TODO scenario stuff
}

export class BattleSceneControllers {

    gamepad: VirtualGamepad;
    camera: Camera;
    map: Map;
    mapCursor: MapCursor;
    uiSystem: InfoWindowSystem;
    uiMenu: MenuWindow;

    trackCar: TrackCar;

    turnstateCarryover = {
        /** How much gas is expended during travel. */
        travelCost: 0,      // TODO Assuming this value is being used, this should be how; refactor dependent systems.
    }

    /** How much gas is expended during travel. */
    travelCost: number = 0;

    /** A container for an instruction to be given to some location on the game board. */
    instruction: CommandInstruction = {
        place: null,
        path: null,
        action: null,
        which: null,
        focal: null,
        seed: null,
    }

    /** A collection of scripts which, when enabled, control various systems of the battlefield. */
    scripts: {
        cameraZoom: CameraZoom,
        //...
    }

    /** List of players participating in this game. */
    playerEntities: BoardPlayer[] = [];

    constructor(options: BattleSceneOptions) {
        // The objective here is to build a complete battle scene given scenario options.
        // Then it is to start the turn engine.

        /* Instantiate */
        
        this.gamepad = new VirtualGamepad();
        // TODO A gamepad proxy for whicher is current-player. Could it extend VirtualGamepad and simply change its
        // state to whicher one it's currently listening to?

        // Setup Map
        this.map = new Map(mapData);
        this.mapCursor = new MapCursor(this.map, this.gamepad);

        // Setup Players
        for (let i = 0; i < mapData.players; i++) {
            const boardPlayer = new BoardPlayer({
                playerNumber: i,
                faction: [Faction.Red, Faction.Blue, Faction.Yellow, Faction.Black][i],
                officerSerial: -2,
                map: this.map,
                capturePoints: mapData.owners
                    .filter( captures => captures.player === i )
                    .map( captures => new Point(captures.location) ),
                unitSpawns: mapData.predeploy
                    .filter( spawns => spawns.player === i ),
                // powerMeter: gameSettings.startingPowerMeter  // when would I use this? Mid-turn reload, probably.
                // funds: gameSettings.startingFunds,
            });
            this.playerEntities.push(boardPlayer);
        }

        // Setup Camera
        this.camera = new Camera(Game.stage);
        
        let cameraView = new PIXI.Rectangle(0, 0, Game.display.width, Game.display.height);
        MapLayer('top').filterArea = cameraView;
        MapLayer('bottom').filterArea = cameraView;
        // TODO Is filterArea doing anything? It was meant to cull processing on filters, I believe.
        // But, is it ever updated? Does it need to be? I don't know anything.

        // Setup UI Window System
        this.uiSystem = new InfoWindowSystem();
        this.uiSystem.gp = this.gamepad;
        this.uiSystem.map = this.map;
        this.uiSystem.cursor = this.mapCursor;
        this.uiSystem.camera = this.camera;
        // this.infoWindow = new InfoWindow(this.map, this.camera, this.gamepad);
        this.uiSystem.inspectListenerCallback();    // IWS should do this itself in its constructor
        // TODO This was a rushed, demo implementation. Clean it up.

        this.uiMenu = new MenuWindow(this.gamepad, MapLayer('ui'));

        // Setup static background image.
        let backdrop = new PIXI.Sprite( Game.scene.resources['background'].texture );
        Game.backdrop.addChild(backdrop);

        // TODO Units collection method. The only real purpose, I think, is to check if they're all spent/destroyed/etc.

        // TODO This needs to be more formal, or maybe moved into InfoWindowSystem
        let updateUI = () => {
            this.uiSystem.inspectListenerCallback();
        }
        // Initiates uiSystem listener → mapCursor position relationship — implementation is still a bit primitive
        this.mapCursor.addListener(updateUI);
        // TODO InfoWindowSystem desperately needs a refactor

        // TrackCar for faking inter-tile unit movement.
        this.trackCar = new TrackCar();

        // Apply z-sort correction to scene objects.
        MapLayerFunctions.SortLayer('top');
        MapLayer('ui').sortChildren();

        // Setup control scripts
        this.scripts = {
            cameraZoom: new CameraZoom(this.gamepad, this.camera),
        }

        // Add the control script iterator to the ticker.
        Game.scene.ticker.add(this.updateControlScripts, this);
    }

    destroy() {
        Game.scene.ticker.remove(this.updateControlScripts, this);
    }

    /** Hides all UI and player-interface systems. */
    hidePlayerSystems() {
        this.mapCursor.hide();
        this.trackCar.hide();
        this.uiSystem.hide();
        this.uiMenu.hide();

        // Reset all scripts
        let scripts = this.scripts as StringDictionary<ControlScript>;
        for (let name in scripts) {
            let script = scripts[name];
            if (script.defaultEnabled())
                script.enable();
            else
                script.disable();
        }
    }

    /** Empties the command instruction container. */
    resetCommandInstruction() {
        this.instruction = {
            place: null,
            path: null,
            action: null,
            which: null,
            focal: null,
            seed: null,
        }
    }

    /** Iterates through all control scripts and runs their update methods. */
    private updateControlScripts() {
        let scripts = this.scripts as StringDictionary<ControlScript>;
        for (let name in scripts) {
            scripts[name].update();
        }
    }

    /** Returns a list of all UnitObjects on the board from all players. */
    get allInPlayUnits(): UnitObject[] {
        const unitLists = this.playerEntities.map( ple => ple.units);
        if (unitLists)
            return unitLists[0].concat(...unitLists.slice(1));
        return [];
    }

    /** For demo purposes. Deprecate this. */
    spawnRandomUnits() {
        // Since this method is still called, but I've broken the
        // unitsList, we're just gonna gather it from the map here.

        return;

        // Spawn units
        let unitTypes = [Unit.Infantry, Unit.Mech, Unit.Bike, Unit.Tank, Unit.MdTank, Unit.WarTank,
            Unit.Recon, Unit.Rig, Unit.AntiAir, Unit.Flare, Unit.Artillery, Unit.AntiTank, Unit.Rockets,
            Unit.Missiles, Unit.TCopter, Unit.BCopter, Unit.Duster, Unit.Fighter, Unit.Bomber, Unit.SeaPlane,
            /*Unit.Stealth, Unit.Seeker,*/ Unit.Lander, Unit.GunBoat, Unit.Cruiser, Unit.Submarine, Unit.Carrier, Unit.Battleship];

        let unitsToSpawn = Math.floor(Math.pow(Math.random(), 2)*25) + 15;

        for (let i = 0; i < unitsToSpawn; i++) {
            let unit = new unitTypes[ Math.floor(Math.random()*unitTypes.length) ]();
            unit.init();            // This, I believe, adds graphics to scene. Unit would have to be destroyed on placement fail.
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
                let p = new Point(x,y);

                // If placement is good, do so and reveal the unit.
                if (this.map.squareAt(p).occupiable(unit) &&
                    this.map.squareAt(p).terrain.getMovementCost(unit.moveType) != 0) {
                    this.map.placeUnit(unit, p);
                    unit.visible = true;
                    break;
                }
            }
        }

        // TODO Remove, along with this entire function
        this.unitsList.forEach( unit => {
            unit.orderable = true;
        });
    }
}