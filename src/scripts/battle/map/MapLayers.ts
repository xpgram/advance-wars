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
        'top-animated',             // Same as top, but non-static, non-freezable objects.
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

            for (let i = 0; i < rows; i++) {
                const container = this[layer] as PIXI.Container;
                const sprites = container.children.filter( s => Common.within(s.position.y, i*size, (i+1)*size) );
                if (sprites.length == 0)
                    continue;
                sprites.forEach( s => s.position.y = 0);
                const rowLayer = new PIXI.Container();
                rowLayer.addChild(...sprites);
                const tex = Game.app.renderer.generateTexture(rowLayer, PIXI.SCALE_MODES.NEAREST, 1,
                    new PIXI.Rectangle(0,-size, rowLayer.width, rowLayer.height));
                const rowSprite = new PIXI.Sprite(tex);
                rowSprite.position.y = i*size;
                rowSprite.zIndex = sprites[0].zIndex * 100;
                rowSprites.push(rowSprite);
            }

            this[layer].removeChildren();
            this[layer].addChild(...rowSprites);
            this[layer].sortChildren(); // TODO <- This does nothing.

            Debug.ping('top layer', this[layer]);
        });

        // MapLayers.layerNames.forEach( l => {
        //     if (l !== 'top')
        //         this[l].visible = false;
        // });
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