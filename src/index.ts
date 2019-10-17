import * as PIXI from 'pixi.js';

// Pixi engine settings
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;    // Eliminates aliasing——retains those hard-edges.

export const Game = {
    /** @type {PIXI.Container} A graphics-container acting as the game's "display." */
    stage: new PIXI.Container(),

    /** Namespace for the various scenes the game will switch between. */
    gameStates: {
        battleState: 0,
    },

    /** type {GameState} Reference to the game's current scene. */
    state: 0,

    /** @constant display Object containing various display constants. */
    display: {
        /** @type {number} The standard measure of distance in pixels internally. */
        get standardLength() { return 16; },

        /** @type {number} The width of the game's screen internally. */
        get renderWidth() { return 240; },

        /** @type {number} The height of the game's screen internally. */
        get renderHeight() { return 160; },

        /** @type {number} The real width of the game window in pixels. */
        get width() { return this.renderWidth * this.scale; },

        /** @type {number} The real height of the game window in pixels. */
        get height() { return this.renderHeight * this.scale; },

        /** @type {number} The ratio between internal render dimensions to on-screen window dimensions. */
        scale: 1,

        /**
         * Callback function which resizes the canvas to the containing div element on window resize.
         */
        resize: function(app: PIXI.Application) {
            let parentNode = app.view.parentNode;
            if (parentNode instanceof HTMLDivElement)                   // This is silly, but I get it.
                this.scale = parentNode.clientWidth / this.renderWidth; // This works fine without the check, but TypeScript is whiny.
            
            app.renderer.resize(this.width, this.height);
            app.stage.scale.x = app.stage.scale.y = this.scale;
        }
    },

    /** Reference to the PIXI.App renderer. */
    app: new PIXI.Application({
        width: 240,//this.display.width,
        height: 160,//this.display.height,
        backgroundColor: 0x1099bb,
        //autoResize: true,                           // Allows resizing of the game window (supposedly).
        resolution: window.devicePixelRatio || 1,   // Useful for mobile; measures screen pixel density.
    }),

    /** Game initializer. Adds canvas to given DOM element, and sets up game loop. */
    init() {
        let divElement = document.querySelector('#gameframe');
        if (divElement)
            divElement.appendChild(this.app.view);
    }
}

// They put up on my boy at the light like: "Nice watch. Run it."
Game.init();
// And then presumably this game takes your ad-revenue.