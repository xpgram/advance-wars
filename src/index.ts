import { Scene } from './scenes/Scene';
import { BattleScene } from './scenes/BattleScene';
import { DiagnosticLayer } from './scripts/DiagnosticLayer';
import { BlankScene } from './scenes/BlankScene';
import { Debug } from './scripts/DebugUtils';
import { WorkOrderHandler } from './scripts/system/WorkOrderHandler';

// Pixi engine settings
PIXI.settings.MIPMAP_TEXTURES = PIXI.MIPMAP_MODES.OFF;
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;    // Eliminates upscaling fuzziness
//PIXI.settings.RESOLUTION =        // TODO Figure out what this should be.
                                    // I think not setting this messes up my filters (they dingle my pixels), but I don't know what I'm setting it to.
                                    // App options below already sets resolution to devicePixelRatio || 1, so what else do I need?
                                    // My guy in the thread, I'm inferring that this resolution and app.resolution are different.

/**
 * @author Dei Valko
 * @version 1.1.0
 */
class App {
    /** A graphics-container for solid-panel images adding character to blank scenes. */
    readonly backdrop = new PIXI.Container();
    /** A graphics-container acting as the game world. */
    readonly stage = new PIXI.Container();
    /** A graphics-container acting as the game's heads-up display. */
    readonly hud = new PIXI.Container();
    /** A graphics-container acting as a special heads-up display for performance information. */
    readonly debugHud = new PIXI.Container();

    readonly globalResources!: PIXI.IResourceDictionary;

    /** A repository for delayed function calls. */
    readonly workOrders = new WorkOrderHandler();

    /** The number of frames that have elapsed since the game started. Note that this will cap out at infinity if left on for 9.8 billion years. */
    get frameCount() { return this._frameCount; }
    private _frameCount = 0;

    /** Namespace for the various scenes the game will switch between. */
    readonly gameScenes = {
        blankScene: new BlankScene(),
        battleScene: new BattleScene(),
    };

    /** type {GameState} Reference to the game's current scene. */
    scene: Scene = this.gameScenes.blankScene;

    /** Object containing various display constants. */
    readonly display = {
        /** The standard measure of distance in pixels internally. */
        get standardLength(): number { return 16; },

        /** The width of the game's screen internally. */
        get renderWidth(): number { return 320; },

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

        // Add this game's visual layers to PIXI's app.stage
        this.app.stage.addChild(this.backdrop);
        this.app.stage.addChild(this.stage);
        this.app.stage.addChild(this.hud);
        
        // Preload game-wide resources, start the game on completion.
        this.preload( () => {
            // Add the debugger/diagnostics UI to the global scene.
            this.app.stage.addChild(new DiagnosticLayer().container);
            
            // Add the main loop to PIXI's ticker.
            this.app.ticker.add( (delta: number) => {this.loop(delta)} );
        });
    }

    /** Loads assets into memory, then calls the callback function when completed. */
    private preload(callback?: Function) {
        // Move these to another file if they get massive big.
        this.app.loader.add('TecTacRegular', 'assets/TecTacRegular.xml');
        
        // Final loader call
        this.app.loader.load().onComplete.once( () => {
            //@ts-ignore    This is the first/only globalResources assignment.
            this.globalResources = this.app.loader.resources;
            if (callback)
                callback();
        })
    }

    /** Main update loop. A state-machine implementing the Scene pattern. */
    loop(delta: number) {
        if (this.scene.mustInitialize)
            this.scene.init();
        this.scene.update(delta);
        this.workOrders.close();
        this._frameCount++;
    }

    /** Unbuilds the current scene and switches context to the given scene object. */
    switchScene(newScene: Scene | null) {
        if (this.scene.ready)
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