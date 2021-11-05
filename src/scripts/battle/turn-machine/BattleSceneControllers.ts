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
import { BoardPlayer } from "../BoardPlayer";
import { Faction, TerrainTileSet, Weather, AIPlayStyle } from "../EnumTypes";
import { MapData } from "../../../battle-maps/MapData";

import { data as mapLandsEnd } from '../../../battle-maps/lands-end';
import { Slider } from "../../Common/Slider";
import { NextOrderableUnit } from "../control-scripts/nextOrderableUnit";
import { TurnModerator } from "../TurnModerator";
import { ListMenu } from "../../system/ListMenu";
import { ListMenuGUI } from "../../system/ListMenuGUI";
import { defaultUnitSpawnMap, UnitSpawnMap } from "../UnitSpawnMap";

/** Scenario options for constructing the battle scene. */
export type ScenarioOptions = {
    /** Whether tiles will be hidden unless inside the vision range of an allied unit. @default False */
    fogOfWar?: boolean,
    /** Which weather conditions the battle will rage in. Weather has deleterious effects on units. @default Clear */
    weather?: Weather,
    /** Which graphics set to use. I need Snow for Olaf, but otherwise I don't actually care about this one. @default Normal */
    terrainGraphics?: TerrainTileSet,
    /** How many days (turns) the battle will go on for before it is decided by player
     * standing. Set to < 1 for infinite. @default -1 */
    dayLimit?: number,
    /** Funds granted to each player on their first turn. @default 0 */
    startingFunds?: number,
    /** Funds granted per fungible captured property on turn start. @default 1000 */
    incomePerFungible?: number,
    /** AI play style: aggressive, defensive, balanced, etc. @default Balanced */
    // aiPlaystyle?: AIPlayStyle,
    /** Whether units get more powerful/experienced after defeating another unit. @default True */
    rankUp?: boolean,

    /** Whether an HQ tile remains an HQ on capture or becomes a City tile. @default False */
    acquireHqOnCapture?: boolean,
    /** The maximum number of deployed units a player may have on the board. @default 50 */
    unitLimit?: number,
    /** How much HP a unit will restore when starting a turn on a repairing tile. @default 20 */
    repairHp?: number,
}

/** Settings for the game. */
export type Scenario = {
    fogOfWar: boolean,
    weather: Weather,
    terrainGraphics: TerrainTileSet,
    dayLimit: number,
    startingFunds: number,
    incomePerFungible: number,
    // aiPlaystyle: AIPlayStyle,
    rankUp: boolean,

    unitLimit: number,      // TODO Why are there defaults if these aren't optional?
    repairHp: number,
    acquireHqOnCapture: boolean,
    CoUnits: boolean,
    CoPowers: boolean,
    rigsInfiniteGas: boolean,

    spawnMap: UnitSpawnMap[],
}

const Default_Scenario: Scenario = {
    fogOfWar: false,
    weather: Weather.Clear,
    terrainGraphics: TerrainTileSet.Normal,
    dayLimit: -1,
    startingFunds: 0,
    incomePerFungible: 1000,
    // aiPlaystyle: AIPlayStyle.Balanced,
    rankUp: true,

    unitLimit: 50,
    repairHp: 20,
    acquireHqOnCapture: false,
    CoUnits: true,
    CoPowers: true,
    rigsInfiniteGas: true,

    spawnMap: defaultUnitSpawnMap,
}

export class BattleSceneControllers {

    scenario: Scenario;

    gamepad: VirtualGamepad;
    camera: Camera;
    map: Map;
    mapCursor: MapCursor;
    uiSystem: InfoWindowSystem;
    uiMenu: ListMenuGUI<string, number>;

    trackCar: TrackCar;

    /** A container for an instruction to be given to some location on the game board. */
    instruction!: CommandInstruction;

    /** A collection of scripts which, when enabled, control various systems of the battlefield. */
    scripts: {
        cameraZoom: CameraZoom,
        nextOrderableUnit: NextOrderableUnit,
        //...
    }

    // TODO I think I want to extract turn management to a class object.

    /** Keeps track of players, turn order and current turn player. */
    players: TurnModerator;

    constructor(mapdata: MapData, options?: ScenarioOptions) {
        // The objective here is to build a complete battle scene given scenario options.
        // Then it is to start the turn engine.

        this.resetCommandInstruction();

        this.scenario = {...Default_Scenario, ...options};

        /* Instantiate */
        
        this.gamepad = new VirtualGamepad();
        // TODO A gamepad proxy for whicher is current-player. Could it extend VirtualGamepad and simply change its
        // state to whicher one it's currently listening to?

        // Setup Map
        this.map = new Map(mapLandsEnd);
        this.mapCursor = new MapCursor(this.map, this.gamepad);

        // Setup Players
        const playerObjects = [];
        for (let i = 0; i < mapLandsEnd.players; i++) {
            const boardPlayer = new BoardPlayer({
                playerNumber: i,
                faction: [Faction.Red, Faction.Blue, Faction.Yellow, Faction.Black][i],
                officerSerial: -2,
                map: this.map,
                capturePoints: mapLandsEnd.owners
                    .filter( captures => captures.player === i )
                    .map( captures => new Point(captures.location) ),
                unitSpawns: mapLandsEnd.predeploy
                    .filter( spawns => spawns.player === i ),
                // powerMeter: gameSettings.startingPowerMeter  // when would I use this? Mid-turn reload, probably.
                // funds: gameSettings.startingFunds,
            });
            playerObjects.push(boardPlayer);
        }
        this.players = new TurnModerator(playerObjects);

        // Setup Camera
        this.camera = new Camera(Game.stage);
        
        let cameraView = new PIXI.Rectangle(0, 0, Game.display.width, Game.display.height);
        MapLayer('bottom').filterArea = cameraView;
        // filterArea is limiting the range of the shoreline filter applied to bottom.
        // It's also updated after window resize in BattleScene.update()
        // filterArea is not a culling method; all of 'bottom' is drawn before the filter is applied.

        // Setup UI Window System
        this.uiSystem = new InfoWindowSystem({
            gamepad: this.gamepad,
            cursor: this.mapCursor,
            camera: this.camera,
            map: this.map,
            players: this.players,
        });

        // this.uiMenu = new MenuWindow(this.gamepad, MapLayer('ui'));
        const menu = new ListMenu<string, number>(this.gamepad);
        this.uiMenu = new ListMenuGUI(menu, MapLayer('ui'));

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
            nextOrderableUnit: new NextOrderableUnit(this.gamepad, this.map, this.mapCursor, this.players, this.scenario.spawnMap),
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
            drop: [],
        };
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
        const unitLists = this.players.all.map( ple => ple.units);
        if (unitLists)
            return unitLists[0].concat(...unitLists.slice(1));
        return [];
    }
}