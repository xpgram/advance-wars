import { Common } from "../../CommonUtils";
import { StateObject } from "./StateObject";


/**  */
export class NullState<T> extends StateObject<T> {
  get type() { return NullState; }
  get name(): string { return 'Null'; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return true; }
  // protected advanceStates = Common.confirmType<NextState>() ({});
  protected assert(): void {}
  protected configureScene(): void {}
  updateInteractions(): void {}
  prev(): void {}
}