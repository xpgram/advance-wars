
/** Represents an individual selectable option of a MenuWindow. */
export class ListMenuOption<X, Y> {
  /** Descriptive object associated with the value. Typically this would be a string. */
  readonly key: X;
  /** The value actually being selected over by the user. */
  readonly value: Y;

  /** A function which should return true if this option is to be included in its menu.
   * Default function always returns true. */
  included: () => boolean = () => { return true; }

  /** A function which should return true if this option should not be selectable.
   * Default function always returns false. */
  disabled: () => boolean = () => { return false; }

  constructor(key: X, value: Y, options?: {
    triggerInclude?: () => boolean,
    triggerDisable?: () => boolean,
  }) {
    this.key = key;
    this.value = value;
    this.included = options?.triggerInclude || this.included;
    this.disabled = options?.triggerDisable || this.disabled;
  }
}