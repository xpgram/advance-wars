import { StateMaster } from "./StateMaster";
import { StateObject } from "./StateObject";


// TODO {one: number} has no properties in common with StateAssets. But... why does it need any? They're all optional.
type DemoAssets = {suspendInteractivity: () => boolean, one: number};
type DemoOptions = {startWithHuge?: boolean};

export class DemoState extends StateObject<DemoAssets> {
  get type() { return DemoState; }
  get name(): string { return 'Demo'; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return true; }
  // protected advanceStates = Common.confirmType<NextState>() ({});

  protected demoOptions?: DemoOptions;

  constructor(options?: DemoOptions) {
    super();
    this.demoOptions = options;
  }

  protected assert(): void {}
  protected configureScene(): void {
    this.advance(DemoState, new DemoState({startWithHuge: true}));
  }
  updateInteractions(): void {}
  prev(): void {}
}

const machine = new StateMaster(DemoState, {suspendInteractivity(){return false;}, one: 1});
const demo = new DemoState();
