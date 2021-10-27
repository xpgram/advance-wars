import * as PIXI from "pixi.js";
import { Slider } from "../../Common/Slider";
import { Game } from "../../..";
import { Debug } from "../../DebugUtils";

/** 
 * 
 */
export class SlidingWindow {

    /** Reference to the spritesheet containing all the UI images. */
    readonly sheet = Game.scene.resources['UISpritesheet'].spritesheet as PIXI.Spritesheet;
    /** Standard pixel distance. Useful for UI positioning. */
    static readonly stdLength = 4;
    /** Standard width of UI windows in pixels. */
    static readonly stdWidth = 88;

    /** The theoretical width of the window. Not enforced. */
    width: number;
    /** The theoretical height of the window. Not enforced. */
    height: number;

    /** The pixel distance of the right boundary edge from the left. This should be set to the display's width. */
    readonly visualBoundaryWidth: number;

    /** Whether or not to display the window at all. */
    enabled = true;
    /** Whether to slide the window in from off-screen or hide it. */
    show = true;
    /** Grammatically, which side of the screen the window should appear on. */
    showOnLeftSide = true;

    /** Describes the motion of the window as its slider moves from one extreme to the other. */
    private shapeFunction(x: number): number {
        let pow = Math.pow;
        let cos = Math.cos;
        let PI = Math.PI;
        let y = -pow(cos(PI*x / 2), 2) + 1;
        return y;
    }
    /** How fast the slider transitions between min and max, and indirectly how fast the window moves on screen when sliding in and out. */
    private slideSpeed = 0.15;

    /** Determines x-position and controls the window's button-hold slide-in quality. */
    private holdToOpenSlider = new Slider({
        max: 1,
        granularity: this.slideSpeed,
        shape: this.shapeFunction
    });
    /** Determines x-position and controls the window's side-switching quality. */
    private sideChangeSlider = new Slider({
        min: 0,
        max: 1,
        granularity: this.slideSpeed/2,
        shape: x => (this.shapeFunction(x) * 2 - 1)     // Change output range: [0, 1] —→ [-1, 1]
    });
    /** The horizontal distance the window slides between min and max position. */
    private slideDistance: number;

    /** The horizontal distance from the hidden position the window will stop at when hiding. */
    private stickOutDistance: number;

    /** The window, graphically. The background and all sub-elements should be added here. */
    readonly displayContainer = new PIXI.Container();
    /** The mask which may reveal or hide other UI elements if they're properly linked up. */
    readonly mask: PIXI.Graphics | null = null;

    constructor(options: SlidingWindowOptions) {
        console.assert(Boolean(this.sheet), "UI spritesheet does not exist. Do not initialize SlidingWindow before loading assets.");

        this.displayContainer.y = options.verticalDistance || 0;
        this.width = options.width;
        this.height = options.height;
        this.slideDistance = this.width;
        this.stickOutDistance = options.stickOutDistance || 0;
        this.visualBoundaryWidth = options.visualBoundaryWidth || Game.display.renderWidth;

        this.show = (options.show != false);
        this.showOnLeftSide = false;
        this.positionWindow({skip: true});

        Game.hud.addChild(this.displayContainer);
        Game.scene.ticker.add(this.update, this);
    }

    destroy() {
        this.displayContainer.destroy({children: true});
    }

    /** Sets this display UI to visible. */
    setVisible() {
        this.displayContainer.visible = true;
    }

    /** Sets this display UI to not visible. */
    setInvisible() {
        this.displayContainer.visible = false;
    }

    /** Positions the window on-screen according to its sliders. */
    positionWindow(options = {skip: false}) {
        if (options.skip)
            this.skipSlideAnimation();

        // TODO This is messy and hard to read; clean it up.

        // Calculate each slider's effect on the window's x-position (from its flagged ideal position)
        const effectiveSlideDistance = this.slideDistance - this.stickOutDistance;
        let sideChangeDisplace = -effectiveSlideDistance * this.sideChangeSlider.output;
        let holdToOpenDisplace = effectiveSlideDistance - (effectiveSlideDistance * this.holdToOpenSlider.output);
        if (this.onLeftSide)
            holdToOpenDisplace = -holdToOpenDisplace;   // Should always point off-screen
        if (this.mask)
            this.mask.x = (this.onLeftSide) ? this.width : -this.width; // Should always point on-screen

        // Pick the relevant off-screen x-position for our side and apply our calculated displaces.
        let x = (this.onLeftSide) ? -effectiveSlideDistance : this.visualBoundaryWidth - this.stickOutDistance;
        x += sideChangeDisplace;
        x += holdToOpenDisplace;
        
        this.displayContainer.x = x;
    }

    /** Gradually positions the window after incrementing its controlling sliders toward their limiting values. */
    private update() {
        // Set increment direction
        this.holdToOpenSlider.incrementFactor = (this.show) ? 1 : -1;
        this.sideChangeSlider.incrementFactor = (this.showOnLeftSide) ? -1 : 1;

        // Update slider incrementers
        this.holdToOpenSlider.increment();
        this.sideChangeSlider.increment();

        // Move the window graphically
        this.positionWindow();
    }

    /** Returns true if the window is in a pleasant position to refresh its display, i.e., not switching screen sides. */
    get refreshable() {
        let deadZone = 0.1;
        let offscreen = (this.sideChangeSlider.output < deadZone && this.sideChangeSlider.output > -deadZone);
        let onLeftSide = (this.sideChangeSlider.track == this.sideChangeSlider.min && this.showOnLeftSide);
        let onRightSide = (this.sideChangeSlider.track == this.sideChangeSlider.max && !this.showOnLeftSide);

        return offscreen || onLeftSide || onRightSide;
    }

    /** Returns true if the window is actually on the left side of the screen currently. */
    get onLeftSide() {
        let middlePoint = (this.sideChangeSlider.min + this.sideChangeSlider.max) / 2;
        return this.sideChangeSlider.track < middlePoint;
    }

    /** Instantly positions the window wherever it is desired to be. */
    private skipSlideAnimation() {
        this.holdToOpenSlider.track = (this.show) ? this.holdToOpenSlider.max : this.holdToOpenSlider.min;
        this.sideChangeSlider.track = (this.showOnLeftSide)? this.sideChangeSlider.min : this.sideChangeSlider.max;
    }
}