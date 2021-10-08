import { Game } from "../../..";
import { Debug } from "../../DebugUtils";
import { StringDictionary } from "../../CommonTypes";
import { Common } from "../../CommonUtils";

/*

*/

const Z_RANGE = Math.pow(2,7);  // 8, but 7 because treated as signed.
const SEGMENT_Z = Math.pow(2,8);
const LAYER_Z = Math.pow(2,16);

const log: StringDictionary<PIXI.DisplayObject> = {};

type MapLayerIndex = {
    [key: string]: MapLayerContainer;
}

/** Global index of all graphics layers of the map system. */
const layerIndex: MapLayerIndex = {};

/** Global container which exists between map-layers and the Game.stage */
let globalLayer: PIXI.Container;

type MapLayerOptions = {
    key: string,
    partitionStyle?: 'none' | 'row',  // 'col'
    freezable?: boolean,
    children?: MapLayerOptions[],

    layerIdx?: number,
}

/** This object defines the map layer structure. */
const layers_config: MapLayerOptions[] = [
    {key: 'sea'},
    {key: 'bottom', freezable: true},
    {key: 'top', partitionStyle: 'row', children: [
        {key: 'static', freezable: false},
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

        globalLayer = new PIXI.Container();
        Game.stage.addChild(globalLayer);

        buildFromConfig(layers_config, globalLayer);
        this.destroyed = false;
    },

    /** Frees up the resources held by the MapLayers system.
     * Do not reference graphics containers after calling this method before
     * once again calling the Init() method. */
    Destroy() {
        if (this.destroyed)
            return;

        globalLayer.destroy({children: true});
        Object.keys(layerIndex).forEach( key => { delete layerIndex[key] });
        this.destroyed = true;
    },

    /**  */
    SortBatchLayerIntoPartitions() {
        if (this.destroyed)
            return;

        Object.values(layerIndex).forEach( layer => layer.sortIntoPartitions() );
        globalLayer.sortChildren();
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
        // Match globalLayer sort to layerIndex keys.
        const layerOrder = globalLayer.children.map( child => child.key );
        Debug.ping('Sorting Order', layerOrder);
        Debug.ping('Sorting Log', log);
    }
};

/** An individual layer object to the MapLayers system.
 * This class' purpose is to facilitate the optimization of optimizable static layers.
 */
class MapLayerContainer {
    private key: string;
    private partitionStyle: 'none' | 'row'; // 'col'
    private freezable: boolean;
    private zIndex: number;

    private children: PIXI.DisplayObject[] = [];
    private frozen = false;

    constructor(options: MapLayerOptions) {
        this.key = options.key;
        this.partitionStyle = options.partitionStyle || 'none';
        this.freezable = options.freezable || false;
        this.zIndex = (options.layerIdx || 0)*LAYER_Z;
    }

    addChild<TChildren extends PIXI.DisplayObject[]>(...child: TChildren): TChildren[0] {
        if (this.frozen) {
            Debug.assert(this.frozen, 'Tried to add an object to a map-layer which is already locked.');
            return child[0];
        }

        this.children.push(...child);
        child.forEach( c => {
            const z_row = Math.floor(c.position.y / Game.display.standardLength);
            c.zIndex = Common.confine(c.zIndex, -Z_RANGE, Z_RANGE);
            c.zIndex += Z_RANGE + this.zIndex + (z_row * Number(this.partitionStyle === 'row'));
        })
        globalLayer.addChild(...child);
        globalLayer.sortChildren();
        return child[0];
    }

    private get parentKey() {
        return this.key.split(',').slice(0, -1).join(',');
    }

    removeChild<TChildren extends PIXI.DisplayObject[]>(...child: TChildren): TChildren[0] {
        const parent = (this.parentKey) ? MapLayer(this.parentKey) : undefined;
        // TODO I don't think I need these keys anymore.

        this.children = this.children.filter( c => !child.includes(c) );
        return globalLayer.removeChild(...child);
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
                    globalLayer.addChild(newLayer);
                    layerIndex[rowKey] = newLayer;
                }

                const rowLayer = layerIndex[rowKey];
                rowLayer.addChild(child);
                toSort[rowLayer.key] = rowLayer;

                // Content mapping for debugging purposes
                const [posx, posy, posz] = [child.x/16, child.y/16, rowLayer.zIndex];
                log[`(${posx},${posy}):z${posz} —— ${rowKey}`] = child;
            });
        });

        Object.values(toSort).forEach( layer => layer.sortChildren() );
        super.sortChildren();

        // TODO sortChildren() doesn't return a new list, does it?
        // Disabled, the map looks exactly(?) the same. Is this really the problem?

        /*
        You know what.. just occurred to me?
        What does this method do?
        It sorts top:static into top:static:1, top:static:2, ..., top:static:n.
        Where is top:animated:1?

        */
    }
}

// TODO Create debug UI system.
// Either use the console, or display over the in-game sprites.
// I want to know: position, name, z-index, etc. for every tile position and every layer
// within that tile position.
// I think this should be built as the map is conceived.
// It would be easier and probably more complete.
// That said, I would like to know *exactly* what MapLayers is doing too.