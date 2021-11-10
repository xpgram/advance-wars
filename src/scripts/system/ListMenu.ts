import { Game } from "../..";
import { Slider } from "../Common/Slider";
import { Common } from "../CommonUtils";
import { VirtualGamepad } from "../controls/VirtualGamepad";
import { Observable } from "../Observable";
import { Pulsar } from "../timer/Pulsar";
import { ListMenuOption } from "./ListMenuOption";

type CursorSettings = {
  firstFrameInterval: number,
  frameInterval: number,
}

/** User-interactable UI element for seleting one of many options.
 * MenuWindow should be provided a list of MenuOptions with which to populate
 * itself and will return the value of the selected-over option upon request.
 */
export class ListMenu<X, Y> extends Observable {

  private settings = {
    /** The maximum length of the virtual page for list items. */
    pageSize: 0,
    /** The maximum length of list items viewable at one time. Default is all.
     * The starting index of the scroll window is pushed by the menu cursor. */
    scrollWindow: 0,
    /** The number of list items to maintain around the cursor, if possible.
     * Use this to prevent the cursor from being at the bottom of the view. Default is 0. */
    scrollWindowPadding: 0,
    /** Set this to true to treat pageSize like a skip number for fast scrolling. */
    extendPages: false,
  };

  private readonly gamepad: VirtualGamepad;

  private _listItems!: ListMenuOption<X, Y>[];
  private _displayedListItems!: ListMenuOption<X, Y>[];
  private _inputEnabled = true;

  /** Represents the currently selected option. */
  private cursor!: Slider;

  /** Scroll window position and length. */
  private scrollWindow: {
    index: number,
    height: number,
    padding: number,
  }

  /** The timer which triggers repeatable movements. */
  private movementPulsar: Pulsar;

  constructor(gp: VirtualGamepad, options?: {
    listItems?: ListMenuOption<X, Y>[],
    cursorSettings?: CursorSettings,
    pageSize?: number,
    scrollWindow?: number,
    scrollWindowPadding?: number,
    extendPages?: boolean,
  }) {
    super();

    // Setup option defaults
    this.settings = {
      ...this.settings,
      ...options,
    }

    // Configure
    this.gamepad = gp;
    this.setListItems(options?.listItems || []);

    // Add updater to global ticker.
    Game.scene.ticker.add(this.update, this);

    // Initiate timers
    this.movementPulsar = new Pulsar({
      firstInterval: options?.cursorSettings?.firstFrameInterval || 20,
      interval: options?.cursorSettings?.frameInterval || 6,
    },
      this.triggerCursorMovement,
      this
    );

    // Setup scroll window
    this.scrollWindow = {
      index: 0,
      height: this.settings.scrollWindow
        || this.settings.pageSize
        || this.cursor.max - 1,
      padding: this.settings.scrollWindowPadding || 0,
    }
  }

  /** Unlinks circular connections. */
  destroy() {
    this.clearListeners();
    Game.scene.ticker.remove(this.update, this);
  }

  private update() {
    this.updateCursor();
  }

  /** Update cursor state with gamepad input. */
  private updateCursor() {
    if (!this.inputEnabled)
      return;

    // Input polling.
    const { dpadUp, dpadDown, dpadLeft, dpadRight } = this.gamepad.button;
    const buttons = [dpadUp, dpadDown, dpadLeft, dpadRight];

    if (buttons.some( b => b.pressed )) {
      this.triggerCursorMovement();
      this.movementPulsar.start();
    }
    if (this.gamepad.axis.dpad.returned) {
      this.movementPulsar.stop();
    }
  }

  /** Triggers a cursor change according the held player inputs. */
  private triggerCursorMovement() {
    const { cursor, gamepad } = this;
    const view = this.scrollWindow;

    // Reposition cursor
    const ydir = gamepad.axis.dpad.point.y;
    const xdir = gamepad.axis.dpad.point.x * this.settings.pageSize;
    cursor.increment(ydir + xdir);

    // Reposition viewport
    if (cursor.output < view.index + view.padding)
      view.index = this.cursor.output - view.padding;
    if (cursor.output > view.index + view.height - view.padding)
      view.index = cursor.output - view.height + view.padding;

    this.updateListeners('move-cursor');
  }

  /** Enables the player interactivity listener. */
  enableInput() {
    this._inputEnabled = true;
  }

  /** Disables the player interactivity listener. */
  disableInput() {
    this._inputEnabled = false;
    this.movementPulsar.stop();
  }

  /** Whether this menu is interactable. */
  get inputEnabled() {
    return this._inputEnabled;
  }

  /** The list of selectables as key/value pairs. */
  get listItems() {
    // TODO Limit by page size, unless extend pages, then limit by scroll
    // I need page index via modulus
    // I need scroll window as... a product of minIndex=pageIndex, maxIndex=pageNext-height, pageNext might be the end of the list
    // If scroll window isn't outside these bounds, then it is whatever it is.
    // Gonna be a lot of consts in a row. That'll be the best way to do this.
    // 
    // I'm sure we'll do this tomorrow.
    return this._displayedListItems.slice();
  }

  /** Retriggers configuration of each list item to update which are included
   * and which are disabled. Will possibly update the options list. */
  retriggerListItems() {
    this._listItems.forEach( item => item.retrigger() );
    this._displayedListItems = this._listItems.filter( item => item.included );
    this.cursor = new Slider({
      max: this._displayedListItems.length,
      track: 'min',
      granularity: 1,
      looping: true,
      // mode: 'loop',    // TODO Slider refactor was unsuccessful.
    });
  }

  /** Sets a new list of menu options. It is recommended to use triggerInclude on each
   * list-option instead to automatically add or remove them from the menu. */
  setListItems(li: ListMenuOption<X, Y>[]) {
    this._listItems = li;
    this.retriggerListItems();
  }

  /** Returns the number index of the ListMenuOption currently being selected over. */
  get selectedIndex() {
    return this.cursor.output;
  }

  /** Returns the ListMenuOption currently being selected over. */
  get selectedOption() {
    return this._displayedListItems[this.selectedIndex];
  }

  /** Returns the value currently being selected over. */
  get selectedValue() {
    return this.selectedOption.value;
  }
}