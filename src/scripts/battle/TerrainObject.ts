import { LowResTransform } from "../LowResTransform";
import { UnitClass, MoveType, Faction } from "./EnumTypes";
import { NeighborMatrix } from "../NeighborMatrix";
import { MapLayers } from "./MapLayers";
import { TransformableList } from "../TransformableList";

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
    abstract readonly type: TerrainType;

    /** This terrain's numerical serialization. */
    abstract readonly serial: number;

    /** Whether this terrain is considered land. Generally, this determines the tile's base-layer texture. */
    get landTile(): boolean { return true; }

    /** Whether this tile is naturally shallow sea. Relevant to sea tiles only. */
    get shallowWaterSourceTile(): boolean { return true; }

    /** Whether this non-landTile, non-sourceTile is shallow or deep sea. Configured by the map system.
     * Should only be overridden if both landTile and shallowWaterSourceTile are false. */
    get shallowWater(): boolean { return true; }

    /** This terrain's long-form name. */
    abstract readonly name: string;

    /** This terrain's short-form name. */
    abstract readonly shortName: string;

    /** This terrain's compendium description. */
    abstract readonly description: string;

    /** This terrain's level of defense-boost. 0–4 */
    abstract readonly defenseRating: number;

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

    /** Initializes the object, builds graphical objects, adds them to the appropriate
     * layers, and sets up the object's transform. */
    init(transform?: LowResTransform) {
        this.layers = [];
        this.create();      // Allows subclasses to populate the layers list.

        // Add populated layers to display and this.transform
        let graphicsObjects: TransformableList = new TransformableList();
        this.layers.forEach( layer => {
            MapLayers[layer.name].addChild(layer.object);
            graphicsObjects.push(layer.object);
        });

        // 'Move' the object set to the desired location, as passed in by transform,
        // but do not keep it; mapset tiles will never move after being placed, it's
        // a waste of memory.
        if (transform)
            TerrainObject.transform.copyFrom(transform);      // Assign
        else
            TerrainObject.transform.pos3D = {x:0,y:0,z:0};    // Or reset

        TerrainObject.transform.object = graphicsObjects;     // Assign ('move')
        TerrainObject.transform.object = null;                // Then forget
    }

    /** Instructs the object to disassociate all materials, readying itself for
     * garbage collection. */
    destroy() {
        this.layers.forEach( layer => {
            MapLayers[layer.name].removeChild(layer.object);
            layer.object.destroy(); // .destroy({children: true, texture: true})
        });
        // Find out if pixi.loader stores generated spritesheet textures anywhere;
        // I should be using those, if so.
        // Otherwise, TODO: Load textures for common tiles somewhere, use as necessary,
        // and do not destroy textures on Container.destroy()
    }

    /** Instantiates all the terrain object's supporting constructs.
     * Must be implemented. */
    abstract create(): void;

    /** Instructs the object to pick textures for itself that agree with its
     * surrounding terrain. */
    orientSelf(neighbors: NeighborMatrix<TerrainObject>) {
        return;         // Override if you want to be more specific.
    }

    /** Returns true if the given configuration of neighbor tiles agrees with this
     * tile's graphical limitations. */
    legalPlacement(neighbors: NeighborMatrix<TerrainObject>) {
        return true;    // Override if you want to be more specific.
    };
}