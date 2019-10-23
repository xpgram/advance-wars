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

    constructor() {
        this.state = Scene.UNBUILT;
    }

    /** Initialize step sets up the scene and readies it for the game-loop. */
    init() {
        if (this.state == Scene.UNBUILT)
            this.load(); // → setup → ready
        else
            throw new Error("Attempted to reconstruct a constructed scene.");
    }

    /** Collects resource links from inheriting scene, then loads them
     * with a provided callback to setup() on completion. */
    private load() {
        Game.app.loader.reset();    // Empty contents.
        this.loadStep();            // Collects resource URLs into this.linker
        this.linker.forEach(link => {
            Game.app.loader.add(link.name, link.url);
        });
        this.state = Scene.BUILDING;// Prevent calls to init() and update() while loading.
        Game.app.loader.load().onComplete.add( () => {
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

    /** Destroy step disassembles the scene object and un-readies it for game-looping. */
    destroy() {
        if (this.state == Scene.READY) {
            this.destroyStep();
            this.state = Scene.UNBUILT;
        } else
            throw new Error("Attempted to destroy an unconstructed scene.");
    }

    protected abstract loadStep(): void;
    protected abstract setupStep(): void;
    protected abstract updateStep(delta: number): void;
    protected abstract destroyStep(): void;
}