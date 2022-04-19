import { Scene } from './scenes/Scene';
import { BattleScene } from './scenes/BattleScene';
import { DiagnosticLayer } from './scripts/DiagnosticLayer';
import { BlankScene } from './scenes/BlankScene';
import { Debug } from './scripts/DebugUtils';
import { WorkOrderHandler } from './scripts/system/WorkOrderHandler';
import { TextureLibrary } from './scripts/system/TextureLibrary';
import { DevController } from './scripts/controls/DevController';
import { Keys } from './scripts/controls/KeyboardObserver';

import * as PixiFilters from 'pixi-filters';

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
    readonly developmentMode = process.env.NODE_ENV === 'development';

    /** A keyboard controller for debug controls.
     * Be careful not to overlap controls with any others set. */
    readonly devController = new DevController({enable: this.developmentMode});

    /** Development settings container which affects various Game systems. */
    readonly devSettings = {
        /** Set to true to scale the view and stage separately, allowing you to see beyond the intended viewport. */
        limitStageScaling: false,
        /** A dev mechanism for whether to update the game loop. */
        suspend: false,
        /** A dev mechanism for whether to update a single frame while suspended. */
        suspendBypass: false,
        /** Whether to show the game metrics overlay. (FPS, etc.) */
        showDiagnosticLayer: false,
    }

    /** Scripts which describe development control behavior. */
    private readonly devControls = [
        function toggleStageScaling() {
            const dc = Game.devController;
            if (dc.pressed(Keys.iRow1, 'Shift')) {
                Game.devSettings.limitStageScaling = !Game.devSettings.limitStageScaling;
                Game.display.resize(Game.renderer, Game.container);
            }
        },
        function toggleGameSuspension() {
            const dc = Game.devController;
            const dset = Game.devSettings;

            if (dc.pressed(Keys.Enter)) {
                dset.suspend = !dset.suspend;
                dset.suspendBypass = false;
            }
            else if (dc.pressed(Keys.Space) && dset.suspend) {
                dset.suspendBypass = true;
            }
        },
        function toggleDiagnosticLayer() {
            const dc = Game.devController;
            const dset = Game.devSettings;
            if (dc.pressed(Keys.GraveAccent, 'Shift'))
                dset.showDiagnosticLayer = !dset.showDiagnosticLayer;
        }
    ];

    /** Runs debug scripts when in debug mode. */
    private developmentScripts() {
        if (!this.developmentMode)
            return;
        this.devControls.forEach( script => script() );
    }

    /** Independent ticker which handles inter-scene processes.
     * Think twice about using. */
    readonly globalTicker = new PIXI.Ticker({
        autoStart: false,
    });

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

    /** The scale deviation from the ideal FPS, I think.
     * I dunno, you'd have to ask Pixi. Always >= 0, usually ±0.1 from 1.0. */
    get delta() {
        return (!this.devSettings.suspend)
            ? this.systemTicker.deltaTime
            : 1;    // this.systemTicker.speed  ??
    }

    /** The number of milliseconds which have passed since the last loop cycle. Always >= 0. */
    get deltaMS() {
        return (!this.devSettings.suspend)
            ? this.systemTicker.deltaMS
            : 16.66; // Target FPS of 60
    }

    /** The game's frames-per-second. */
    get FPS() { return this.systemTicker.FPS; }

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
        resize: function(renderer: PIXI.Renderer, container: PIXI.Container) {
            let parentNode = renderer.view.parentNode;
            if (parentNode instanceof HTMLDivElement) {
                const wRatio = parentNode.offsetWidth / this.renderWidth;
                // TODO This fixes the too-tall problem, but .9 shouldn't be ~here~.
                const hRatio = window.innerHeight * .9 / this.renderHeight;
                this.scale = Math.min(wRatio, hRatio);
            }

            // Scaling the stage less than the view allows the user to see beyond the render viewport.
            const stageScaling = (Game.devSettings.limitStageScaling) ? this.scale * .65 : this.scale;

            renderer.resize(this.width, this.height);
            container.scale.x = container.scale.y = stageScaling;
        }
    };

    /** System root container equivalent to app.stage. */
    private readonly container = new PIXI.Container();

    /** System root container for world objects.
     * Containers all world layers from background to foreground. */
    private readonly worldContainer = new PIXI.Container();

    /** System ticker equivalent to app.ticker. */
    private readonly systemTicker = new PIXI.Ticker();

    /** System renderer equivalent to app.renderer. */
    readonly renderer = new PIXI.Renderer({
        width: this.display.width,
        height: this.display.height,
        backgroundColor: 0x1099bb,
        autoDensity: true,
        // resolution: window.devicePixelRatio || 1,   // Useful for mobile; measures screen pixel density.
        // resizeTo: document.querySelector('#gameframe'),
    });

    /** System asset loader equivalent to app.loader. */
    readonly loader = new PIXI.Loader();

    /** Game initializer. Adds canvas to given DOM element, and sets up the game loop. */
    init() {
        //@ts-ignore : Property is readonly but not set initially.
        this.contextElement = document.querySelector('#gameframe');    // TODO Allow init() to accept different frame ID's?
        if (this.contextElement) {
            this.contextElement.appendChild(this.renderer.view);
            this.contextElement.tabIndex = '0';
        }
        else {
            // TODO I don't know what should happen. This will stop the program, in any case.
            throw new Error(`No context for game renderer.`)
        }
        
        // First screen resize + add a listener to update on window resize.
        this.display.resize(this.renderer, this.container);
        window.addEventListener( 'resize', () => { this.display.resize(this.renderer, this.container)} );

        // Set entry point for the game (the first scene)
        this.switchScene(this.gameScenes.battleScene);

        // Add this game's visual layers to PIXI's app.stage
        this.worldContainer.addChild(this.backdrop);
        this.worldContainer.addChild(this.stage);
        this.container.addChild(this.worldContainer);
        this.container.addChild(this.hud);
        this.container.addChild(this.debugHud);

        // TODO Blur: Useful for niceness when FieldMenu is open

        // TODO Useful for sunny weather
        // const filter = new PixiFilters.GodrayFilter({
        //     alpha: .5,
        //     angle: -30,
        //     lacunarity: 2.50,
        // });
        
        // TODO Useful for conforming old DS style
        // const filter = new PixiFilters.PixelateFilter(2);

        // const filter = new PixiFilters.;
        // this.container.filters = [filter];
        
        // Preload game-wide resources, start the game on completion.
        this.preload( () => {
            // Add the debugger/diagnostics UI to the global scene.
            //@ts-expect-error
            this.diagnosticLayer = new DiagnosticLayer({enable: this.developmentMode});
            this.debugHud.addChild(this.diagnosticLayer.container);
            
            // Add the main loop to global system ticker.
            this.systemTicker.add(this.systemLoop, this);
            // this.systemTicker.add(this.gameLoop, this, 0);
            this.systemTicker.start();
        });
    }

    /** Loads assets into memory, then calls the callback function when completed. */
    private preload(callback?: Function) {
        // Move these to another file if they get massive big.
        this.loader.add('TecTacRegular', 'assets/TecTacRegular.xml');
        
        // Final loader call
        this.loader.load().onComplete.once( () => {
            //@ts-ignore    This is the first/only globalResources assignment.
            this.globalResources = this.loader.resources;
            if (callback)
                callback();
        })
    }

    /** Any configurations relevant to the function of the main update loop are performed here. */
    private systemLoop() {
        try {
            this.devController.update();
            this.developmentScripts();

            // Suspend frame updates mechanism
            if (this.devSettings.suspend && !this.devSettings.suspendBypass) {
                PIXI.Ticker.shared.stop();
                this.scene.halt();
            }
            else {
                PIXI.Ticker.shared.start();
                this.scene.unhalt();
                this.gameLoop();
            }

            // Unset bypass for next frame.
            this.devSettings.suspendBypass = false;

            // TODO Give non-development users a way to post the log file.
            if (this.devController.pressed(Keys.P, 'Shift'))
                Debug.exportLogToConsole();
        }
        catch (err) {
            console.error(err);
            Debug.exportLogToConsole();
            this.systemTicker.stop();   // Unrecoverable error: cease all function
            // TODO Give the user a FatalError visual message/cue?
        }
    }

    /** Main update loop. A state-machine implementing the Scene pattern. */
    private gameLoop() {
        if (this.scene.mustInitialize)
            this.scene.init();

        this.globalTicker.update();   // TODO Should this be started/stopped or manually updated? How do I get my own delta in there?
        this.scene.update();
        this.workOrders.close();
        this.textureLibrary.flush();
        this._frameCount++;

        this.renderer.render(this.container);
    }

    /** Unbuilds the current scene and switches context to the given scene object. */
    switchScene(newScene: Scene | null, transition?: null) {
        if (this.scene.ready)
            this.scene.destroy();
        if (newScene)
            this.scene = newScene;

        // TODO Completely reset and sanitize the typical containers: stage, ui, etc.
        // TODO Set up the loading-screen container, if such a thing is necessary
        // TODO Scene transition effects:
        //   - Transitions have a start, middle and end phase.
        //   - Player input is entirely suspended (*not* including dev controls) during the transition.
        //   - The proper switchScene logic should happen *after* start-phase completes
        //   - middle occurs while loading, I suppose. I dunno. Maybe we'll do a cool swish for no reason.
        //   - After the next scene is loaded, end-phase begins.
        //   - middle can have controls re-enabled for any loading-screen minigames we might play. This
        //      is a distant and possibly patent-infringing concern, however.
        //   All of this means that switchScene(newScene) is a SignalIntent and only schedules the change.
        //   If I want to change the terminology, it should be easy; I believe it's only called here in init().
        //   Should switchScene accept the transition method (some defined SceneTransition object) as a second
        //   parameter, then?
    }
}

// Singleton export
export const Game = new App();

// They put up on my boy at the light like: "Nice watch. Run it."
Game.init();
// And then presumably this game takes your ad-revenue.