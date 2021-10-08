import { Game } from "../../..";
import { Debug } from "../../DebugUtils";
import { StringDictionary } from "../../CommonTypes";

/*
So, I haven't learned much.
I've learned a little.

I may want to rethink this system.
Row layer should be integral to every interaction.
This should be opt-out.
Or... sigh, I dunno.

In any case. Things are sorting correctly. But they aren't.
I need a way to *see* into the memory structure.
Currently, I can see the indexing system, but this does not tell me layering order.
I need to *see* [bottom, static:1, animated:1, glass:1, static:2, animated:2, glass:2, ...].
Anything else, we have a problem.

Also, the unit layer does not split.
Don't know why. Perhaps I never configured that because top was so broken.
But it doesn't. All units are (should be?) in the unit:lobby layer.
Sometimes they still sort under top layer things; don't know what that's about.
Sometimes they sort under top layer things in all circumstances, maybe that's
always what was happening. Who knows, not I.

[7/30]
All right. I broke it.
I do believe this is the correct route, though.
Really, it was broken from the beginning.

I was working on fitting all indexed layers to globalLayer for sorting.
This broke UI sorting, though, for some reason.
Maybe just a z issue.

[7/31]
Actually, I think we're closer than I thought.

Issues:
Mountain shadows are too thick.
Glass tiles are incorrect or missing from top layer items.
  Their layers appear to be sorting correctly though.. so I dunno.
MapCursor also appears underneath top layer; why? Shouldn't that be the same as player HUD?
Unit layer is not split yet, so they absolutely do not sort correctly.
  I need to finish updating addChild to sort automatically without breaking anything.
I think I still need to tell top:static to freeze? I can't remember.
  [!] Just tried it, setting top:static to freeze breaks everything.
RoughSea (in Terrain.js) is animated and can't be pushed to bottom anymore.
  But this breaks the shallow sea overlay color-adjustment, so it looks worse.
Board cutoff masking is broken. Likely because it isn't applied to globalLayer.
  Easy fix, I just gotta remember whhich part of the code sets that up.
  I should make MapLayers do it. Just use 'bottom' or 'sea' dimensions plus a little top-side overhead.

Otherwise, it's actually working exactly as intended, I think. No biggie.

[8/1]
So, layer effects should be fine, I don't need to refactor.
The problem is that layers are doubling up for some reason.
Mountain shadows are too dark beause there are more than one per mountain.
Same for Rough Seas.
Why?
I thought it was because of accidental refreezing, but preventing multiple freeze calls did nothing.
Mountain shadows darken every time SortIntoPartitions is called. No idea why.

[8/8]
Can I set 'unit' to auto configure?
It could add a listener to every object position and re-sort it whenever it moves.

*/

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
    movingEntities?: boolean,
    children?: MapLayerOptions[],
}

/** This object defines the map layer structure. */
const layers_config: MapLayerOptions[] = [
    {key: 'sea'},
    {key: 'bottom', freezable: true},
    {key: 'top', partitionStyle: 'row', children: [
        {key: 'static', freezable: false},
        {key: 'animated'},
        {key: 'glass-tile'},
        {key: 'unit', movingEntities: false},
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
