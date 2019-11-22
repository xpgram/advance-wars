import * as PIXI from "pixi.js";
import { Slider } from "../../Common/Slider";
import { Game } from "../../..";

/** 
 * 
 */
export class SlidingWindow {
    /** The theoretical width of the window. Not enforced. */
    width: number;
    /** The theoretical height of the window. Not enforced. */
    height: number;

    /** Standard pixel distance. Useful for UI positioning. */
    static readonly stdLength = 4;
    /** Standard width of UI windows in pixels. */
    static readonly stdWidth = 88;

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
        let bgProps = {
            width: options.width,
            height: options.height,
            color: options.color || 0x000000,
            alpha: 0.5,
            borderSize: options.borderSize || {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0
            },
            borderColor: options.borderColor || 0x000000
        };

        // Draw the window's background
        if (options.drawBackground != false) {
            let background = new PIXI.Graphics();

            // Main fill
            background.beginFill(bgProps.color, bgProps.alpha);
            background.drawRect(0, 0, bgProps.width, bgProps.height);
            background.endFill();

            // Border
            background.beginFill(bgProps.borderColor, bgProps.alpha);
            background.drawRect(0, 0, bgProps.width, bgProps.borderSize.top);
            background.drawRect(0, bgProps.height, bgProps.width, -bgProps.borderSize.bottom);
            background.drawRect(0, 0, bgProps.borderSize.left, bgProps.height);
            background.drawRect(bgProps.width, 0, -bgProps.borderSize.right, bgProps.height);
            background.endFill();

            background.zIndex = -1;
            this.displayContainer.addChild(background);
        }

        // Draw the window's mask
        if (options.drawMask == true) {     // Must be explicitly requested
            let mask = new PIXI.Graphics();

            mask.beginFill(0xFFFFFF);
            mask.drawRect(0, 0, bgProps.width, bgProps.height);
            mask.endFill();

            this.mask = mask;
            this.mask.zIndex = -2;
            this.mask.x = bgProps.width;                // Set to the right of this window so it may reveal something there.
            this.displayContainer.addChild(this.mask);  // Must set as mask somewhere or this will just be a white box on screen.
        }

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

        // In the range -1 to 1, 0 is the delimiter.
        let showOnLeftSide = (this.sideChangeSlider.value < 0);

        // Calculate each slider's effect on the window's x-position (from its flagged ideal position)
        let sideChangeDisplace = -this.slideDistance * this.sideChangeSlider.value;
        let holdToOpenDisplace = this.slideDistance - (this.slideDistance * this.holdToOpenSlider.value);
        if (showOnLeftSide) {
            holdToOpenDisplace = -holdToOpenDisplace;   // Should always point off-screen
            if (this.mask) this.mask.x = -this.mask.x;  // Should always point on-screen
        }

        // Pick the relevant off-screen x-position for our side and apply our calculated displaces.
        let x = (showOnLeftSide) ? -this.slideDistance : this.visualBoundaryWidth;
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

    /** Instantly positions the window wherever it is desired to be. */
    private skipSlideAnimation() {
        this.holdToOpenSlider.value = (this.show) ? this.holdToOpenSlider.min : this.holdToOpenSlider.max;
        this.sideChangeSlider.value = (this.showOnLeftSide)? this.sideChangeSlider.min : this.sideChangeSlider.max;
    }
}