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
import { PointPrimitive } from "../../Common/Point";
import { Debug } from "../../DebugUtils";

/** // TODO finish writing this class; I only ever completed the working draft. */
export class InfoWindowSystem {

    // TODO Remove
    //@ts-ignore
    gp: VirtualGamepad;
    //@ts-ignore
    cursor: MapCursor;
    //@ts-ignore
    camera: Camera;
    //@ts-ignore
    map: Map;

    commandersSlider = new Slider();

    alwaysOnOptions: SlidingWindowOptions = {
        width: 88,
        height: 24,
        visualBoundaryWidth: Game.display.renderWidth
    }

    notAlwaysOnOptions: SlidingWindowOptions = {
        width: 88,
        height: 24,
        show: false,
        visualBoundaryWidth: Game.display.renderWidth
    }

    detailedInfo = new TerrainDetailWindow(this.notAlwaysOnOptions);
    commanderInfo = new COWindow(this.alwaysOnOptions, 0);
    commander2Info = new COWindow(this.notAlwaysOnOptions, 1);
    commander3Info = new COWindow(this.notAlwaysOnOptions, 2);
    commander4Info = new COWindow(this.notAlwaysOnOptions, 3);
    unitInfo = new UnitWindow(this.alwaysOnOptions);
    terrainInfo = new TerrainWindow(this.alwaysOnOptions);

    constructor() {
        // Apply mask to screen-wipeable ui elements
        this.unitInfo.displayContainer.mask = this.detailedInfo.mask;
        this.commanderInfo.displayContainer.mask = this.detailedInfo.mask;
        this.commander2Info.displayContainer.mask = this.detailedInfo.mask;
        this.commander3Info.displayContainer.mask = this.detailedInfo.mask;
        this.commander4Info.displayContainer.mask = this.detailedInfo.mask;

        // Position windows (thaaat's right, I didn't use verticalDistance in the options...!)
        this.detailedInfo.displayContainer.y = 1;
        this.commanderInfo.displayContainer.y = 1;
        this.commander2Info.displayContainer.y = 33;
        this.commander3Info.displayContainer.y = 63;
        this.commander4Info.displayContainer.y = 93;
        this.unitInfo.displayContainer.y = 142;
        this.terrainInfo.displayContainer.y = 167;

        // Add independent updater to ticker
        Game.scene.ticker.add(this.update, this);
    }

    /** Hides the window-system's graphics from the screen. */
    hide(): void {
        this.detailedInfo.displayContainer.visible = false;
        this.commanderInfo.displayContainer.visible = false;
        this.commander2Info.displayContainer.visible = false;
        this.commander3Info.displayContainer.visible = false;
        this.commander4Info.displayContainer.visible = false;
        this.unitInfo.displayContainer.visible = false;
        this.terrainInfo.displayContainer.visible = false;
    }

    /** Reveals the window-system's graphics on the screen. */
    show(): void {
        this.detailedInfo.displayContainer.visible = true;
        this.commanderInfo.displayContainer.visible = true;
        this.commander2Info.displayContainer.visible = true;
        this.commander3Info.displayContainer.visible = true;
        this.commander4Info.displayContainer.visible = true;
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
        if (this.gp.button.leftTrigger.down)
            showDetailWindow = true;
        if (this.gp.button.leftBumper.down)
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
        this.commanderInfo.showOnLeftSide = showWindowsOnLeft;
        this.commander2Info.showOnLeftSide = showWindowsOnLeft;
        this.commander3Info.showOnLeftSide = showWindowsOnLeft;
        this.commander4Info.showOnLeftSide = showWindowsOnLeft;
        this.detailedInfo.showOnLeftSide = showWindowsOnLeft;

        // Show the detail window
        this.detailedInfo.show = showDetailWindow;

        // Increment CO Window slider (staggers their reveal)
        this.commandersSlider.track += (showCOwindows) ? 0.2 : -0.2;
        this.commander2Info.show = (this.commandersSlider.output > 0);
        this.commander3Info.show = (this.commandersSlider.output > 0.4);
        this.commander4Info.show = (this.commandersSlider.output == 1);
    }

    /** Calls inspectTile on cursor position change. */
    inspectListenerCallback() {
        Game.workOrders.send( () => {
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

        // CO Window
        this.commanderInfo.setArmyCountValue(5);
        this.commanderInfo.setCityCountValue(4);
        this.commanderInfo.setFundsValue(4000);
        this.commanderInfo.setPowerMeterValue(8);

        this.commander2Info.setArmyCountValue(4);
        this.commander2Info.setCityCountValue(6);
        this.commander2Info.setFundsValue(7500);
        this.commander2Info.setPowerMeterValue(10);

        this.commander3Info.setArmyCountValue(7);
        this.commander3Info.setCityCountValue(5);
        this.commander3Info.setFundsValue(1500);
        this.commander3Info.setPowerMeterValue(2);

        this.commander4Info.setArmyCountValue(8);
        this.commander4Info.setCityCountValue(4);
        this.commander4Info.setFundsValue(500);
        this.commander4Info.setPowerMeterValue(0);

        // Detailed Terrain Window
        this.detailedInfo.setHeaderText(square.terrain.name);
        this.detailedInfo.setIllustration(square.terrain.landscape);
        this.detailedInfo.setDescriptionText(square.terrain.description);
        this.detailedInfo.setIncomeValue( (square.terrain.generatesIncome) ? 1000 : 0 );
        this.detailedInfo.setRepType(
            square.terrain.repairType == UnitClass.Ground,
            square.terrain.repairType == UnitClass.Naval,
            square.terrain.repairType == UnitClass.Air,
        );
        
        this.detailedInfo.setInfantryMoveCost( square.terrain.movementCost.infantry );
        this.detailedInfo.setMechMoveCost( square.terrain.movementCost.mech );
        this.detailedInfo.setTireAMoveCost( square.terrain.movementCost.tireA );
        this.detailedInfo.setTireBMoveCost( square.terrain.movementCost.tireB );
        this.detailedInfo.setTreadMoveCost( square.terrain.movementCost.tread );
        this.detailedInfo.setAirMoveCost( square.terrain.movementCost.air );
        this.detailedInfo.setShipMoveCost( square.terrain.movementCost.ship );
        this.detailedInfo.setTransportMoveCost( square.terrain.movementCost.transport );
        // TODO Why not define MoveCostMatrix as a type and pass that into the window? Let the f*in' window do this.
    }
}