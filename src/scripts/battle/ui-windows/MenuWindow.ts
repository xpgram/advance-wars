import { Slider } from "../../Common/Slider";
import { LowResTransform } from "../../LowResTransform";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { Game } from "../../..";
import { fonts } from "./DisplayInfo";
import { BoxContainerProperties } from "../../Common/BoxContainerProperties";
import { Point } from "../../Common/Point";
import { Pulsar } from "../../timer/Pulsar";
import { Debug } from "../../DebugUtils";
import { Color, Common } from "../../CommonUtils";

// TODO Option selection is updated via redrawing the entire menu
// TODO Worse, this is triggered in 3 different places. Slider.onChange or something should be used instead.
// TODO Color and palette stuff.. probs shouldn't be here? I dunno.
// TODO Cursor isn't animated.
// TODO Cursor color is wrong, and unanimated.(?)
// TODO Previous test implementation of draw graphics in constructor is still there. I'm not even sure if it's doing anything.
// TODO Further, I'm clearly not using all these PIXI.Containers I have defined. Use them or drop them.

// TODO Generic menu structure object > this class, a GUI
// Rewrite, baby... yea... I'm excited, I'm just tired.

// Colors
const HSV = Color.HSV;
const palette = {
    selector:   HSV(166, 100, 50),
    background: HSV(196, 28, 23),
    button: {
        unselected: {
            primary:  HSV(214, 18, 35),
            light:    HSV(220, 16, 50),
            lightest: HSV(195, 12, 60),
            dark:     HSV(188, 11, 15),
        },
        selected: {
            primary: HSV(170, 64, 28),
            light:   HSV(165, 34, 60),
            dark:    HSV(184, 35, 10),
        },
    },
}

// Menu component properties constants
const OPTION_PROPS = new BoxContainerProperties({
    minWidth: 40,
    height: fonts.menu.fontSize + 1,
    margin: { top: .5, bottom: .5, },
    border: { left: 1, right: 1, top: 1, bottom: 1, },
    padding: { left: 1, right: 1, },
});
const MENU_PROPS = new BoxContainerProperties({
    padding: { left: 2, right: 2, top: 1.5, bottom: 1.5, },
});

/** Represents an individual selectable option of a MenuWindow. */
export type MenuOption<T> = {
    /** Descriptive string associated with the value; used to populate MenuWindow. */
    text: string,
    /** The value actually being selected over by the user. */
    value: T,
    /** Whether this option isn't selectable. By default, false. */
    disabled?: boolean,
}

/** User-interactable UI element for seleting one of many options.
 * MenuWindow should be provided a list of MenuOptions with which to populate
 * itself and will return the value of the selected-over option upon request.
 */
export class MenuWindow {

    static readonly cursorSettings = {
        moveFrames: 3,          // How many frames to change selector states
        pulseInterval: 5,       // How long to wait between cursor changes (frames).
        pulseIntervalFirst: 20, // How long to wait before the first cursor auto-change (frames).
    }

    private readonly gamepad: VirtualGamepad;

    readonly transform = new LowResTransform();

    private readonly graphics = new PIXI.Container();
    private readonly background = new PIXI.Container();
    private readonly optionsText = new PIXI.Container();
    private readonly gCursor = new PIXI.Container();

    // TODO Graphics structure
    // How do I determine/enforce an option is disabled/greyed-out?
    // I think optionsGraphics = Container() needs to be optionsGraphics = container[]

    // global
    //  \- background
    //      \- option []
    //          \- box graphic
    //              \- text

    private _options: MenuOption<number>[] = [];
    private _enabled = true;

    /** Represents the currently selected option. */
    private cursor = new Slider();

    /** The timer which triggers animation pulses. */
    private animPulsar: Pulsar;

    /** Guides the option selector's position on-screen as it animates from one selectable to another. */
    private stateChangeAnimSlider = new Slider({
        granularity: 1 / MenuWindow.cursorSettings.moveFrames,
    })

    /** The timer which triggers repeatable movements. */
    private movementPulsar: Pulsar;

    constructor(gp: VirtualGamepad, ui: PIXI.Container) {
        // Connect graphical peripheries
        this.transform.object = this.graphics;
        ui.addChild(this.graphics);

        // Connect controller.
        this.gamepad = gp;

        // Invoke options configurer
        this.options = [];

        // Add updater to global ticker.
        Game.scene.ticker.add( this.update, this );

        // Initiate timers.
        this.movementPulsar = new Pulsar(
            MenuWindow.cursorSettings.pulseIntervalFirst,
            this.triggerCursorMovement,
            this
        );

        // TODO Remove; test
        const cursor = newSelectorGraphic(Point.Origin, 0);
        this.gCursor.addChild(cursor);

        this.graphics.addChild(this.background);
        this.graphics.addChild(this.gCursor);
        this.graphics.addChild(this.optionsText);
        this.transform.z = 110;
    }

    destroy() {
        this.transform.destroy();
        this.graphics.destroy({children: true});
        
        Game.scene.ticker.remove( this.update, this );
    }

    private update() {
        this.updateCursor();
        this.updateCursorPosition();
    }

    /** Updates cursor state in accordance with gamepad input. */
    private updateCursor() {
        if (!this.enabled)
            return;
        
        // Input polling.
        if (this.gamepad.button.dpadUp.pressed) {
            this.cursor.decrement();
            this.movementPulsar.start();    // TODO Build in a first pulse timer? Would simplify.

            this.background.removeChildren();
            this.background.addChild( newMenuGraphic(this._options, this.cursor.output) );
        }
        else if (this.gamepad.button.dpadDown.pressed) {
            this.cursor.increment();
            this.movementPulsar.start();

            this.background.removeChildren();
            this.background.addChild( newMenuGraphic(this._options, this.cursor.output) );
        }

        if (this.gamepad.axis.dpad.neutral) {
            this.movementPulsar.stop();
            this.movementPulsar.interval = MenuWindow.cursorSettings.pulseIntervalFirst;
        }
    }

    /** Updates selector screen/world position depending on animation states. */
    private updateCursorPosition() {
        const vert = OPTION_PROPS.containerBox().height * this.cursor.output + MENU_PROPS.padding.top;
        this.gCursor.position.set(MENU_PROPS.padding.left, vert);
    }

    /** Triggers a cursor change according the held player inputs. */
    private triggerCursorMovement() {
        const dir = this.gamepad.axis.dpad.point.y;
        this.cursor.increment(dir);
        this.movementPulsar.interval = MenuWindow.cursorSettings.pulseInterval;

        this.background.removeChildren();
        this.background.addChild( newMenuGraphic(this._options, this.cursor.output) );
    }

    /** Reveals the menu's graphics and enables player controls. */
    show() {
        this.enable();
        this.graphics.visible = true;
    }

    /** Hides the menu's graphics and disables player controls. */
    hide() {
        this.disable();
        this.graphics.visible = false;
    }

    /** Whether this menu is invisible and uninteractable. */
    get hidden() {
        return (!this.graphics.visible);
    }

    /** Enables the player interactivity listener. */
    enable() {
        this._enabled = true;
    }

    /** Disables the player interactivity listener. */
    disable() {
        this._enabled = false;
        this.movementPulsar.stop();
        this.movementPulsar.interval = MenuWindow.cursorSettings.pulseIntervalFirst;
    }

    /** Whether this menu is interactable. */
    get enabled() {
        return this._enabled;
    }

    /** The list of selectables as text/value pairs. */
    get options() {
        return this._options.slice();
    }
    set options(li: MenuOption<number>[]) {
        this._options = li;
        // reconfigure box height/width
        
        this.cursor = new Slider({
            max: this._options.length,
            track: 'min',
            granularity: 1,
            looping: true,
            // mode: 'loop',
        });

        OPTION_PROPS.width = this.getNewContentWidth();
        MENU_PROPS.children = Array(li.length).fill(OPTION_PROPS);

        this.background.removeChildren();
        this.background.addChild( newMenuGraphic(this._options, this.cursor.output) );
        
        this.gCursor.removeChildren();
        this.gCursor.addChild( newSelectorGraphic(Point.Origin, 0) );
    }

    /** Returns the value currently being selected over. */
    get selectedValue() {
        return this._options[this.cursor.output].value;
    }

    /** Returns the pixil-width of the longest option name in this menu's list of options. */
    private getNewContentWidth() {
        if (this._options.length === 0)
            return 0;

        const tmp = new PIXI.BitmapText('', fonts.menu);
        const sizes = this._options.map( o => {tmp.text = o.text; return tmp.textWidth;} );
        return sizes.reduce( (max, cur) => (max > cur) ? max : cur );
    }
}

// TODO The below, I'm just fuckin' around. I should really factor this out or something.

/**  */
function newMenuGraphic(options: MenuOption<number>[], sel: number) {
    
    const g = new PIXI.Graphics();

    // Positional vars
    const menuContentBox = MENU_PROPS.contentBox();

    // Background
    g.beginFill(palette.background);
    g.drawRect(0, 0, MENU_PROPS.elementWidth, MENU_PROPS.elementHeight);
    g.endFill();

    // Children
    options.forEach( (option, idx) => {
        g.addChild( newOptionGraphic({
            pos: new Point(menuContentBox.x, menuContentBox.y + OPTION_PROPS.elementHeight*idx),
            text: option.text,
            focus: (sel == idx),
        }) );
    });

    return g;
}

/**  */
function newOptionGraphic(options: {pos: Point, text: string, focus?: boolean}) {
    const { pos, text, focus } = options;
    const colors = (focus) ? palette.button.selected : palette.button.unselected;

    const g = new PIXI.Graphics();

    // Positional vars
    const content = OPTION_PROPS.contentBox();
    const background = OPTION_PROPS.borderInnerBox();
    const border = OPTION_PROPS.borderOuterBox();

    // Background
    g.beginFill(colors.primary);
    g.drawRect(background.x, background.y, background.width, background.height);
    g.endFill();

    // Edge lighting
    g.beginFill(colors.light);
    g.drawRect(border.x, border.y, border.width, OPTION_PROPS.border.top);
    g.drawRect(border.x, border.y, OPTION_PROPS.border.left, border.height);
    g.endFill();

    // Edge shadows
    g.beginFill(colors.dark);
    g.drawRect(border.x, border.y + border.height, border.width, -OPTION_PROPS.border.bottom);
    g.drawRect(border.x + border.width, border.y, -OPTION_PROPS.border.right, border.height);
    g.endFill();

    // Text
    const gt = new PIXI.BitmapText(text, fonts.menu);
    gt.transform.position.set(content.x, content.y);

    // Combine and return
    g.addChild(gt);
    g.transform.position.set(pos.x, pos.y);
    return g;
}

function newSelectorGraphic(pos: Point, frame: number) {
    const border = OPTION_PROPS.borderOuterBox();
    const g = new PIXI.Graphics();

    g.beginFill(palette.selector);
    g.drawRect(border.x - 2, border.y - 2, border.width + 4, border.height + 4);
    g.endFill();

    g.beginHole();
    g.drawRect(border.x - 1, border.y - 1, border.width + 2, border.height + 2);
    g.endHole();

    return g;
}