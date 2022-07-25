

export interface StateAssets {

  /** Used to call component update methods. */
  update(): void;

  /** Returns true if the state machine should 'wait' until scene assets
   * yield. For example, this function may return `true` while `assets.camera`
   * has a subject `NotInView`. */
  suspendInteractivity(): boolean;

  /** Used to set default UI and system behaviors between state objects. */
  resetAssets(): void;
  
  /** Used to disassemble assets references. */
  destroy(): void;
}