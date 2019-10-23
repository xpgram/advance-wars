import * as PIXI from 'pixi.js';
import { Scene } from './scenes/Scene';
import { BattleScene } from './scenes/BattleScene';

// Pixi engine settings
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;    // Eliminates upscaling fuzziness

/**
 * @author Dei Valko
 * @version 1.1.0
 */
class App {
    /** A graphics-container acting as the game world. */
    readonly stage = new PIXI.Container();
    /** A graphics-container acting as the game's heads-up display. */
    readonly hud = new PIXI.Container();
    /** A graphics-container acting as a special heads-up display for performance information. */
    readonly debugHud = new PIXI.Container();

    /** Namespace for the various scenes the game will switch between. */
    readonly gameScenes = {
        battleScene: new BattleScene(),
    };

    /** type {GameState} Reference to the game's current scene. */
    scene: Scene | null = null;

    /** Object containing various display constants. */
    readonly display = {
        /** The standard measure of distance in pixels internally. */
        get standardLength(): number { return 16; },

        /** The width of the game's screen internally. */
        get renderWidth(): number { return 288; },

        /** The height of the game's screen internally. */
        get renderHeight(): number { return 192; },

        /** The real width of the game window in pixels. */
        get width(): number { return this.renderWidth * this.scale; },

        /** The real height of the game window in pixels. */
        get height(): number { return this.renderHeight * this.scale; },

        /** The ratio between internal render dimensions to on-screen window dimensions. */
        scale: 1,

        /** Callback function which resizes the canvas to the containing div element on window resize. */
        resize: function(app: PIXI.Application) {
            let parentNode = app.view.parentNode;
            if (parentNode instanceof HTMLDivElement)                   // This is silly, but I get it.
                this.scale = parentNode.clientWidth / this.renderWidth; // This works fine without the check, but TypeScript is whiny.
            
            app.renderer.resize(this.width, this.height);
            app.stage.scale.x = app.stage.scale.y = this.scale;
        }
    };

    /** Reference to the PIXI.App renderer. */
    readonly app = new PIXI.Application({
        width: this.display.width,
        height: this.display.height,
        backgroundColor: 0x1099bb,
        resolution: window.devicePixelRatio || 1,   // Useful for mobile; measures screen pixel density.
        //@ts-ignore
        autoResize: true,                           // Allows resizing of the game window.
    });

    /** Game initializer. Adds canvas to given DOM element, and sets up the game loop. */
    init() {
        let divElement = document.querySelector('#gameframe');
        if (divElement)
            divElement.appendChild(this.app.view);
        
        // First screen resize + add a listener to update on window resize.
        this.display.resize(this.app);
        window.addEventListener( 'resize', () => { this.display.resize(this.app)} );

        // Set entry point for the game (the first scene)
        this.switchScene(this.gameScenes.battleScene);

        // Add the main loop to PIXI's ticker.
        this.app.ticker.add( (delta: number) => {this.loop(delta)} );

        // Add this game's visual layers to PIXI's app.stage
        this.app.stage.addChild(this.stage);
        this.app.stage.addChild(this.hud);
        this.app.stage.addChild(this.debugHud);
    }

    /** Main update loop. A state-machine implementing the Scene pattern. */
    loop(delta: number) {
        if (this.scene) {
            if (this.scene.mustInitialize)
                this.scene.init();
            this.scene.update(delta);
        }
    }

    /** Unbuilds the current scene and switches context to the given scene object. */
    switchScene(newScene: Scene | null) {
        if (this.scene)
            this.scene.destroy();
        if (newScene)
            this.scene = newScene;
    }
}

// Singleton export
export const Game = new App();

// They put up on my boy at the light like: "Nice watch. Run it."
Game.init();
// And then presumably this game takes your ad-revenue.