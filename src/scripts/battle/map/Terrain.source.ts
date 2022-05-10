import { PIXI } from "../../../constants";
import { Game } from "../../..";
import { TerrainObject } from "./TerrainObject";
import { UnitClass, Faction, MoveType } from "../EnumTypes";
import { Common } from "../../CommonUtils";
import { TerrainMethods } from "./Terrain.helpers";
import { NeighborMatrix } from "../../NeighborMatrix";

/**
 * Auto-generated.
 * A list of all terrain or map-tile classes.
 */
export const Terrain = {
    tileset: 'NormalMapTilesheet',
    get sheet(): PIXI.Spritesheet { return Game.loader.resources[ Terrain.tileset ].spritesheet; },

    Void: class VoidTile extends TerrainObject {
        // Not for nothin', but these properties are all technically condensible into one 64-bit value.
        get type() { return VoidTile; }
        get serial() { return -1; }
        get landTile() { return false; }
        get shallowWaterSourceTile() { return false; }
        shallowWater = false;

        get name() { return "Void"; }
        get shortName() { return "Void"; }
        get description() { return "Void"; }
        get defenseRating() { return 0; }

        movementCost(type: MoveType) {
            let costs = [0,0,0,0,0,0,0,0];
            return costs[type];
        }

        constructor(prevTile?: TerrainObject) {
            super();
        }

        orient(neighbors: NeighborMatrix<TerrainObject>) {
        }
    },

    //start
    //end
}