
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

export class MenuWindow /* extends ??? */ {

    readonly transform = new LowResTransform();
    private readonly graphics = new PIXI.Container();
    private readonly background = new PIXI.Container();
    private readonly optionsText = new PIXI.Container();

    // How do I determine/enforce an option is disabled/greyed-out?
    // I think optionsGraphics = Container() needs to be optionsGraphics = container[]

    // global
    //  \- background
    //      \- option []
    //          \- box graphic
    //          \- text

    private readonly gamepad: VirtualGamepad;

    private cursor = new Slider();

    private _options: MenuOption[] = [];
    private _enabled = true;

    constructor(gp: VirtualGamepad, ui: PIXI.Container) {
        // Needed references:
        //   gamepad
        //   PIXI.Container to append itself

        // Connect graphical peripheries
        this.transform.object = this.graphics;
        ui.addChild(this.graphics);

        //
        this.gamepad = gp;

        // Invoke options configurer
        this.options = [];

        //
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

    private updateCursor() {
        if (this.enabled) {
            if (this.gamepad.button.dpadUp.pressed)
                this.cursor.decrement();
            else if (this.gamepad.button.dpadDown.pressed)
                this.cursor.increment();
        }
    }

    private updateCursorPosition() {
        
    }

    /**  */
    get visible() {
        return this.graphics.visible;
    }
    set visible(b: boolean) {
        this.graphics.visible = b;
    }

    /**  */
    get enabled() {
        return this._enabled;
    }
    set enabled(b: boolean) {
        this.enabled = b;
    }

    /**  */
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

    /**  */
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