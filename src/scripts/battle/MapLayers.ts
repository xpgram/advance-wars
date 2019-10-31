import * as PIXI from "pixi.js";
import { Game } from "../..";

/**
 * Globally accessible dictionary of layers for the map system's sprites.
 * Use: MapLayers['layer name'].doSomething();
 * Must be initialized before use.
 * 
 * Layers: 'bottom', 'top', 'fog'
 * 
 * @author Dei Valko
 * @version 0.1.0
 */
export const MapLayers: any = {
    destroyed: true,
    layerNames: [
        'bottom',
        'top',      // units, meteors and plasma get +1 to z-index
        'fog',
        'ui'        // Map cursor, or any other 'in world' UI details.
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