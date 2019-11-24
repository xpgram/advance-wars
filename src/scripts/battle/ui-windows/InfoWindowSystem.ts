import { TerrainWindow } from "./TerrainWindow";
import { Game } from "../../..";
import { UnitWindow } from "./UnitWindow";
import { COWindow } from "./COWindow";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { MapCursor } from "../MapCursor";
import { Camera } from "../../Camera";
import { Point } from "../../CommonTypes";
import { Square } from "../Square";
import { Map } from "../Map";
import { Terrain } from "../Terrain";
import { TerrainDetailWindow } from "./TerrainDetailWindow";
import { Slider } from "../../Common/Slider";

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

    lastTileInspected: Point = {x: -1, y: -1};

    commandersSlider = new Slider();

    options: SlidingWindowOptions = {
        width: 88,
        height: 24,
        visualBoundaryWidth: Game.display.renderWidth
    }

    detailedInfo = new TerrainDetailWindow(this.options);
    commanderInfo = new COWindow(this.options, 0);
    commander2Info = new COWindow(this.options, 1);
    commander3Info = new COWindow(this.options, 2);
    commander4Info = new COWindow(this.options, 3);
    unitInfo = new UnitWindow(this.options);
    terrainInfo = new TerrainWindow(this.options);

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
        // TODO Add the slide-in other CO windows
        this.unitInfo.displayContainer.y = 142;
        this.terrainInfo.displayContainer.y = 167;

        // Add independent updater to ticker
        Game.scene.ticker.add(this.update, this);
    }

    update() {
        let show = false;
        let showCOwindows = false;
        let showOnLeft = true;

        if (this.gp.button.leftTrigger.down)
            show = true;
        if (this.gp.button.leftBumper.down)
            showCOwindows = true;
        if (this.cursor.transform.x < (Game.display.renderWidth / 2 + this.camera.x))
            showOnLeft = false;

        this.terrainInfo.showOnLeftSide = showOnLeft;
        this.unitInfo.showOnLeftSide = showOnLeft;
        this.commanderInfo.showOnLeftSide = showOnLeft;
        this.commander2Info.showOnLeftSide = showOnLeft;
        this.commander3Info.showOnLeftSide = showOnLeft;
        this.commander4Info.showOnLeftSide = showOnLeft;
        this.detailedInfo.showOnLeftSide = showOnLeft;

        this.detailedInfo.show = show;

        this.commandersSlider.value += (showCOwindows) ? 0.2 : -0.2;
        this.commander2Info.show = (this.commandersSlider.value > 0);
        this.commander3Info.show = (this.commandersSlider.value > 0.4);
        this.commander4Info.show = (this.commandersSlider.value == 1);

        // Update tile info
        if (this.terrainInfo.refreshable) {
            if (this.cursor.pos.x != this.lastTileInspected.x
                || this.cursor.pos.y != this.lastTileInspected.y) {
                this.lastTileInspected = {x: this.cursor.pos.x, y: this.cursor.pos.y};
                this.inspectTile(this.map.squareAt(this.cursor.pos));
            }
        }
    }

    inspectTile(square: Square) {
        // Terrain Window
        this.terrainInfo.setName(square.terrain.name);
        this.terrainInfo.setThumbnail(square.terrain.preview);
        this.terrainInfo.setDefenseMeter(square.terrain.defenseRating);
        if (square.terrain.building)
            this.terrainInfo.setCaptureMeter('20');
        else if (square.terrain.type == Terrain.Meteor)
            this.terrainInfo.setHPMeter('99');
        else
            this.terrainInfo.hideCaptureMeter();

        // Unit Window
        if (square.unit) {
            this.unitInfo.displayContainer.visible = true;

            this.unitInfo.setThumbnail(square.unit.preview);
            this.unitInfo.setName(square.unit.name);
            this.unitInfo.setHPMeterValue(square.unit.hp.toString());
            this.unitInfo.setGasMeterValue(square.unit.gas.toString());
            this.unitInfo.setAmmoMeterValue(square.unit.ammo.toString());
            // TODO Show a '-' if unit max ammo is 0
            // TODO Show the materials meter instead if the unit is an APC. (Any others?)
            this.unitInfo.setFirstLoadUnit(null);
            this.unitInfo.setSecondLoadUnit(null);
            // this.unitInfo.setFirstLoadUnit(square.unit.loaded.first);
            // this.unitInfo.setSecondLoadUnit(square.unit.loaded.second);
            // TODO loaded.first should return null if no units are loaded.
        }
        else {
            this.unitInfo.displayContainer.visible = (Math.random() < 0.25);

            // TODO Remove
            this.unitInfo.setName('Infantry');
            this.unitInfo.setHPMeterValue('10');
            this.unitInfo.setGasMeterValue('99');
            this.unitInfo.setAmmoMeterValue('-');
            this.unitInfo.setFirstLoadUnit(null);
            this.unitInfo.setSecondLoadUnit(null);
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
        this.detailedInfo.setIncomeValue( (square.terrain.building) ? 1000 : 0 );
        if (square.terrain.type == Terrain.TempAirpt || square.terrain.type == Terrain.TempPort)
            this.detailedInfo.setIncomeValue(0);

        this.detailedInfo.setRepTypeG(false);
        this.detailedInfo.setRepTypeN(false);
        this.detailedInfo.setRepTypeA(false);
        if (square.terrain.type == Terrain.Port || square.terrain.type == Terrain.TempPort)
            this.detailedInfo.setRepTypeN(true);
        else if (square.terrain.type == Terrain.Airport || square.terrain.type == Terrain.TempAirpt)
            this.detailedInfo.setRepTypeA(true);
        else if (square.terrain.building && square.terrain.type != Terrain.Radar && square.terrain.type != Terrain.ComTower)
            this.detailedInfo.setRepTypeG(true);
        
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