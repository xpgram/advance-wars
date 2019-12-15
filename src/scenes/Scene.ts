import * as PIXI from "pixi.js";
import { Game } from "..";

/**
 * @author Dei Valko
 * @version 1.0.0
 */
export abstract class Scene {
    private static UNBUILT = 0;
    private static BUILDING = 1;
    private static READY = 2;
    private state: number;

    protected linker: {name: string, url: string}[] = [];

    /** Whether the scene object still needs to set up its constructs. */
    get mustInitialize() { return this.state == Scene.UNBUILT; };
    /** Whether the scene object is set up and ready to be used. */
    get ready() { return this.state == Scene.READY; };

    /** Volatile ticker used to update object processes during the scene. Destroyed on scene closing. */
    get ticker(): PIXI.Ticker {
        if (!this._ticker)
            throw new Error("Attempted to access the scene's destroyed ticker.");
        return this._ticker;
    }
    private _ticker: PIXI.Ticker | null = null;

    /** Volatile reference to the scene's loaded resources. */
    get resources(): PIXI.IResourceDictionary {
        if (!this._resources)
            throw new Error("Attempted to access the scene's destroyed resources.");
        return this._resources;
    }
    private _resources: PIXI.IResourceDictionary | null = null;

    constructor() {
        this.state = Scene.UNBUILT;
    }

    /** Initialize step sets up the scene and readies it for the game-loop. */
    init() {
        if (this.state == Scene.UNBUILT) {
            this._ticker = new PIXI.Ticker();
            this.ticker.start();
            this.load(); // → setup → ready
        }
        else
            throw new Error("Attempted to reconstruct a constructed scene.");
    }

    /** Destroy step disassembles the scene object and un-readies it for game-looping. */
    destroy() {
        if (this.state == Scene.READY) {
            if (this._ticker) this._ticker.destroy();
            this._ticker = null;
            this.destroyStep();
            this.state = Scene.UNBUILT;
        } else
            throw new Error("Attempted to destroy an unconstructed scene.");
    }

    /** Collects resource links from inheriting scene, then loads them
     * with a provided callback to setup() on completion. */
    private load() {
        Game.app.loader.reset();                // Empty contents.
        Game.app.loader.removeAllListeners();   // Let go of any callbacks we may have added.
        this.loadStep();                        // Collects resource URLs into this.linker[]
        this.linker.forEach(link => {
            Game.app.loader.add(link.name, link.url);
        });
        this.state = Scene.BUILDING;            // Prevent calls to init() and update() while loading.
        Game.app.loader.load().onComplete.once( () => {
            this._resources = Game.app.loader.resources;
            this.setup()
        });
    }

    /** Runs the inheriting scene's setup step, then readies the scene for
     * frame-by-frame updating. */
    private setup() {
        this.setupStep();
        this.state = Scene.READY;
    }

    /** Update step describes frame-by-frame events. */
    update(delta: number) {
        if (this.state == Scene.READY)
            this.updateStep(delta);
    }

    protected abstract loadStep(): void;
    protected abstract setupStep(): void;
    protected abstract updateStep(delta: number): void;
    protected abstract destroyStep(): void;
}