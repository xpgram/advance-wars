
/**
 * I don't know what the plan is——that's why I'm here, baby.
 * 
 * - I need a standardized rectangle drawing system.
 *   I think I have one, but it doesn't draw *the* AW:DoR menu boxes, you know?
 * - Font, which one?
 * - Appear/Disappear controls, and Enable/Disable controls
 * - Manages its own cursor, probs with a looping Slider
 * - A command-fill method which accepts a list of {name:, value:} objects
 *   The menu auto-configures its height, etc., instantly.
 * - A set-position method which moves the menu to some point
 * - A method which returns the value/name of the currently selected
 * 
 * I also want to think about standardizing this at least a bit.
 * The field menu will be mostly the same. In fact, might be exactly.
 * I should check before beginning any work.
 * This class may in fact just be "MenuWindow" or something.
 */

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

/**  */
export type MenuOption = {
    name: string,
    value: number
}

/**  */
export class MenuWindow /* extends ??? */ {

    static readonly cursorSettings = {
        moveFrames: 3,              // How many frames to change selector states
        inputRepeatFrames: 10,      // How frequently to impulse state changes.
        inputRepeatDelay: 10,       // How long to delay the first impulse state change.
    }

    readonly transform = new LowResTransform();
    private readonly graphics = new PIXI.Container();
    private readonly background = new PIXI.Container();
    private readonly optionsText = new PIXI.Container();

    private _options: MenuOption[] = [];
    private _enabled = true;

    // How do I determine/enforce an option is disabled/greyed-out?
    // I think optionsGraphics = Container() needs to be optionsGraphics = container[]

    // global
    //  \- background
    //      \- option []
    //          \- box graphic
    //              \- text

    /** Reference to the gamepad controller. */
    private readonly gamepad: VirtualGamepad;

    /** Represents the currently selected option. */
    private cursor = new Slider();

    /** The timer which triggers animation movements.  */
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
            this.movementPulsar.reset();    // TODO Does this stop?
        }
    }

    /** Updates selector screen/world position depending on animation states. */
    private updateCursorPosition() {
        // TODO Calculate where selector should be.
    }

    /** Whether to draw the command menu to the screen. */
    get visible() {
        return this.graphics.visible;
    }
    set visible(b: boolean) {
        this.graphics.visible = b;
    }

    /** Whether to listen for gamepad inputs. */
    get enabled() {
        return this._enabled;
    }
    set enabled(b: boolean) {
        this.enabled = b;
    }

    /** The list of selectables as text/value pairs. */
    get options() {
        return this._options.slice();
    }
    set options(li: MenuOption[]) {
        this._options = li;
        // reconfigure box height/width
        
        this.cursor = new Slider({
            max: this._options.length,
            track: 'min',
            granularity: 1,
            looping: true,
            // mode: 'loop',
        });

        MENU_OPTION.width = this.getNewContentWidth();

        // Build options text display object
        this.optionsText.removeChildren();          // Empty options-text graphics container
        this._options.forEach( (op, idx) => {       // Add new options-text to graphics container
            // const gback = new PIXI.Square;

            // const gborders = new PIXI.Line?;

            const gtext = new PIXI.BitmapText(op.name, fonts.menu);
            const contentBox = MENU_OPTION.contentBox();
            gtext.transform.position.set(contentBox.x, contentBox.y);

            this.optionsText.addChild(gtext);
        });
    }

    /** Returns the text/value pair currently being selected over. */
    selectedOption() {
        return this._options[this.cursor.output];
    }

    /**  */
    private getNewContentWidth() {
        const tmp = new PIXI.BitmapText('', fonts.menu);
        const sizes = this._options.map( o => {tmp.text = o.name; return tmp.textWidth;} );
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