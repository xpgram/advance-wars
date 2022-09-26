import { PIXI } from "../../../constants";
import { Game } from "../../..";
import { Map } from "../map/Map";
import { MapCursor } from "../map/MapCursor";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { ClickableContainer } from "../../controls/MouseInputWrapper";
import { InfoWindowSystem } from "../ui-windows/InfoWindowSystem";
import { TrackCar } from "../TrackCar";
import { MapLayer, MapLayerFunctions } from "../map/MapLayers";
import { UnitObject } from "../UnitObject";
import { Point } from "../../Common/Point";
import { CameraZoom } from "../control-scripts/cameraZoom";
import { ControlScript } from "../../ControlScript";
import { CommandInstruction } from "./CommandInstruction";
import { BoardPlayer } from "../BoardPlayer";
import { Faction, TerrainTileSet, Weather, AiPlayStyle } from "../EnumTypes";
import { MapData } from "../../../battle-maps/MapData";
import { NextOrderableUnit } from "../control-scripts/nextOrderableUnit";
import { TurnModerator } from "../TurnModerator";
import { ListMenu } from "../../system/gui-menu-components/ListMenu";
import { CommandMenuGUI } from "../../system/gui-menu-components/CommandMenuGUI";
import { CommandHelpers } from "./Command.helpers";
import { IconTitle, ShopItemTitle } from "../../system/gui-menu-components/ListMenuTitleTypes";
import { UnitShopMenuGUI } from "../../system/gui-menu-components/UnitShopMenuGUI";
import { BoardEventSchedule } from "../map/tile-effects/BoardEventSchedule";
import { NextTargetableUnit } from "../control-scripts/nextTargetableUnit";
import { ManualMoveCamera } from "../control-scripts/manualMoveCamera";
import { HideUnits } from "../control-scripts/hideUnits";
import { Camera } from "../../camera/Camera";
import { ViewRectBorder } from "../../camera/ViewRectBorder";
import { CameraPositioningMethod } from "../../camera/PositionalAlgorithms";
import { CameraTravelMethod } from "../../camera/TravelAlgorithms";
import { StagePointerInterface } from "../control-scripts/stagePointerInterface";
import { MiniMap } from "../map/MiniMap";
import { Debug } from "../../DebugUtils";
import { MultiplayerService } from "../MultiplayerService";
import { defaultScenario, Scenario } from "./Scenario";


const DOMAIN = "BattleSceneAssetController";

type CommandObject = CommandHelpers.CommandObject;


/** A single-reference-point maintaining instances for all the war game's big asset modules. */
export class BattleSceneControllers {

  scenario: Scenario;

  gamepad: VirtualGamepad;
  stagePointer: ClickableContainer<PIXI.Container>;
  camera: Camera;
  map: Map;
  minimap: MiniMap;
  mapCursor: MapCursor;
  uiSystem: InfoWindowSystem;
  cmdMenu: CommandMenuGUI<CommandObject>;
  shopMenu: UnitShopMenuGUI<number>;
  fieldMenu: CommandMenuGUI<number>;
  boardEvents = new BoardEventSchedule();
  multiplayer = new MultiplayerService();

  trackCar: TrackCar;

  /** A container for an instruction to be given to some location on the game board. */
  instruction = new CommandInstruction();

  /** A collection of scripts which, when enabled, control various systems of the battlefield. */
  scripts: Record<string, ControlScript> & {
    cameraZoom: CameraZoom,
    nextOrderableUnit: NextOrderableUnit,
    nextTargetableUnit: NextTargetableUnit,
    stagePointerInterface: StagePointerInterface,
    manualMoveCamera: ManualMoveCamera,
    hideUnits: HideUnits,
  }

  // TODO I think I want to extract turn management to a class object.

  /** Keeps track of players, turn order and current turn player. */
  players: TurnModerator;

  constructor(mapdata: MapData, options?: Partial<Scenario>) {
    // The objective here is to build a complete battle scene given scenario options.
    // Then it is to start the turn engine.

    const tileSize = Game.display.standardLength;

    this.scenario = { ...defaultScenario, ...options };

    /* Instantiate */

    this.gamepad = new VirtualGamepad();
    // TODO A gamepad proxy for whicher is current-player. Could it extend VirtualGamepad and simply change its
    // state to whicher one it's currently listening to?

    // Setup Map
    this.map = new Map(mapdata);
    this.mapCursor = new MapCursor(this.map, this.gamepad);

    // Setup online connection
    if (this.scenario.remoteMultiplayerMatch)
      this.multiplayer.joinGame(this.map.name);

    // Setup Players
    const playerObjects = [];
    for (let i = 0; i < mapdata.players; i++) {

      const capturePoints = mapdata.owners
        .filter(capture => capture.player === i)
        .map(capture => new Point(capture.location));

      const unitSpawns = mapdata.predeploy?.filter(spawns => spawns.player === i);

      const boardPlayer = new BoardPlayer({
        playerNumber: i,
        faction: [Faction.Red, Faction.Blue, Faction.Yellow, Faction.Black][i],
        officerSerial: i+1,   // TODO Set CO serial
        map: this.map,
        scenario: this.scenario,
        capturePoints,
        unitSpawns,
        // powerMeter: gameSettings.startingPowerMeter  // when would I use this? Mid-turn reload, probably.
        // funds: gameSettings.startingFunds,
      });
      playerObjects.push(boardPlayer);
    }
    this.players = new TurnModerator(playerObjects, this.multiplayer);

    // Position MapCursor on board / prepare starting camera position
    const cursorStartLoc = this.players.current.lastCursorPosition;
    this.mapCursor.teleportTo(cursorStartLoc);

    // Setup Camera
    this.camera = new Camera(Game.scene.visualLayers.stage);
    this.camera.transform.border = new ViewRectBorder({
      left: tileSize*2.5,
      right: tileSize*3.5,
      top: tileSize*2,
      bottom: tileSize*3,
    });
    // Start camera in map center
    const camDimensions = this.camera.transform.worldRect();
    this.camera.transform.position.set(
      (this.map.width * tileSize - camDimensions.width)/2,
      (this.map.height * tileSize - camDimensions.height)/2,
    );
    this.camera.teleportToDestination();
    // Setup focal and follow
    this.camera.focalTarget = this.mapCursor.transform;
    this.camera.algorithms = {
      destination: CameraPositioningMethod.ScreenPush,
      travel: CameraTravelMethod.Linear,
    };

    let cameraView = new PIXI.Rectangle(0, 0, Game.display.width, Game.display.height);
    MapLayer('bottom').filterArea = cameraView;
    // filterArea is limiting the range of the shoreline filter applied to bottom.
    // It's also updated after window resize in BattleScene.update()
    // filterArea is not a culling method; all of 'bottom' is drawn before the filter is applied.

    // Setup Minimap for game board
    this.minimap = new MiniMap(this.map, this.camera);
    this.minimap.container.position.set(
      Game.display.renderWidth/2 - this.minimap.mapWidth/2,
      Game.display.renderHeight/2 - this.minimap.mapHeight/2,
    );
    Game.scene.visualLayers.hud.addChild(this.minimap.container);

    // TODO Factor out behavioral dependencies from PointerController to here.
    //      I forget what this means, but general decoupling, you know.
    // TODO Add concise syncing with mapCursor behavior: when mapCursor stops listening to dpad
    //      events, pointer events shouldn't work either.
    this.stagePointer = new ClickableContainer(Game.scene.visualLayers.stage);
    this.stagePointer.enabled = true; // TODO Give to inter-state reset?

    // Setup UI Window System
    this.uiSystem = new InfoWindowSystem({
      gamepad: this.gamepad,
      cursor: this.mapCursor,
      camera: this.camera,
      map: this.map,
      players: this.players,
    });

    // Setup menu window systems
    const menuCmd = new ListMenu<IconTitle, CommandObject>(this.gamepad);
    this.cmdMenu = new CommandMenuGUI(menuCmd, MapLayer('ui'));
    const menuShop = new ListMenu<ShopItemTitle, number>(this.gamepad, {pageLength: 7});
    this.shopMenu = new UnitShopMenuGUI(menuShop, Game.scene.visualLayers.hud);
    const menuField = new ListMenu<IconTitle, number>(this.gamepad);
    this.fieldMenu = new CommandMenuGUI<number>(menuField, Game.scene.visualLayers.hud);

    // Setup static background image.
    let backdrop = new PIXI.Sprite(Game.scene.resources['background'].texture);
    Game.scene.visualLayers.backdrop.addChild(backdrop);

    // TODO This needs to be more formal, or maybe moved into InfoWindowSystem
    let updateUI = () => {
      this.uiSystem.inspectListenerCallback();
    }
    // Initiates uiSystem listener → mapCursor position relationship — implementation is still a bit primitive
    this.mapCursor.on('move', updateUI);
    // TODO InfoWindowSystem desperately needs a refactor

    // TrackCar for faking inter-tile unit movement.
    this.trackCar = new TrackCar();

    // Apply z-sort correction to scene objects.
    MapLayerFunctions.SortLayer('top');
    MapLayer('ui').sortChildren();

    // Setup control scripts
    // TODO Above: scripts = {cameraZoom: CameraZoom} (ScriptType); Here: this.scripts.map( s => new s(this) );
    this.scripts = {
      cameraZoom: new CameraZoom(this),
      nextOrderableUnit: new NextOrderableUnit(this),
      nextTargetableUnit: new NextTargetableUnit(this),
      stagePointerInterface: new StagePointerInterface(this),
      manualMoveCamera: new ManualMoveCamera(this),
      hideUnits: new HideUnits(this),
    }

    // Add the control script iterator to the ticker.
    Game.scene.ticker.add(this.updateControlScripts, this);

    // Set all assets to default
    this.hidePlayerSystems();
  }

  destroy() {
    const PROCESS = "Destruction";
    Game.scene.ticker.remove(this.updateControlScripts, this);

    type Destroyable = {destroy: () => void};
    const hasDestroyFunc = (o: any): o is Destroyable => {
      return (typeof o === 'object' && o.destroy !== undefined);
    }

    // IMPORTANT: This procedure cannot detect second-level objects (such as `this.scripts.someScript.destroy()`)
    Object.entries(this).forEach( ([key, prop]) => {
      if (hasDestroyFunc(prop)) {
        Debug.log(DOMAIN, PROCESS, { message: `Requesting destroy for '${key}'...` });
        prop.destroy();
      }
    });

    Debug.log(DOMAIN, PROCESS, { message: `Destroying control scripts...` });
    Object.values(this.scripts).forEach( scr => scr.destroy() );

    Debug.log(DOMAIN, PROCESS, { message: "Finished destroying assets." });
  }

  /** Hides all UI and player-interface systems. */
  hidePlayerSystems() {
    this.minimap.hide();
    this.mapCursor.resetSettings();
    this.mapCursor.hide();
    this.trackCar.hide();
    this.uiSystem.resetSettings();
    this.uiSystem.hide();
    this.uiSystem.battleForecast = undefined;
    this.cmdMenu.hide();
    this.shopMenu.hide();
    this.fieldMenu.hide();

    // Reset all scripts
    const scripts = this.scripts as Record<string, ControlScript>;
    for (const name in scripts) {
      const script = scripts[name];
      if (script.defaultEnabled())
        script.enable();
      else
        script.disable();
    }

    // Reset the camera to a set of default properties.
    // Note that not all properties are considered here (e.g. the zoom level).
    this.camera.focalTarget = this.mapCursor;
    this.camera.algorithms.destination = CameraPositioningMethod.ScreenPush;
    this.camera.algorithms.travel = CameraTravelMethod.Linear;
    this.camera.algorithms.displacement = undefined;
    // this.camera.algorithms.destinationCorrection ..?
    // this.camera.algorithms.focalCorrection ..?
  }

  /** Iterates through all control scripts and runs their update methods. */
  private updateControlScripts() {
    for (const name in this.scripts) {
      this.scripts[name].update();
    }
  }

  /** Returns a list of all UnitObjects on the board from all players. */
  get allInPlayUnits(): UnitObject[] {
    const unitLists = this.players.all.map(ple => ple.units);
    if (unitLists)
      return unitLists[0].concat(...unitLists.slice(1));
    return [];
  }
}