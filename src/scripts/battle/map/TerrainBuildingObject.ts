import { PIXI } from "../../../constants";
import { TerrainObject } from "./TerrainObject";
import { Faction } from "../EnumTypes";
import { Debug } from "../../DebugUtils";
import { TerrainProperties } from "./Terrain";
import { TerrainMethods } from "./Terrain.helpers";
import { NeighborMatrix } from "../../NeighborMatrix";
import { Point3D } from "../../CommonTypes";
import { UnitObject } from "../UnitObject";

/** // TODO Refactor this class name; this is a building-type terrain object class. */
export abstract class TerrainBuildingObject extends TerrainObject {

    // Handle for the building sprite, allows easy color changing.
    protected buildingSprite: PIXI.AnimatedSprite | null = null;

    // Override preview-getting method——match the color currently shown by the tile on the field.
    get preview(): PIXI.Sprite | PIXI.AnimatedSprite {
        let sprite = new PIXI.Sprite(TerrainProperties.sheet.textures[`plain-0.png`]);

        let name = this.name.replace(' ', '').toLowerCase();
        let building = TerrainMethods.getBuildingSprite(name);
        if (this.buildingSprite)
            building.gotoAndStop( this.buildingSprite.currentFrame );
        sprite.addChild( building );

        return sprite;
    }

    // All TerrainBuildingObject's are naturally buildings.
    get building() { return true; }

    /** Returns a 0–4 index for a building-color frame, given a faction type. */
    protected buildingColorFrameIndex(faction: Faction) {
        const dict: Record<Faction, number> = {
            [Faction.None]: 0,
            [Faction.Neutral]: 0,
            [Faction.Red]: 1,
            [Faction.Blue]: 2,
            [Faction.Yellow]: 3,
            [Faction.Black]: 4,
        }
        return dict[faction];
    }

    // Sets this building's team ownership and color indicator of such.
    private _faction = Faction.Neutral;
    get faction() { return this._faction; }
    set faction(faction: Faction) {
        this._faction = faction;

        if (!this.built)    // Prevents breakage when setting faction/ownership before init()
            return;
        
        Debug.assert(Boolean(this.buildingSprite), `Terrain Object ${this.name} was missing a building sprite to affect on color change.`);

        if (!this.hidden) {
            let frameIdx = this.buildingColorFrameIndex(this._faction);
            if (this.buildingSprite)
                this.buildingSprite.gotoAndStop(frameIdx);
        }
    }

    private _hidden = false;
    /** Whether this building's information is hidden or not. */
    get hidden() { return this._hidden; }
    set hidden(b: boolean) {
        this._hidden = b;
        let color = (this._hidden) ? Faction.Neutral : this.faction;
        let frameIdx = this.buildingColorFrameIndex(color);
        if (this.buildingSprite)
            this.buildingSprite.gotoAndStop(frameIdx);

        Debug.assert(Boolean(this.buildingSprite), `Terrain Object ${this.name} was missing a building sprite to affect on color change.`);
    }

    constructor() {
        super();
    }

    init(neighbors: NeighborMatrix<TerrainObject>, worldPos: Point3D) {
        super.init(neighbors, worldPos);
        this.faction = this._faction;   // Trigger a sprite change.
    }
}