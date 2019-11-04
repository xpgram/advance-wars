import * as PIXI from "pixi.js";
import { LowResTransform } from "../LowResTransform";
import { UnitClass, MoveType, Faction } from "./EnumTypes";
import { NeighborMatrix } from "../NeighborMatrix";
import { MapLayers } from "./MapLayers";
import { TransformableList } from "../TransformableList";
import { Point, Point3D } from "../CommonTypes";
import { Terrain } from "./Terrain";
import { TerrainMethods } from "./Terrain.helpers";

/** An uninstantiated Terrain class. */
export interface TerrainType {
    new (prevTile?: TerrainObject): TerrainObject;
}

/**
 * An object representing a tile on the game board.
 * Contains gameplay constants and self-managed graphics sets.
 * This abstract class also offers defaults for terrain types to defer to,
 * overriding them only when they differ.
 */
export abstract class TerrainObject {
    protected static transform: LowResTransform = new LowResTransform();
    protected layers: {object: PIXI.Container, name: string}[] = [];

    /** A reference to this terrain's constructing type. Useful for comparisons. */
    abstract get type(): TerrainType;

    /** This terrain's numerical serialization. */
    abstract get serial(): number;

    /** Returns a preview image of this terrain type. Meant for the Info Window class. */
    get preview(): PIXI.Sprite {
        let name = this.name.replace(' ', '').toLowerCase();
        let sprite;
        
        if (this.building) {
            sprite = new PIXI.Sprite(Terrain.sheet.textures['plain-0.png']);
            sprite.addChild( TerrainMethods.getBuildingSprite(name, this.faction) );
        } else {
            sprite = new PIXI.Sprite(Terrain.sheet.textures[`${name}.png`]);
        }

        return sprite;
    }

    /** Whether this terrain is considered land by nature. Important setting for the tile's base-layer
     * texture and the land-sea border system. */
    get landTile(): boolean { return true; }

    /** Whether this terrain represents one of the many building/captureable types. */
    get building(): boolean { return false; }

    /** Whether this tile is naturally shallow sea. Relevant to sea tiles only. */
    get shallowWaterSourceTile(): boolean { return true; }

    /** Whether this non-landTile, non-sourceTile is shallow or deep sea. Configured by the map system.
     * Should only be overridden if both landTile and shallowWaterSourceTile are false. */
    get shallowWater(): boolean { return true; }
    set shallowWater(b) { }

    /** This terrain's long-form name. */
    abstract get name(): string;

    /** This terrain's short-form name. */
    abstract get shortName(): string;

    /** This terrain's compendium description. */
    abstract get description(): string;

    /** This terrain's level of defense-boost. 0–4 */
    abstract get defenseRating(): number;

    /** Whether this terrain generates income for its owner. Relevant to buildings only. */
    get generatesIncome(): boolean { return false; }

    /** Which kind, if any, of unit this terrain will repair on turn start. */
    get repairType(): UnitClass { return UnitClass.None; }

    /** Whether this terrain hides units (non-aerial) during Fog of War. */
    get conceals(): boolean { return false; }

    /** How far into Fog of War conditions this terrain can 'see'. Relevant to buildings and Fire Pillars. */
    get vision(): number { return 0; }

    /** Given a movement type, how many movement points must be spent to travel into this tile. */
    abstract movementCost(type: MoveType): number;

    /** Which faction has ownership of this terrain. Relevant to buildings only. */
    get faction(): Faction { return Faction.None; }
    set faction(f) { }

    /** Used as personal storage for any properties not explicitly defined. */
    get value(): number { return 0; }
    set value(n) { }

    // Left blank so that map can create an accessor to the above constants without starting
    // the arduous process of building a graphical object.
    constructor() { }

    /** Builds graphical sub-objects and sets up the object's transform. */
    init(neighbors: NeighborMatrix<TerrainObject>, pos: Point3D) {
        this.layers = [];
        this.orient(neighbors); // Allows subclasses to populate the layers list.

        // Add populated layers to display and this.transform
        let graphicsObjects: TransformableList = new TransformableList();
        this.layers.forEach( layer => {
            graphicsObjects.push(layer.object);
            MapLayers[layer.name].addChild(layer.object);
        });

        // Use TerrainObject's single-instance LowResTransform
        // to auto-move the graphical set into position.
        TerrainObject.transform.pos3D = pos;
        TerrainObject.transform.object = graphicsObjects;
        TerrainObject.transform.object = null;
    }

    /** Instructs the object to disassociate all materials, readying itself for
     * garbage collection. */
    destroy() {
        this.layers.forEach( layer => {
            MapLayers[layer.name].removeChild(layer.object);
            layer.object.destroy({children: true}); // .destroy({children: true, texture: true})
        });
        // Find out if pixi.loader stores generated spritesheet textures anywhere;
        // I should be using those, if so.
        // Otherwise, TODO: Load textures for common tiles somewhere, use as necessary,
        // and do not destroy textures on Container.destroy()
    }

    /** Builds the tile's graphical object based on its surrounding set of neighbors. */
    abstract orient(neighbors: NeighborMatrix<TerrainObject>): void;

    /** Returns true if the given set of neighboring tiles agrees with this
     * tile's graphical limitations. */
    legalPlacement(neighbors: NeighborMatrix<TerrainObject>) {
        return true;    // Override if you want to be more specific.
    }
}