import { Scene } from './scenes/Scene';
import { BattleScene } from './scenes/BattleScene';
import { DiagnosticLayer } from './scripts/DiagnosticLayer';
import { BlankScene } from './scenes/BlankScene';
import { Debug } from './scripts/DebugUtils';
import { WorkOrderHandler } from './scripts/system/WorkOrderHandler';
import { TextureLibrary } from './scripts/system/TextureLibrary';
import { DevController } from './scripts/controls/DevController';
import { Keys } from './scripts/controls/KeyboardObserver';

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
    /** The page element assumed as the game's canvas. */
    readonly contextElement!: any;

    /** True if this app is being run in a development environment. */
    private readonly debugMode = process.env.NODE_ENV === 'development';

    /** A keyboard controller for debug controls.
     * Be careful not to overlap controls with any others set. */
    readonly devController = new DevController({enable: this.debugMode});

    /** Scripts which  */
    private readonly devControls = [
        function toggleStageScaling() {
            const dc = Game.devController;
            if (dc.get(Keys.Shift).down && dc.get(Keys.iRow1).pressed) {
                Game.devSettings.limitStageScaling = !Game.devSettings.limitStageScaling;
                Game.display.resize(Game.app);
            }
        },
    ];

    /** Runs debug scripts when in debug mode. */
    private developmentScripts() {
        if (!this.debugMode)
            return;
        this.devControls.forEach( script => script() );
    }

    /** A graphics-container for solid-panel images adding character to blank scenes. */
    readonly backdrop = new PIXI.Container();
    /** A graphics-container acting as the game world. */
    readonly stage = new PIXI.Container();
    /** A graphics-container acting as the game's heads-up display. */
    readonly hud = new PIXI.Container();
    /** A graphics-container acting as a special heads-up display for performance information. */
    readonly debugHud = new PIXI.Container();

    /** Reference to the game's debug UI layer. */
    readonly diagnosticLayer!: DiagnosticLayer;

    readonly globalResources!: PIXI.IResourceDictionary;

    /** The number of seconds which have passed since the last loop cycle. Always >= 0. */
    // Preventing negative values is a protection against user-modified system time.
    get delta() { return (this._delta >= 0) ? this._delta : 0; }
    private _delta = 0;

    // Setting this to MAX_INT ensures the first-frame delta call returns 0 as the first calc is always negative.
    private _lastCycleTimestamp: number = Number.MAX_SAFE_INTEGER;
    /** Updates delta to reflect the time since the last updateDelta call. */
    private updateDelta() {
        let timestamp = Date.now();
        this._delta = (timestamp - this._lastCycleTimestamp) / 1000;
        this._lastCycleTimestamp = timestamp;
    }

    /** A repository for delayed function calls. */
    readonly workOrders = new WorkOrderHandler();

    /** A repository for expensive but reusable textures. Emptied at the end of every frame. */
    readonly textureLibrary = new TextureLibrary();

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

    /** Development settings container which affects various Game systems. */
    readonly devSettings = {
        /** Set to true to scale the view and stage separately, allowing you to see beyond the intended viewport. */
        limitStageScaling: false,
    }

    /** Object containing various display constants. */
    readonly display = {
        /** The standard measure of distance in pixels internally. */
        get standardLength(): number { return 16; },

        /** The width of the game's screen internally. */
        get renderWidth(): number { return this.standardLength * 20; },

        /** The height of the game's screen internally. */
        get renderHeight(): number { return this.standardLength * 12; },

        /** The real width of the game window in pixels. */
        get width(): number { return this.renderWidth * this.scale; },

        /** The real height of the game window in pixels. */
        get height(): number { return this.renderHeight * this.scale; },

        /** The ratio between internal render dimensions to on-screen window dimensions. */
        scale: 1,

        /** Callback function which resizes the canvas to the containing div element on window resize. */
        resize: function(app: PIXI.Application) {
            let parentNode = app.view.parentNode;
            if (parentNode instanceof HTMLDivElement) {
                const wRatio = parentNode.offsetWidth / this.renderWidth;
                // TODO This fixes the too-tall problem, but .9 shouldn't be ~here~.
                const hRatio = window.innerHeight * .9 / this.renderHeight;
                this.scale = Math.min(wRatio, hRatio);
            }

            // Scaling the stage less than the view allows the user to see beyond the render viewport.
            const stageScaling = (Game.devSettings.limitStageScaling) ? this.scale * .65 : this.scale;

            app.renderer.resize(this.width, this.height);
            app.stage.scale.x = app.stage.scale.y = stageScaling;
        }
    };

    /** Reference to the PIXI.App renderer. */
    readonly app = new PIXI.Application({
        width: this.display.width,
        height: this.display.height,
        backgroundColor: 0x1099bb,
        autoDensity: true,
        // resolution: window.devicePixelRatio || 1,   // Useful for mobile; measures screen pixel density.
        // resizeTo: document.querySelector('#gameframe'),
    });

    /** Game initializer. Adds canvas to given DOM element, and sets up the game loop. */
    init() {
        //@ts-ignore : Property is readonly but not set initially.
        this.contextElement = document.querySelector('#gameframe');    // TODO Allow init() to accept different frame ID's?
        if (this.contextElement) {
            this.contextElement.appendChild(this.app.view);
            this.contextElement.tabIndex = '0';
        } // TODO What if it can't find the context element?
        
        // First screen resize + add a listener to update on window resize.
        this.display.resize(this.app);
        window.addEventListener( 'resize', () => { this.display.resize(this.app)} );

        // Set entry point for the game (the first scene)
        this.switchScene(this.gameScenes.battleScene);

        // Add this game's visual layers to PIXI's app.stage
        this.app.stage.addChild(this.backdrop);
        this.app.stage.addChild(this.stage);
        this.app.stage.addChild(this.hud);
        this.app.stage.addChild(this.debugHud);
        
        // Preload game-wide resources, start the game on completion.
        this.preload( () => {
            // Add the debugger/diagnostics UI to the global scene.
            //@ts-expect-error
            this.diagnosticLayer = new DiagnosticLayer({enable: this.debugMode});
            this.debugHud.addChild(this.diagnosticLayer.container);
            
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
        this.updateDelta();
        if (this.scene.mustInitialize)
            this.scene.init();
        this.devController.update();
        this.developmentScripts();
        this.scene.update(delta);
        this.workOrders.close();
        this.textureLibrary.flush();
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