import { StateObject } from "./StateObject";


export class DemoState extends StateObject<{one: number}> {
  get type() { return DemoState; }
  get name(): string { return 'Demo'; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return true; }
  // protected advanceStates = Common.confirmType<NextState>() ({});
  protected assert(): void {}
  protected configureScene(): void {}
  updateInteractions(): void {}
  prev(): void {}
}