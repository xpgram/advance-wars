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

// TODO Scrolling along pages was planned, but never implemented.

/** User-interactable UI element for seleting one of many options.
 * MenuWindow should be provided a list of MenuOptions with which to populate
 * itself and will return the value of the selected-over option upon request.
 */
export class ListMenu<X, Y> extends Observable {

  private settings = {
    /** The maximum length of the virtual page for list items. */
    pageLength: 0,
    /** The number of list items to maintain around the cursor, if possible.
     * Use this to prevent the cursor from being at the bottom of the view. Default is 0. */
    pagePadding: 0,
    /** Set this to true to treat page-breaks as continuous.
     * @notimplemented Behave as if one page? That might work. */
    extendPages: false,
  };

  get pageLength() {
    return this.settings.pageLength || this._listSieve.length;
  }
  get pagePadding() { return this.settings.pagePadding; }
  get extendPages() { return this.settings.extendPages; }

  private readonly gamepad: VirtualGamepad;

  private _listReal!: ListMenuOption<X, Y>[];   // Global list of all items referenceable by menu.
  private _listSieve!: ListMenuOption<X, Y>[];  // Global list of all items filtered by their inclusion functions.
  private _listPage!: ListMenuOption<X, Y>[];   // List of items in current page view.
  private _inputEnabled = true;

  /** Represents the currently selected option of the current page. */
  private cursor!: Slider;
  /** Represents the currently selected page. */
  private pageCursor!: Slider;
  /** Limit for returnable items of the current list page. */
  private view!: {
    index: number,
    length: number,
    padding: number,
  }

  /** The timer which triggers repeatable movements. */
  private movementPulsar: Pulsar;

  constructor(gp: VirtualGamepad, options?: {
    listItems?: ListMenuOption<X, Y>[],
    cursorSettings?: CursorSettings,
    pageLength?: number,
    pagePadding?: number,
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
    this.movementPulsar = new Pulsar(
      {
        firstInterval: options?.cursorSettings?.firstFrameInterval || 20,
        interval: options?.cursorSettings?.frameInterval || 6,
      },
      this.triggerCursorMovement,
      this
    );
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
    const { cursor, pageCursor, gamepad, view } = this;

    // Reposition cursor
    const dir = gamepad.axis.dpad.point;
    cursor.increment(dir.y);
    if(dir.x !== 0) {
      pageCursor.increment(dir.x);
      this.setPage();
    }

    // Reposition viewport
    if (cursor.output < view.index + view.padding)
      view.index = this.cursor.output - view.padding;
    if (cursor.output > view.index + view.length - view.padding)
      view.index = cursor.output - view.length + view.padding;

    this.updateListeners('move-cursor');
  }

  /** Resets menu cursor to the first item of the first page. */
  resetCursor() {
    this.pageCursor.track = 0;
    this.setPage();
    this.cursor.track = 0;
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
    const { max, min } = Math;
    const { index, length } = this.view;
    const start = min(max(index, 0), this._listPage.length - length);
    return this._listPage.slice(start, start+length);
  }

  /** Sets a new list of menu options. It is recommended to use triggerInclude on each
   * list-option instead to automatically add or remove them from the menu. */
   setListItems(li: ListMenuOption<X, Y>[]) {
    this._listReal = li;
    this.retriggerListItems();
  }

  /** Retriggers configuration of each list item to update which are included
   * and which are disabled. Will possibly update the options list. */
  retriggerListItems() {
    this._listReal.forEach( item => item.retrigger() );
    this._listSieve = this._listReal.filter( item => item.included );

    const max = Math.floor(this._listSieve.length / this.pageLength);
    const idx = (this.pageCursor)
      ? Math.min(this.pageCursor.output, max)
      : 0;
    this.pageCursor = new Slider({
      max,
      track: idx,
      granularity: 1,
      looping: true,
    });
    this.setPage();
  }

  /** Sets the current page of items. */
  private setPage() {
    const start = this.pageCursor.output * this.pageLength;
    const end = Math.min(start+this.pageLength, this._listSieve.length);
    this._listPage = this._listSieve.slice(start, end);

    const idx = (this.cursor)
      ? Math.min(this.cursor.output, end-start)
      : 0;
    this.cursor = new Slider({
      max: this._listPage.length,
      track: idx,
      granularity: 1,
      looping: true,
      // mode: 'loop',    // TODO Slider refactor was unsuccessful.
    });
    this.view = {
      index: 0,
      length: this.cursor.max,
      padding: 0, // this.pagePadding,
    }
  }

  /** Returns the number index of the ListMenuOption currently being selected over. */
  get selectedIndex() {
    return this.cursor.output;
  }

  /** Returns the ListMenuOption currently being selected over. */
  get selectedOption() {
    return this._listPage[this.selectedIndex];
  }

  /** Returns the value currently being selected over. */
  get selectedValue() {
    return this.selectedOption.value;
  }
}