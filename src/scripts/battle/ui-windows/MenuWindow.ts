import { Slider } from "../../Common/Slider";
import { LowResTransform } from "../../LowResTransform";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { Game } from "../../..";
import { fonts } from "./DisplayInfo";
import { BoxContainerProperties } from "../../Common/BoxContainerProperties";
import { Point } from "../../Common/Point";
import { Pulsar } from "../../timer/Pulsar";

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
    value: T
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
        }
        else if (this.gamepad.button.dpadDown.pressed) {
            this.cursor.increment();
            this.movementPulsar.start();
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
        this.background.scale.set(
            MENU_OPTION.width + 8,
            (MENU_OPTION.height + 1) * li.length
        );

        // Build options text display object
        this.optionsText.removeChildren();          // Empty options-text graphics container
        this._options.forEach( (op, idx) => {       // Add new options-text to graphics container
            // const gback = new PIXI.Square;

            // const gborders = new PIXI.Line?;

            const gtext = new PIXI.BitmapText(op.text, fonts.menu);
            const contentBox = MENU_OPTION.contentBox();
            gtext.transform.position.set(contentBox.x, contentBox.y + contentBox.height*idx);

            this.optionsText.addChild(gtext);
        });
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

// TODO What is this below? Why?

/**  */
function newOptionBoxGraphic(width: number, height: number, text: string, colors: {light: number, mid: number, dark: number}) {
    const lineWidth = 1;
    const lineAlpha = 0.2;
    const lineAlignment = 1;

    const b = new PIXI.Graphics();
    b.beginFill(colors.mid);
    b.drawRect(0, 0, width, height);
    b.lineStyle(lineWidth, colors.light, lineAlpha, lineAlignment);
    b.moveTo(0,height).lineTo(0,0).lineTo(width, 0);
    b.lineStyle(lineWidth, colors.dark, lineAlpha, lineAlignment);
    b.moveTo(width,0).lineTo(width,height).lineTo(0,height);

    const t = new PIXI.BitmapText(text, fonts.menu);
    t.x = Math.floor((width - t.width) * 0.5);
    t.y = 2;

    b.addChild(t);

    return b;
}

/**  */
function getOptionBox(width: number, height: number, text: string) {
    return newOptionBoxGraphic(width, height, text, {light: 0xFFFFFF, mid: 0x495059, dark: 0x000000});
}

/**  */
function getOptionBoxSelected(width: number, height: number, text: string) {
    return newOptionBoxGraphic(width, height, text, {light: 0xFFFFFF, mid: 0x1A4740, dark: 0x000000});
}