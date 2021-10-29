import { Game } from "../..";
import { Slider } from "../Common/Slider";
import { VirtualGamepad } from "../controls/VirtualGamepad";
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
export class ListMenu<X, Y> {

  private readonly gamepad: VirtualGamepad;

  private _listItems!: ListMenuOption<X, Y>[];
  private _displayedListItems!: ListMenuOption<X, Y>[];
  private _inputEnabled = true;
  private cursorMovementCallback: () => void;

  /** Represents the currently selected option. */
  private cursor!: Slider;

  /** The timer which triggers repeatable movements. */
  private movementPulsar: Pulsar;

  constructor(gp: VirtualGamepad, options?: {
    listItems?: ListMenuOption<X, Y>[],
    cursorSettings?: CursorSettings,
    onMoveCursor?: () => void,
  }) {
    // Setup option defaults
    const _options = {
      listItems: [],
      cursorSettings: {
        firstFrameInterval: 20,
        frameInterval: 6,
      },
      onMoveCursor: () => { return; },
      ...options,
    }

    // Configure
    this.gamepad = gp;
    this.cursorMovementCallback = _options.onMoveCursor;
    this.setListItems(_options.listItems);

    // Add updater to global ticker.
    Game.scene.ticker.add(this.update, this);

    // Initiate timers
    this.movementPulsar = new Pulsar({
      firstInterval: _options.cursorSettings.firstFrameInterval,
      interval: _options.cursorSettings.frameInterval,
    },
      this.triggerCursorMovement,
      this
    );
  }

  /** Unlinks circular connections. */
  destroy() {
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
    const { dpadUp, dpadDown } = this.gamepad.button;
    if (dpadUp.pressed || dpadDown.pressed) {
      this.triggerCursorMovement();
      this.movementPulsar.start();
    }
    if (this.gamepad.axis.dpad.returned) {
      this.movementPulsar.stop();
    }
  }

  /** Triggers a cursor change according the held player inputs. */
  private triggerCursorMovement() {
    const dir = this.gamepad.axis.dpad.point.y;
    this.cursor.increment(dir);
    this.cursorMovementCallback();
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

  /** Returns the ListMenuOption currently being selected over. */
  get selectedOption() {
    return this._listItems[this.cursor.output];
  }

  /** Returns the value currently being selected over. */
  get selectedValue() {
    return this.selectedOption.value;
  }
}