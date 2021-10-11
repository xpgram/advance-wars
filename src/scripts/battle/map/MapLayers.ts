import { Game } from "../../..";
import { Debug } from "../../DebugUtils";
import { StringDictionary } from "../../CommonTypes";

// TODO Refactor to use cacheAsBitmap
// TODO Refactor to be less complicated

type LayerProperties = {
    key: string,
    rowSegmented?: boolean,
    freezable?: boolean,
    movingEntities?: boolean,       // TODO Is this necessary? Current design spec doesn't include it.
    children?: MapLayerOptions[],
}

type Layer = {
    container: PIXI.Container,
    properties: LayerProperties,
}

type LayerIndex = Array<LayerIndex | Layer>;

/** Global index of all graphics layers of the map system. */
const layerIndex: LayerIndex = [];

/** Global container which exists between map-layers and the Game.stage */
let globalLayer: PIXI.Container;

/** This object defines the map layer structure. */
const layers_config: LayerProperties[] = [
    {key: 'sea'},
    {key: 'bottom', freezable: true},
    {key: 'top', rowSegmented: true, children: [
        {key: 'static', freezable: true},
        {key: 'animated'},
        {key: 'glass-tile'},
        {key: 'unit', movingEntities: true},
    ]},
    {key: 'cloud-shadow'},
    {key: 'ui'},
];

/** Layer which contains all others. */
const rootLayer = {
    container: globalLayer,
    properties: {
        key: 'root',
        children: layers_config,
    }
}

/** 
 * Globally accessible method for retrieving graphics layers from the map system.
 * Must be initialized before use. Use MapLayerFunctions.Init() to initialize.
 * 
 * @author Dei Valko
 * @version 2.0.0
 */
export function MapLayer(...terms: (string | number)[]): MapLayerContainer {
    // TODO Refactor

    let currentLayer = rootLayer;
    let result = layerIndex;                // Reduces to specific layer object.
    let path = [rootLayer.properties.key];

    function lazyBuildIndex(node: LayerIndex, toPosition: number, propertiesSet: LayerProperties[]): void {
        // TODO Verify this function
        // a layer index it assigns children
        // a parent container to add children to
        // a starting idx to work from; do not rebuild already built layers
        // a terminating idx to build to; build layers such that index[idx] returns something.
        // correct properties are mapped to the correct pixi.container
        //   what properties should row segments have?
        // pixi.containers are linked and LayerIndex children are linked
        //   why not squash the LayerIndex construct into Layer and Layer.container.children?

        for (let i = node.length; i <= toPosition; i++) {
            const propertiesIdx = i % propertiesSet.length;
            node.push({
                container: new PIXI.Container(),
                properties: propertiesSet[propertiesIdx],
            });
        }
    }

    terms.forEach( term => {
        let idx: undefined | number;

        // Check that current node can be reduced further.
        if (!Array.isArray(result))
            throw new Error(`End of index depth reached; cannot reduce index by [${terms}]`);
        
        // String index
        if (typeof key === 'string') {
            if (currentLayer.properties.rowSegmented)
                throw new Error(`Layer '${term}' does not exist on path [${path}]`);

            lazyBuildIndex(result, currentLayer.children.length - 1, currentLayer.children);
            idx = result.findIndex( layer => layer.properties.key === key );
            currentLayer = result[idx];
            result = currentLayer.children;
        }

        // TODO Verify numeric index function is building the following:
        // root    bottom
        //         top     0   static
        //                     animated
        //                 1   static
        //                     animated
        //         ui
        // Each term is its own layer with the right-linked as its children.

        // Numeric index
        if (typeof key === 'number') {
            if (!currentLayer.properties.rowSegmented)
                throw new Error(`Layer '${term}' does not exist on path [${path}]'`);
            lazyBuildIndex(result, key, [{container: new PIXI.Container(), properties: {key: `${term}`}}]);
            idx = key;

        }
    });



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
class MapLayerContainer extends PIXI.Container {
    private key: string;
    private partitionStyle: 'none' | 'row'; // 'col'
    private freezable: boolean;

    private frozen = false;

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

        return globalLayer.removeChild(...child);

        // TODO What is going on below?
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
        if (!this.freezable || this.frozen)
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
        Debug.ping(tex);

        this.removeChildren();
        this.addChild(sprite);

        this.frozen = true;
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
