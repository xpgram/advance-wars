
/** User-interactable UI element for seleting one of many options.
 * MenuWindow should be provided a list of MenuOptions with which to populate
 * itself and will return the value of the selected-over option upon request.
 */
export class ListMenu {

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