import * as PIXI from "pixi.js";
import { Slider } from "../../Common/Slider";
import { Game } from "../../..";

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

    /** Determines x-position and controls the window's button-hold slide-in quality. */
    private holdToOpenSlider = new Slider({max: 1});
    /** Determines x-position and controls the window's side-switching quality. */
    private sideChangeSlider = new Slider({min: -1, max: 1});
    /** How fast the slider transitions between min and max, but indirectly how fast the window moves on screen when sliding in and out. */
    private slideSpeed = 0.15;
    /** The horizontal distance the window slides between min and max position. */
    private slideDistance: number;

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
        this.visualBoundaryWidth = options.visualBoundaryWidth;

        this.show = (options.show != false);
        this.showOnLeftSide = true;
        this.positionWindow({skip: true});

        Game.hud.addChild(this.displayContainer);
        Game.scene.ticker.add(this.update, this);
    }

    destroy() {
        this.displayContainer.destroy({children: true});
    }

    /** Positions the window on-screen according to its sliders. */
    positionWindow(options = {skip: false}) {
        if (options.skip)
            this.skipSlideAnimation();

        // Calculate each slider's effect on the window's x-position (from its flagged ideal position)
        let sideChangeDisplace = -this.slideDistance * this.sideChangeSlider.value;
        let holdToOpenDisplace = this.slideDistance - (this.slideDistance * this.holdToOpenSlider.value);
        if (this.onLeftSide)
            holdToOpenDisplace = -holdToOpenDisplace;   // Should always point off-screen
        if (this.mask)
            this.mask.x = (this.onLeftSide) ? this.width : -this.width; // Should always point on-screen

        // Pick the relevant off-screen x-position for our side and apply our calculated displaces.
        let x = (this.onLeftSide) ? -this.slideDistance : this.visualBoundaryWidth;
        x += sideChangeDisplace;
        x += holdToOpenDisplace;
        
        this.displayContainer.x = x;
    }

    /** Gradually positions the window after incrementing its controlling sliders toward their limiting values. */
    private update() {
        // Increment sliders
        let holdToOpenDir = (this.show) ? this.slideSpeed : -this.slideSpeed;
        let sideChangeDir = (this.showOnLeftSide) ? -this.slideSpeed : this.slideSpeed;
        this.holdToOpenSlider.value += holdToOpenDir;
        this.sideChangeSlider.value += sideChangeDir;
        this.positionWindow();
    }

    /** Returns true if the window is in a pleasant position to refresh its display, i.e., not switching screen sides. */
    get refreshable() {
        let deadZone = 0.1;
        let offscreen = (this.sideChangeSlider.value < deadZone && this.sideChangeSlider.value > -deadZone);
        let onLeftSide = (this.sideChangeSlider.value == this.sideChangeSlider.min && this.showOnLeftSide);
        let onRightSide = (this.sideChangeSlider.value == this.sideChangeSlider.max && !this.showOnLeftSide);

        return offscreen || onLeftSide || onRightSide;
    }

    /** Returns true if the window is actually on the left side of the screen currently. */
    get onLeftSide() {
        let middlePoint = (this.sideChangeSlider.min + this.sideChangeSlider.max) / 2;
        return this.sideChangeSlider.value < middlePoint;
    }

    /** Instantly positions the window wherever it is desired to be. */
    private skipSlideAnimation() {
        this.holdToOpenSlider.value = (this.show) ? this.holdToOpenSlider.min : this.holdToOpenSlider.max;
        this.sideChangeSlider.value = (this.showOnLeftSide)? this.sideChangeSlider.min : this.sideChangeSlider.max;
    }
}