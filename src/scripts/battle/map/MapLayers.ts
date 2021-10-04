import { Game } from "../../..";
import { Debug } from "../../DebugUtils";
import { StringDictionary } from "../../CommonTypes";

/** TODO Everything is Broken T_T
 * The Freeze method uses renderer.generateTexture() to take a snapshot
 * of the current container object. This causes a kind of doubling up effect for
 * some reason. The original objects are likely, somehow, not being removed
 * between different snapshot calls.
 *
 * This really shouldn't be happening, but the problem could possibly be
 * circumvented entirely by using cacheAsBitmap instead; I wouldn't need to
 * remove anything if built this way, but I would still eliminate the unnecessary
 * object re-rendering.
 *
 * In any case, big rewrite. Maybe.
 * I haven't looked at this code in a good, long while, so we'll see.
 */

type MapLayerIndex = {
    [key: string]: MapLayerContainer;
}

/** Global index of all graphics layers of the map system. */
const layerIndex: MapLayerIndex = {};

type MapLayerOptions = {
    key: string,
    partitionStyle?: 'none' | 'row',  // 'col'
    freezable?: boolean,
    children?: MapLayerOptions[],
}

/** This object defines the map layer structure. */
const layers_config: MapLayerOptions[] = [
    {key: 'sea'},
    {key: 'bottom', freezable: true},
    {key: 'top', partitionStyle: 'row', children: [
        {key: 'static', freezable: true},
        {key: 'animated'},
        {key: 'glass-tile'},
        {key: 'unit'},
    ]},
    {key: 'cloud-shadow'},
    {key: 'ui'},
];

/** 
 * Globally accessible method for retrieving graphics layers from the map system.
 * Must be initialized before use. Use MapLayerFunctions.Init() to initialize.
 * 
 * @author Dei Valko
 * @version 1.0.0
 */
export function MapLayer(...layerName: string[]): MapLayerContainer {
    const reference = layerName.join(',');
    if (!layerIndex[reference])
        throw new ReferenceError(`Layer '${layerName}' does not exist in MapLayer.`);
    return layerIndex[reference];
}

/** 
 * Functions for the management of the game-layers container.
 * 
 * @author Dei Valko
 * @version 1.0.0
 */
 export const MapLayerFunctions = {

    destroyed: true,

    /** Initializes the MapLayers container for use. 
     * Graphics containers will not be functional before calling this method. */
    Init() {
        if (!this.destroyed)
            return;

        // This recursive function builds these structures:
        // 'top': layer                 Game.stage.children = [ top ]
        // 'top,static': layer          top.children = [ static, animated ]
        // 'top,animated': layer        static.children = []
        function buildFromConfig(config: MapLayerOptions[], parent: PIXI.Container, parentKey?: string): void {
            config.forEach( settings => {
                const layer = new MapLayerContainer(settings);
                const key = [parentKey, settings.key].filter(s => s !== undefined).join(',');
                parent.addChild(layer);
                layerIndex[key] = layer;

                if (settings.children) {
                    buildFromConfig(settings.children, layer, key);
                    layer.prePartitionLayers = layer.children.slice() as MapLayerContainer[];
                }
            });
        }

        buildFromConfig(layers_config, Game.stage);
        this.destroyed = false;
    },

    /** Frees up the resources held by the MapLayers system.
     * Do not reference graphics containers after calling this method before
     * once again calling the Init() method. */
    Destroy() {
        if (this.destroyed)
            return;

        Object.values(layerIndex).forEach( layer => layer.destroy() );
        Object.keys(layerIndex).forEach( key => { delete layerIndex[key] });
        this.destroyed = true;
    },

    /**  */
    SortBatchLayerIntoPartitions() {
        if (this.destroyed)
            return;

        Object.values(layerIndex).forEach( layer => layer.sortIntoPartitions() );
    },

    /** Signals all freezable graphics layers that they are done being built
     * and should compile for draw efficiency. These layers should be treated
     * as immutable until reinitializing with Destroy() and Init(). */
    FreezeInanimateLayers() {
        if (this.destroyed)
            return;

        Object.values(layerIndex).forEach( layer => layer.freeze() );
    },

    PostLayerIndexToConsole() {
        const li = Object.values(layerIndex).map( layer => `${layer.zIndex} ${layer.key}` );
        Debug.ping('Map Layers', li);
    }
};

/** An individual layer object to the MapLayers system.
 * This class' purpose is to facilitate the optimization of optimizable static layers.
 */
class MapLayerContainer extends PIXI.Container {
    private key: string;
    private partitionStyle: 'none' | 'row'; // 'col'
    private freezable: boolean;

    prePartitionLayers: MapLayerContainer[] = [];

    constructor(options: MapLayerOptions) {
        super();
        this.key = options.key;
        this.partitionStyle = options.partitionStyle || 'none';
        this.freezable = options.freezable || false;
    }

    // parentKey = this.key.split(',').pop().join(',')

    // addChild override
    // if parentKey is partitioned layer, assign to rowIdx?

    // I *may* not want to override this. Think of a different naming scheme.

    addChild<TChildren extends PIXI.DisplayObject[]>(...child: TChildren): TChildren[0] {
        super.addChild(...child);
        // MapLayerFunctions.SortBatchLayerIntoPartitions();
        return child[0];
    }

    batchChild<TChildren extends PIXI.DisplayObject[]>(...child: TChildren): TChildren[0] {
        return super.addChild(...child);
    }

    // removeChild override
    // if parentKey is partitioned layer, remove from all rowIdx?

    private get parentKey() {
        return this.key.split(',').slice(0, -1).join(',');
    }

    removeChild<TChildren extends PIXI.DisplayObject[]>(...child: TChildren): TChildren[0] {
        const parent = (this.parentKey) ? MapLayer(this.parentKey) : undefined;

        if (!parent || parent.partitionStyle === 'none')
            super.removeChild(...child);
        
        else {
            const parentLayers = parent.children as MapLayerContainer[];

            child.forEach( toRemove => {
                parentLayers.some( layer => {
                    if (toRemove.parent === layer) {
                        layer.removeChild(toRemove);
                        return true;
                    }
                });
            });
        }

        return child[0];
    }

    /** If this layer is freezable, constructs all children into one singular image
     * to reduce draw calls. This process is irreversible and should only be used on
     * static layers. */
    freeze() {
        if (!this.freezable)
            return;

        const size = Game.display.standardLength;

        const { x, y } = {x: 0, y: 0 };
        const { width, height } = this;

        const tex = Game.app.renderer.generateTexture(
            this,
            PIXI.SCALE_MODES.NEAREST,
            1,
            new PIXI.Rectangle(x, y, width, height + size)
        );

        const sprite = new PIXI.Sprite(tex);

        this.removeChildren();
        this.addChild(sprite);
    }

    /** TODO Unfinished
     * The goal here is to get children of the lobby layers, static and non-static,
     * into a rowIdx layer of the same kind.
     * The secondary goal, naturally, is to mark static rowIdx layers as such so
     * FreezeInanimateLayers() can capture them.
     */
    sortIntoPartitions() {
        if (this.partitionStyle !== 'row')
            return;

        const size = Game.display.standardLength;
        const lobbyLayers = this.prePartitionLayers.length;
        const toSort: StringDictionary<MapLayerContainer> = {};

        this.prePartitionLayers.forEach( (layer, layerSlotNumber) => {
            layer.children.forEach( child => {
                const rowIdx = Math.floor(child.y / size);
                const rowKey = `${layer.key}:${rowIdx}`;

                if (!layerIndex[rowKey]) {
                    const newLayer = new MapLayerContainer({
                        key: rowKey,
                        freezable: layer.freezable
                    });
                    newLayer.zIndex = rowIdx * lobbyLayers + layerSlotNumber;
                    super.addChild(newLayer);
                    layerIndex[rowKey] = newLayer;
                }

                const rowLayer = layerIndex[rowKey];
                rowLayer.addChild(child);
                toSort[rowLayer.key] = rowLayer;
            });
        });

        Object.values(toSort).forEach( layer => layer.sortChildren() );
        super.sortChildren();
    }
}
