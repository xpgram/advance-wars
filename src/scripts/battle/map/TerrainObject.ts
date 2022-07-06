import { PIXI } from "../../../constants";
import { UnitClass, MoveType, Faction } from "../EnumTypes";
import { NeighborMatrix } from "../../NeighborMatrix";
import { MapLayer, MapLayerFunctions } from "./MapLayers";
import { Point3D } from "../../CommonTypes";
import { TerrainProperties } from "./Terrain";
import { Game } from "../../..";
import { Whitemask } from "../../filters/Whitemask";
import { TextureLibrary } from "../../system/TextureLibrary";
import { UnitObject } from "../UnitObject";
import { TerrainMethods } from "./Terrain.helpers";
import { Debug } from "../../DebugUtils";

/** TODO Implement Efficient Tile Overlays
 * Constructor: build static filters if they do not exist.
 * Constructor: assign single or double-sized filter depending on terrain properties.
 * Constructor: Register uniform update callback to Game ticker if not previously done.
 * Rename whitemask sprite to overlay.
 * Uniform Update Method:
 *   If TextureLibrary does not have a texture:
 *     Render current view to texture.                            \
 *     Build sprite from texture.                                 | Could apply filters directly to current view, render to
 *     Apply [whitemask, tileOverlay] filters to built sprite.    / texture, then unapply.
 *     Render built sprite to new texture.
 *     Register new texture with TextureLibrary.
 *     Assign new texture to overlay sprite object.
 *   Else
 *     Get texture from TextureLibrary.
 *     Assign texture to overlay sprite object.
 *
 * TextureLibraryID format:
 *   '[name]:[orientation]:[tint]' => PIXI.Texture
 *   Could we render a grayscale overlay and tint the resulting texture?
 *   Pixi tints are nearly costless. They might also be within the shader, though.
 */

const DOMAIN = "TerrainObject";

/** An uninstantiated Terrain class. */
export interface TerrainType {
    new (prevTile?: TerrainObject): TerrainObject;
    serial: number;

    // TODO Serial I understand, but this is annoying.
    getWhitemask(key: string): PIXI.Texture;
}

/**
 * An object representing a tile on the game board.
 * Contains gameplay constants and self-managed graphics sets.
 * This abstract class also offers defaults for terrain types to defer to,
 * overriding them only when they differ.
 */
export abstract class TerrainObject {

    /** Textures for each tile whitemask. Note that this resource is never flushed because
     * the battle scene is 90% of this game and I don't really need to worry about memory. */
    protected static whitemasks: TextureLibrary = new TextureLibrary();

    /** Retrieves a whitemask texture for a given key. */
    static getWhitemask(key: string) {
        return TerrainObject.whitemasks.get(key);
    }

    /** True if this object has finished building, i.e. whether init() has been called. */
    protected built = false;

    /** The list of Pixi containers which make up this Terrain's graphical representation and metadata
     * about where they're placed and how they're referenced. */
    protected layers: {object: PIXI.Container, key: string[], maskShape?: boolean}[] = [];

    /** A reference to this terrain's constructing type. Useful for comparisons. */
    abstract get type(): TerrainType;

    /** This terrain type's serial number. */
    static readonly serial: number = -1;

    /** The serial number for this terrain's silhouette shape. */
    get shapeSerial() {
        return this._shapeSerial;
    }
    protected _shapeSerial = '0';

    /** The identifier-key for this terrain's silhoette shape. */
    get shapeId() {
        return (this.shapeSerial !== '0' || this.building)
            ? `${this.type.serial}:${this.shapeSerial}`
            : 'std';
    }

    /** Returns a preview image of this terrain type. Meant for the Info Window class. */
    get preview(): PIXI.Sprite | PIXI.AnimatedSprite {
        let name = this.name.replace(' ', '').toLowerCase();
        let sprite = new PIXI.Sprite(TerrainProperties.sheet.textures[`${name}.png`]);
        return sprite;
    }

    /** Returns an 'establishing shot' image of this terrain type as a sprite. */
    get illustration(): PIXI.Sprite {
        let name = this.name.replace(' ', '').toLowerCase();
        return new PIXI.Sprite( TerrainProperties.infoPortraitSheet.textures[`${name}-landscape.png`] );
    }

    /** Returns an image to represent this tile in the minimap. */
    protected get minimapIconName(): string {
        return this.name.toLowerCase().replace(' ','-');
    }

    getMinimapIcon(): PIXI.Sprite | PIXI.AnimatedSprite {
        const animations = Game.scene.animationsFrom("UISpritesheet");
        const textures = Game.scene.texturesFrom("UISpritesheet");

        const texUrl = `MiniMap/${this.minimapIconName}`;
        const frames = animations[texUrl];
        const tex = textures[`${texUrl}.png`];

        if (!tex && !frames)
            Debug.log(DOMAIN, "MinimapIcon", {
                message: `Could not find a texture or animation for '${texUrl}'`,
                warn: true,
            });

        if (frames) {
            const anim = new PIXI.AnimatedSprite(frames);
            anim.animationSpeed = 1/12;
            anim.play();
            return anim;
        }

        return new PIXI.Sprite(tex);
    }

    /** Whether this terrain is considered land by nature. Important setting for the tile's base-layer
     * texture and the land-sea border system. */
    get landTile(): boolean { return true; }

    /** Whether this terrain represents one of the many building/captureable types. */
    get building(): boolean { return false; }

    /** Whether this terrain maintains a hitpoints stat, and generally is targetable by troops. */
    get damageable(): boolean { return false; }

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

    /** A container for all 8 different movement types and their costs to travel into this terrain type. */
    abstract readonly movementCost: {
        readonly infantry: number,
        readonly mech: number,
        readonly tireA: number,
        readonly tireB: number,
        readonly tread: number,
        readonly air: number,
        readonly ship: number,
        readonly transport: number
    };

    /** Given a movement type, returns how many movement points must be spent to travel into this tile. */
    getMovementCost(moveType: MoveType) {
        let costs = [
            this.movementCost.infantry,
            this.movementCost.mech,
            this.movementCost.tireA,
            this.movementCost.tireB,
            this.movementCost.tread,
            this.movementCost.air,
            this.movementCost.ship,
            this.movementCost.transport
        ]
        return costs[moveType]; // This is obviously dependant on MoveType's order never changing.
    }

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
        this.destroyVisualObjects();    // in case we've already built before
        this.layers = [];

        this.orient(neighbors); // Allows subclasses to populate the layers list.

        const mapLayerRow = MapLayerFunctions.RowLayerFromWorldPosition(pos);   // For MapLayer

        // Build whitemask texture; save to whitemasks library
        this.constructWhiteMask();

        // Add populated layers to display and move them to their in-world position
        this.layers.forEach( layer => {
            const terms = layer.key.map( key => (key === 'row') ? mapLayerRow : key );
            const mapLayer = MapLayer(...terms);
            mapLayer.addChild(layer.object);
            layer.object.position.set(pos.x, pos.y);
        });

        this.built = true;
    }

    destroy() {
        this.destroyVisualObjects();
        // anything else?
    }

    /** Destructs the terrain's visual components. */
    destroyVisualObjects() {
        this.layers.forEach( layer => layer.object.destroy({children: true}) );
    }

    /** Generates a white-mask from the graphical objects in this.layers. */
    private constructWhiteMask(): void {

        const serial = this.shapeId;

        // Check for work already done
        if (TerrainObject.whitemasks.hasId(serial))
            return;

        // Container we'll be taking a quick lil picture of.
        const container = new PIXI.Container();

        // Square base - this step is necessary for sea tiles; they have no sea graphic.
        const tileSize = Game.display.standardLength;
        const base = new PIXI.Graphics();
        base.beginFill(0xFFFFFF);
        base.drawRect(0,tileSize,tileSize,tileSize); // Draw 16x16 at (0,16)
        base.endFill();
        container.addChild(base);

        // Any other shapes
        this.layers.forEach( layer => {
            layer.object.y = tileSize;
            container.addChild(layer.object);
        });

        // White-out colors in shape sprites
        container.filters = [new Whitemask().filter];

        // Texture generation
        const tex = Game.renderer.generateTexture(
            container,
            {
                scaleMode: PIXI.SCALE_MODES.NEAREST,
                // resolution: 1,
                region: new PIXI.Rectangle(0,0,16,32),
            }
        );

        // Save
        TerrainObject.whitemasks.register({id: serial, texture: tex});
    }

    /** Returns a PIXI.Texture for this terrain's overlay panel. */
    getOverlayTexture(key: string) {
        if (Game.textureLibrary.hasId(this.shapeId))
            return Game.textureLibrary.get(this.shapeId);

        const sprite = new PIXI.Sprite();
        sprite.texture = TerrainObject.whitemasks.get(key);
        sprite.filters = [TerrainMethods.spotlightFilter.filter];

        const tex = Game.renderer.generateTexture(  // TODO Use render texture? I guess that was always a workaround.
            sprite,
            {
                scaleMode: PIXI.SCALE_MODES.NEAREST, 
                // resolution: 1,
                region: sprite.getBounds()  // new PIXI.Rectangle(0,0,16,32)
            }
        );

        Game.textureLibrary.register({id: this.shapeId, texture: tex});

        return tex;
    }

    /** Builds the tile's graphical object based on its surrounding set of neighbors. */
    abstract orient(neighbors: NeighborMatrix<TerrainObject>): void;

    /** Returns true if the given set of neighboring tiles agrees with this
     * tile's graphical limitations. */
    legalPlacement(neighbors: NeighborMatrix<TerrainObject>) {
        return true;    // Override if you want to be more specific.
    }

    /** Returns true if the given unit is capable of doing something special with this terrain.
     * This is intended to signal a loud visual acknowledgement of the possible action; simple,
     * rote actions such as property capture not included. */
    actionable(unit: UnitObject): boolean {
        return false;
    }
}
