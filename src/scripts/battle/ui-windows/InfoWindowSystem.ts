import { TerrainWindow } from "./TerrainWindow";
import { Game } from "../../..";
import { UnitWindow } from "./UnitWindow";
import { DetailWindow } from "./DetailWindow";
import { COWindow } from "./COWindow";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { MapCursor } from "../MapCursor";
import { Camera } from "../../Camera";
import { Point } from "../../CommonTypes";
import { InfoUI } from "./DisplayInfo";
import { Square } from "../Square";
import { Map } from "../Map";
import { SlidingWindow } from "./SlidingWindow";

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

    options: SlidingWindowOptions = {
        width: 88,
        height: 24,
        visualBoundaryWidth: Game.display.renderWidth
    }

    masterWindow = new SlidingWindow({
        width: 0,
        height: 0,
        visualBoundaryWidth: Game.display.renderWidth,
        show: false
    });

    terrainInfo = new TerrainWindow(this.options);
    unitInfo = new UnitWindow(this.options);
    commanderInfo = new COWindow(this.options);
    detailedInfo = new DetailWindow(this.options);

    constructor() {
        // Apply mask to screen-wipeable ui elements
        this.unitInfo.displayContainer.mask = this.detailedInfo.mask;
        this.commanderInfo.displayContainer.mask = this.detailedInfo.mask;

        // Add independent updater to ticker
        Game.scene.ticker.add(this.update, this);
    }

    update() {
        // The block below needs to be reworked. It doesn't make a lot of sense.

        let show = false;
        let showOnLeft = true;

        if (this.gp.button.leftTrigger.down)
            show = true;
        if (this.cursor.pos.x >= (Game.display.renderWidth + this.camera.pos.x) / Game.display.standardLength)
            showOnLeft = false;

        this.terrainInfo.showOnLeftSide = showOnLeft;
        this.unitInfo.showOnLeftSide = showOnLeft;
        this.commanderInfo.showOnLeftSide = showOnLeft;
        this.detailedInfo.showOnLeftSide = showOnLeft;

        this.detailedInfo.show = show;

        // Update tile info
        if (this.terrainInfo.refreshable) {
            if (this.cursor.pos.x != this.lastTileInspected.x
                && this.cursor.pos.y != this.lastTileInspected.y)
                this.inspectTile(this.map.squareAt(this.cursor.pos));
        }
    }

    inspectTile(square: Square) {
        InfoUI.terrainName = square.terrain.name;
        InfoUI.terrainThumbnail = square.terrain.preview;
        InfoUI.terrainDefenseStarsValue = square.terrain.defenseRating;
        InfoUI.captureMeterValue = '20';
        InfoUI.captureMeterHidden = (square.terrain.building == false);

        InfoUI.articleHeader = square.terrain.name;
        InfoUI.articleBody = square.terrain.description;
        InfoUI.articleIllustration = square.terrain.landscape;
        InfoUI.articleStats.moveCosts.infantry = square.terrain.movementCost.infantry.toString();
        InfoUI.articleStats.moveCosts.mech = square.terrain.movementCost.mech.toString();
        InfoUI.articleStats.moveCosts.tireA = square.terrain.movementCost.tireA.toString();
        InfoUI.articleStats.moveCosts.tireB = square.terrain.movementCost.tireB.toString();
        InfoUI.articleStats.moveCosts.tread = square.terrain.movementCost.tread.toString();
        InfoUI.articleStats.moveCosts.air = square.terrain.movementCost.air.toString();
        InfoUI.articleStats.moveCosts.ship = square.terrain.movementCost.ship.toString();
        InfoUI.articleStats.moveCosts.transport = square.terrain.movementCost.transport.toString();
    }
}