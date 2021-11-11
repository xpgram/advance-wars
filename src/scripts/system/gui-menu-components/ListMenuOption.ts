
/** Represents an individual selectable option of a MenuWindow. */
export class ListMenuOption<X, Y> {
  /** Descriptive object associated with the value. Typically this would be a string. */
  readonly key: X;
  /** The value actually being selected over by the user. */
  readonly value: Y;

  /** A function which should return true if this option is to be included in its menu.
   * Default function always returns true. */
  private triggerInclude: () => boolean = () => true;

  /** A function which should return true if this option should not be selectable.
   * Default function always returns false. */
  private triggerDisable: () => boolean = () => false;

  /** Whether this option should be included in the list. */
  get included() { return this._included; }
  private _included: boolean = true;

  /** Whether this option should be selectable. */
  get disabled() { return this._disabled; }
  private _disabled: boolean = false;

  constructor(key: X, value: Y, options?: {
    triggerInclude?: () => boolean,
    triggerDisable?: () => boolean,
  }) {
    this.key = key;
    this.value = value;
    this.triggerInclude = options?.triggerInclude || this.triggerInclude;
    this.triggerDisable = options?.triggerDisable || this.triggerDisable;
  }

  /** Re-evaluates list-include and list-disable settings for this option. */
  retrigger() {
    this._included = this.triggerInclude();
    this._disabled = this.triggerDisable();
  }
}