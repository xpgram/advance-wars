import * as PIXI from "pixi.js";
import { TerrainObject } from "./TerrainObject";
import { Faction } from "./EnumTypes";
import { Debug } from "../DebugUtils";
import { Terrain } from "./Terrain";
import { TerrainMethods } from "./Terrain.helpers";

/**  */
export abstract class TerrainBuildingObject extends TerrainObject {
    // Handle for the building sprite, allows easy color changing.
    protected buildingSprite: PIXI.AnimatedSprite | null = null;

    // Override preview-getting method——match the color currently shown by the tile on the field.
    get preview(): PIXI.Sprite | PIXI.AnimatedSprite {
        let sprite = new PIXI.Sprite(Terrain.sheet.textures[`plain-0.png`]);

        let name = this.name.replace(' ', '').toLowerCase();
        let building = TerrainMethods.getBuildingSprite(name);
        if (this.buildingSprite)
            building.gotoAndStop( this.buildingSprite.currentFrame );
        sprite.addChild( building );

        return sprite;
    }

    // All TerrainBuildingObject's are naturally buildings.
    get building() { return true; }

    // Sets this building's team ownership and color indicator of such.
    private _faction = Faction.Neutral;
    get faction() { return this._faction; }
    set faction(faction: Faction) {
        this._faction = faction;
        
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
}