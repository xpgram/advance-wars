import { Game } from "../../..";
import { Common } from "../../CommonUtils";
import { Debug } from "../../DebugUtils";

/**
 * Globally accessible dictionary of layers for the map system's sprites.
 * Use: MapLayers['layer name'].doSomething();
 * Must be initialized before use.
 * 
 * Layers: 'bottom', 'top', 'cloud-shadow', 'ui'
 * 
 * @author Dei Valko
 * @version 0.1.3
 */
export const MapLayers: any = {
    destroyed: true,
    layerNames: [
        'sea',                      // Sea background animated layer.
        'bottom',                   // Most terrain tiles
        'top',                      // Over-hanging sprites: mountains, mist, etc. Units, meteors and plasma get +1 to z-index

        'top:static',               // Over-hanging sprites; freezable.
        'top:animated',             // Over-hanging, animated sprites.
        'top:glass',                // Sprite masks.
        'top:unit',                 // Unit sprites.
        // TODO I need some way of breaking the above into rows.
        // Separated neatly, I... think I could do this post-hoc.
        // However, units need some way of accessing rows so they can change on move.

        'cloud-shadow',
        'ui'                        // Map cursor, or any other 'in world' UI details.
    ],

    /** Creates containers acting as layers and adds them to the global stage. */
    init() {
        if (this.destroyed) {
            this.layerNames.forEach((layer: string) => {
                this[layer] = new PIXI.Container();
                Game.stage.addChild(this[layer]);
            });
            this.destroyed = false;
        }
    },

    freezeInanimateLayers() {
        const layers = [
            'bottom',
        ];

        layers.forEach( layer => {
            const width = this[layer].width;
            const height = this[layer].height;
            const tex = Game.app.renderer.generateTexture(this[layer], PIXI.SCALE_MODES.NEAREST, 1,
                new PIXI.Rectangle(0,0,width,height));
            const sprite = new PIXI.Sprite(tex);

            this[layer].removeChildren();
            this[layer].addChild(sprite);
        });

        return;

        // TODO assemble 'top' into rows, freeze each one.
        // TODO Break this apart into manageable pieces; below is prototype code.
        // TODO zIndex (..?) sorting is broken. Glass layer (UI) invisible (or possibly can't exist), units never appear underneath mountains, etc.
        ['top'].forEach( layer => {
            const width = this[layer].width;
            const height = this[layer].height;

            const size = Game.display.standardLength;
            const rows = height / size;
            const rowSprites = [];

            const container = this[layer] as PIXI.Container;

            for (let i = 0; i < rows; i++) {
                // TODO Assemble top layer into rows; reduce number of sprite objects.
                // This will not be simple.
                // The top layer consists of:
                //  - Extra-tall (overlapping) land graphics
                //  - Animated land graphics
                //  - Glass-overlay tiles
                //  - Unit graphics
                // I think it's just those four.
                // Anyway,
                // this is all per-row.
                // It's doable, naturally, but I'm not sure if I can post-hoc it from here.
                //
                // I need... TerrainClass? to add graphics to 'top:base:idx' or 'top:animated:idx'
                // I need TerrainObject to add the tile mask to 'top:glass:idx'
                // I need units to... they move. Wherever they readjust zIndex, they need to readjust
                // 'top:unit:idx' instead.

                // const sprites = container.children.filter( s => Common.within(s.position.y, i*size, (i+1)*size) );
                // if (sprites.length == 0)
                //     continue;
                // sprites.forEach( s => s.position.y = 0);
                // const rowLayer = new PIXI.Container();
                // rowLayer.addChild(...sprites);
                // const tex = Game.app.renderer.generateTexture(rowLayer, PIXI.SCALE_MODES.NEAREST, 1,
                //     new PIXI.Rectangle(0,-size, rowLayer.width, rowLayer.height));
                // const rowSprite = new PIXI.Sprite(tex);
                // rowSprite.position.y = i*size;
                // rowSprite.zIndex = sprites[0].zIndex * 100;
                // rowSprites.push(rowSprite);
            }

            // this[layer].removeChildren();
            // this[layer].addChild(...rowSprites);
            // this[layer].sortChildren(); // TODO <- This does nothing.

            Debug.ping('top layer', this[layer]);
        });
    },

    /** Destroys all layers and all their children. */
    destroy() {
        if (!this.destroyed) {
            this.layerNames.forEach((layer: string) => {
                Game.stage.removeChild(this[layer]);
                this[layer].destroy({ children: true, textures: true });
            });
            this.destroyed = true;
        }
    }
};

// MapLayers - Accessor to layers

// MapLayer - Handles .add() .remove() etc.
// Properties:
//   segmented:row / free
//   freezable

type LayerOptions = {
    segmented?: 'row',  // 'col'
    freezable?: boolean,
}

class Layer {
    private segmented: 'row' | undefined; // 'col'
    private freezable: boolean;

    private container = new PIXI.Container();

    constructor(options?: LayerOptions) {
        this.segmented = options?.segmented || undefined;
        this.freezable = options?.freezable || false;
    }

    /** Must be called; layer will not appear in game otherwise. */
    init() {
        Game.stage.addChild(this.container);
    }

    /** Cleans up this layer's resources. Do not use after calling this method. */
    destroy() {
        Game.stage.removeChild(this.container);
        this.container.destroy({children: true});
    }

    /** Adds a Container object to this layer. PIXI's adherence to one parent per
     * child means you can safely add an object multiple times to 'move' it, which
     * is only necessary if the layer is segmented anyway. */
    add(object: PIXI.Container): void {
        if (!this.segmented) {
            this.container.addChild(object);
        }

        else if (this.segmented === 'row') {
            const size = Game.display.standardLength;
            const row = Math.floor(object.position.y / size);

            const start = this.container.children.length;
            for (let i = start; i <= row; i++) {
                const layer = new PIXI.Container();
                layer.y = i * size;
                this.container.addChild(layer);
            }

            const rowLayer = this.container.children[row] as PIXI.Container;
            rowLayer.addChild(object);
            rowLayer.sortChildren();
        }
    }

    /** Removes a Container object from the layer completely. */
    remove(object: PIXI.Container): void {
        const list = this.getSegments();
        list.some( layer => {
            const child = (layer as PIXI.Container).removeChild(object);
            if (child)
                return true;
        });
    }

    /** Empties the layer, resetting anything done to it up to this point. */
    removeAllChildren() {
        this.container.removeChildren();
    }

    /** Returns true if the given Container object is contained by this layer. */
    objectIncluded(object: PIXI.Container): boolean {
        const list = this.getSegments();
        return list.some( layer => layer === object.parent );
    }

    /** If this layer is freezable, constructs all child objects contained by this
     * layer into one singular image to reduce PIXI draw calls. This process is
     * irreversible. Should only be used on static layers. */
    freeze() {
        if (!this.freezable)
            return;

        const list: PIXI.Container[] = this.getSegments();

        list.forEach( (o, idx) => {
            const { x, y, width, height } = o.getBounds();

            const tex = Game.app.renderer.generateTexture(
                o,
                PIXI.SCALE_MODES.NEAREST,
                1,
                new PIXI.Rectangle(x,y,width,height)
            );

            const sprite = new PIXI.Sprite(tex);
            sprite.position.set(x, y);

            list[idx] = sprite;
        });

        this.container.removeChildren();
        this.container.addChild(...list);
    }

    /** Returns a list of Containers representing this layer's segments. */
    private getSegments(): PIXI.Container[] {
        switch (this.segmented) {
            case 'row':
                return this.container.children.slice() as PIXI.Container[];
            default:
                return [this.container];
        }
    }
}

/**  */
const MapLayers_new = {
    destroyed: true,
    layers: undefined as unknown as {
        sea: Layer,
        bottom: Layer,
        top_static: Layer,
        top_animated: Layer,
        top_glass: Layer,
        top_unit: Layer,
        cloud_shadow: Layer,    // TODO Am I using this one? Remove it.
        UI: Layer,
    },

    /**  */
    init() {
        if (!this.destroyed)
            return;
        
        const l = this.layers;
        l.sea = new Layer();
        l.bottom = new Layer({freezable: true});
        l.top_static = new Layer({freezable: true, segmented: 'row'});
        l.top_animated = new Layer({segmented: 'row'});
        l.top_glass = new Layer({segmented: 'row'});
        l.top_unit = new Layer({segmented: 'row'});
        l.cloud_shadow = new Layer();  // TODO Am I using this? Remove it.
        l.UI = new Layer();

        this.destroyed = false;
    },

    /**  */
    destroy() {
        if (this.destroyed)
            return;

        Object.values(this.layers).forEach( l => l.destroy() );
        //@ts-ignore
        this.layers = undefined;
    },

    /**  */
    freezeInanimateLayers() {
        if (this.destroyed)
            return;

        const layers = Object.values(this.layers);
        layers.forEach( o => o.freeze() );
    },
}