import { TerrainWindow } from "./TerrainWindow";
import { Game } from "../../..";
import { UnitWindow } from "./UnitWindow";
import { COWindow } from "./COWindow";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { MapCursor } from "../map/MapCursor";
import { Camera } from "../../Camera";
import { Square } from "../map/Square";
import { Map } from "../map/Map";
import { Terrain } from "../map/Terrain";
import { TerrainDetailWindow } from "./TerrainDetailWindow";
import { Slider } from "../../Common/Slider";
import { UnitClass } from "../EnumTypes";
import { StringDictionary } from "../../CommonTypes";
import { TurnModerator } from "../TurnModerator";

type InfoWindowSystemSettings = {
  gamepad: VirtualGamepad,
  cursor: MapCursor,
  camera: Camera,
  map: Map,
  players: TurnModerator,
}

/** // TODO finish writing this class; I only ever completed the working draft. */
export class InfoWindowSystem {

  private readonly WindowSettings: StringDictionary<SlidingWindowOptions> = {
    AlwaysShow: {
      width: 88,
      height: 24,
      visualBoundaryWidth: Game.display.renderWidth,
    },
    DefaultHide: {
      width: 88,
      height: 24,
      show: false,
      visualBoundaryWidth: Game.display.renderWidth,
    },
    DrawerHide: {
      width: 88,
      height: 24,
      show: false,
      stickOutDistance: 2,  // Kind of distracting, actually. I may wwant to just leave a button tab beneath the first one.
      visualBoundaryWidth: Game.display.renderWidth,
    }
  }

  gamepad: VirtualGamepad;
  cursor: MapCursor;
  camera: Camera;
  map: Map;
  players: TurnModerator;

  commandersSlider = new Slider();

  detailedInfo = new TerrainDetailWindow(this.WindowSettings.DefaultHide);
  unitInfo = new UnitWindow(this.WindowSettings.AlwaysShow);
  terrainInfo = new TerrainWindow(this.WindowSettings.AlwaysShow);

  commanderWindowsNatural: COWindow[] = [];
  commanderWindows: COWindow[] = [];

  constructor(settings: InfoWindowSystemSettings) {
    this.gamepad = settings.gamepad;
    this.cursor = settings.cursor;
    this.camera = settings.camera;
    this.map = settings.map;
    this.players = settings.players;
    this.players.all.forEach( (player, idx) => {
      const window = new COWindow(this.WindowSettings.DrawerHide, player, idx);
      this.commanderWindowsNatural.push(window);
    });
    this.commanderWindows = this.commanderWindowsNatural;

    // Apply mask to screen-wipeable ui elements
    this.unitInfo.displayContainer.mask = this.detailedInfo.mask;
    this.commanderWindows.forEach(commanderInfo => {
      commanderInfo.displayContainer.mask = this.detailedInfo.mask;
    });

    // TODO Position windows (thaaat's right, I didn't use verticalDistance in the options...!)
    this.detailedInfo.displayContainer.y = 1;
    this.unitInfo.displayContainer.y = 142;
    this.terrainInfo.displayContainer.y = 167;
    this.updatePlayerWindowOrder();

    // Add independent updater to ticker
    Game.scene.ticker.add(this.update, this);

    this.inspectListenerCallback();
  }

  // TODO hide() and show() are the same function but one word.

  /** Hides the window-system's graphics from the screen. */
  hide(): void {
    this.detailedInfo.displayContainer.visible = false;
    this.commanderWindows.forEach(commanderInfo => {
      commanderInfo.displayContainer.visible = false;
    });
    this.unitInfo.displayContainer.visible = false;
    this.terrainInfo.displayContainer.visible = false;
  }

  /** Reveals the window-system's graphics on the screen. */
  show(): void {
    this.detailedInfo.displayContainer.visible = true;
    this.commanderWindows.forEach(commanderInfo => {
      commanderInfo.displayContainer.visible = true;
    });
    this.unitInfo.displayContainer.visible = Boolean(this.map.squareAt(this.cursor.pos).unit);
    this.terrainInfo.displayContainer.visible = true;

    // TODO I didn't even know I'd done that. UnitInfo should *not* be visible *every time* the
    // ui system is shown.
    // Geez, this class sucks...
  }

  update() {
    let showDetailWindow = false;
    let showCOwindows = false;
    let showWindowsOnLeft = true;

    // Set flags
    if (this.gamepad.button.leftTrigger.down)
      showDetailWindow = true;
    if (this.gamepad.button.leftBumper.down)
      showCOwindows = true;

    // Set the window side flag — This block displaces the
    // trigger lines depending on which side the windows are already on.
    let tileSize = Game.display.standardLength;
    let triggerLine = Math.floor(this.camera.center.x / tileSize);
    triggerLine += (this.terrainInfo.showOnLeftSide) ? -3 : 2;
    showWindowsOnLeft = (this.cursor.pos.x > triggerLine);

    // Tell each window which side to be on.
    this.terrainInfo.showOnLeftSide = showWindowsOnLeft;
    this.unitInfo.showOnLeftSide = showWindowsOnLeft;
    this.commanderWindows.forEach(commanderInfo => {
      commanderInfo.showOnLeftSide = showWindowsOnLeft;
    });
    this.detailedInfo.showOnLeftSide = showWindowsOnLeft;

    // Show the detail window
    this.detailedInfo.show = showDetailWindow;

    // Increment CO Window slider (staggers their reveal)
    this.commandersSlider.track += (showCOwindows) ? 0.2 : -0.2;
    this.commanderWindows.forEach((commanderInfo, idx) => {
      const triggerValues = [0.00, 0.10, 0.45, 1.0];
      commanderInfo.show = (this.commandersSlider.output >= triggerValues[idx])
    })
  }

  /** Calls inspectTile on cursor position change. */
  inspectListenerCallback() {
    Game.workOrders.send(() => {
      if (this.terrainInfo.refreshable) {
        this.inspectTile(this.map.squareAt(this.cursor.pos));
        return true;
      }
    }, this);
  }

  inspectTile(square: Square) {
    // Terrain Window
    this.terrainInfo.setName(square.terrain.name);
    this.terrainInfo.setThumbnail(square.terrain.preview);
    this.terrainInfo.setDefenseMeter(square.terrain.defenseRating);
    if (square.terrain.building)
      this.terrainInfo.setCaptureMeter(20);
    else if (square.terrain.type == Terrain.Meteor)
      this.terrainInfo.setHPMeter(99);
    else
      this.terrainInfo.hideCaptureMeter();

    // Unit Window
    if (square.unit) {
      this.unitInfo.displayContainer.visible = true;

      this.unitInfo.setThumbnail(square.unit.preview);
      this.unitInfo.setName(square.unit.name);
      this.unitInfo.setHPMeterValue(square.unit.displayHP);
      this.unitInfo.setGasMeterValue(square.unit.gas);
      if (square.unit.materialsInsteadOfAmmo)
        this.unitInfo.setMaterialMeterValue(square.unit.ammo);
      else
        this.unitInfo.setAmmoMeterValue(square.unit.ammo, square.unit.maxAmmo);
      // TODO Show the materials meter instead if the unit is an APC. (Any others?)
      this.unitInfo.setFirstLoadUnit(null);
      this.unitInfo.setSecondLoadUnit(null);
      // this.unitInfo.setFirstLoadUnit(square.unit.loaded.first);
      // this.unitInfo.setSecondLoadUnit(square.unit.loaded.second);
      // TODO loaded.first should return null if no units are loaded.
    }
    else {
      this.unitInfo.displayContainer.visible = false;
    }

    // Detailed Terrain Window
    this.detailedInfo.setHeaderText(square.terrain.name);
    this.detailedInfo.setIllustration(square.terrain.landscape);
    this.detailedInfo.setDescriptionText(square.terrain.description);
    this.detailedInfo.setIncomeValue((square.terrain.generatesIncome) ? 1000 : 0);
    this.detailedInfo.setRepType(
      square.terrain.repairType == UnitClass.Ground,
      square.terrain.repairType == UnitClass.Naval,
      square.terrain.repairType == UnitClass.Air,
    );

    this.detailedInfo.setInfantryMoveCost(square.terrain.movementCost.infantry);
    this.detailedInfo.setMechMoveCost(square.terrain.movementCost.mech);
    this.detailedInfo.setTireAMoveCost(square.terrain.movementCost.tireA);
    this.detailedInfo.setTireBMoveCost(square.terrain.movementCost.tireB);
    this.detailedInfo.setTreadMoveCost(square.terrain.movementCost.tread);
    this.detailedInfo.setAirMoveCost(square.terrain.movementCost.air);
    this.detailedInfo.setShipMoveCost(square.terrain.movementCost.ship);
    this.detailedInfo.setTransportMoveCost(square.terrain.movementCost.transport);
    // TODO Why not define MoveCostMatrix as a type and pass that into the window? Let the f*in' window do this.
  }

  /** Updates player info window metrics. */
  inspectPlayers() {
    this.commanderWindows.forEach(commanderInfo => {
      commanderInfo.inspectKnownPlayer();
    });
  }

  /** Updates player info window order. */
  updatePlayerWindowOrder() {
    // Reorder player windows.
    const curIdx = this.players.all.findIndex( player => player === this.players.current );
    this.commanderWindows = [
      ...this.commanderWindowsNatural.slice(curIdx),
      ...this.commanderWindowsNatural.slice(0, curIdx),
    ];

    // Set window positions
    this.commanderWindows.forEach( (window, idx) => {
      const yPos = (idx === 0) ? 1 : 33 + 30*(idx - 1);
      window.displayContainer.y = yPos;
    });
  }

  /**  */
  skipAnimations() {
    // TODO This format
    // this.windows.forEach( window => window.skipSlideAnimation() );

    // Actually, the above is so *mwah* that, like, I don't even want to
    // bother writing this write now.
  }
}