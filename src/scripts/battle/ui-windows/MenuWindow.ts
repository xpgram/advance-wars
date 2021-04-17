import { Slider } from "../../Common/Slider";
import { LowResTransform } from "../../LowResTransform";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { Game } from "../../..";
import { fonts } from "./DisplayInfo";
import { BoxContainerProperties } from "../../Common/BoxContainerProperties";
import { Point } from "../../Common/Point";
import { Pulsar } from "../../timer/Pulsar";

// Temp. Literally just here to describe the menu's palette; its presence
// here is not prescriptive of where or how it should be implemented.
const color = (h: number, s: number, v: number) => {
    const { floor, abs } = Math;

    const C = (v/100)*(s/100);
    const X = C*(1 - abs(((h/60) % 2) - 1));
    const m = (v/100) - C;

    const sw = [
        [C, X, 0],
        [X, C, 0],
        [0, C, X],
        [0, X, C],
        [X, 0, C],
        [C, 0, X]
    ];
    const which = floor(h / 60);

    const r = (sw[which][0] + m)*0xFF << 0x10;
    const g = (sw[which][1] + m)*0xFF << 0x8;
    const b = (sw[which][2] + m)*0xFF;

    return r + g + b;
};

// Colors
const palette = {
    selector:   color(166, 100, 50),
    background: color(196, 28, 23),
    button: {
        unselected: {
            primary:  color(214, 18, 35),
            light:    color(220, 16, 50),
            lightest: color(195, 12, 60),
            dark:     color(188, 11, 15),
        },
        selected: {
            primary: color(170, 64, 28),
            light:   color(165, 34, 60),
            dark:    color(184, 35, 10),
        },
    },
}
const textbox = {
    background: color(196, 28, 23),
    textBackground: color(220, 16, 50),
    textRule: color(214, 18, 35),
    margin: [3,1],
    border: 0,
    padding: [3,2], // 3px including rule
    
    // text
    paddingTop: 4,
    size: [128,12],
}
// Dimensions (might already be defined below; just moving this from my notepad)
const fieldMenu = {
    margin: [3,1],
    border: 1,
    size: [88,12],
}
const commandMenu = {
    margin: [3,1],
    border: 1,
    size: [40,12],
}

// Menu component properties constants
const MENU_BACKGROUND = new BoxContainerProperties({
    padding: { left: 2, right: 2, top: 1.5, bottom: 1.5, },
})
const MENU_OPTION = new BoxContainerProperties({
    height: fonts.menu.font.size,
    margin: { top: .5, bottom: .5, },
    border: { left: 1, right: 1, top: 1, bottom: 1, },
    padding: { left: 1, right: 1, },
})

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
        const g = new PIXI.Graphics();
        g.beginFill(0x000000);
        g.drawRect(0,0,1,1);
        g.endFill();
        this.background.addChild(g);
        const cursor = new PIXI.Graphics();
        cursor.beginFill(0x00FF00);
        cursor.drawRect(6,6,4,4);
        cursor.endFill();
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
            this.background.addChild( newMenuGraphic(MENU_OPTION.width, this._options, this.cursor.output) );
        }
        else if (this.gamepad.button.dpadDown.pressed) {
            this.cursor.increment();
            this.movementPulsar.start();

            this.background.removeChildren();
            this.background.addChild( newMenuGraphic(MENU_OPTION.width, this._options, this.cursor.output) );
        }

        if (this.gamepad.axis.dpad.neutral) {
            this.movementPulsar.stop();
            this.movementPulsar.interval = MenuWindow.cursorSettings.pulseIntervalFirst;
        }
    }

    /** Updates selector screen/world position depending on animation states. */
    private updateCursorPosition() {
        const vert = MENU_OPTION.contentBox().height * this.cursor.output;
        this.gCursor.position.set(-10, vert);
    }

    /** Triggers a cursor change according the held player inputs. */
    private triggerCursorMovement() {
        const dir = this.gamepad.axis.dpad.point.y;
        this.cursor.increment(dir);
        this.movementPulsar.interval = MenuWindow.cursorSettings.pulseInterval;

        this.background.removeChildren();
        this.background.addChild( newMenuGraphic(MENU_OPTION.width, this._options, this.cursor.output) );
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

        // TODO Test implementation uses hardcoded numbers
        MENU_OPTION.width = this.getNewContentWidth();
        this.background.removeChildren();
        this.background.addChild( newMenuGraphic(MENU_OPTION.width, this._options, this.cursor.output) );
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
function newMenuGraphic(width: number, options: MenuOption<number>[], sel: number) {
    
    const g = new PIXI.Graphics();

    // Background
    g.beginFill(palette.background);
    g.drawRect(0, 0, width, options.length * 16 + 2);
    g.endFill();

    // Children
    options.forEach( (option, idx) => {
        g.addChild( newOptionGraphic({
            pos: new Point(2, 1 + 16*idx),
            dim: new Point(width - 4, 16),
            text: option.text,
            focus: (sel == idx),
        }) );
    });

    return g;
}

/**  */
function newOptionGraphic(options: {pos: Point, dim: Point, text: string, focus?: boolean}) {
    const { pos, dim, text, focus } = options;
    const colors = (focus) ? palette.button.selected : palette.button.unselected;

    const g = new PIXI.Graphics();

    // Background
    g.beginFill(colors.primary);
    g.drawRect(0, 0, dim.x, dim.y);
    g.endFill();

    // Edge lighting
    g.beginFill(colors.light);
    g.drawRect(0, 0, dim.x, 1);
    g.drawRect(0, 1, 1, dim.y - 1);
    g.endFill();

    // Edge shadows
    g.beginFill(colors.dark);
    g.drawRect(0, dim.y, dim.x, 1);
    g.drawRect(dim.x, 0, 1, dim.y - 1);
    g.endFill();

    // Text
    const gt = new PIXI.BitmapText(text, fonts.menu);
    gt.transform.position.set(1, 1);

    // Combine and return
    g.addChild(gt);
    g.transform.position.set(pos.x, pos.y);
    return g;
}