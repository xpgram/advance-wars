import { StateAssets } from "./StateAssets";
import { StateObject } from "./StateObject";

/** Default state for state machines which have no states in their stack.  
 * As this state is empty, a state machine which returns this state as its
 * currently active object is essentially non-functional. */
export class NullState<T extends StateAssets> extends StateObject<T> {
  get type() { return NullState<T>; }
  get name(): string { return 'Null'; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return true; }
  protected configure(): void {}
}