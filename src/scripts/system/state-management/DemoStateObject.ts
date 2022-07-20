import { StateObject } from "./StateObject";


// TODO {one: number} has no properties in common with StateAssets. But... why does it need any? They're all optional.

export class DemoState extends StateObject<{suspendInteractivity(): boolean, one: number}> {
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