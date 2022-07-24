import { StateAssets } from "./StateAssets";
import { StateMaster } from "./StateMaster";
import { StateObject } from "./StateObject";


type DemoAssets = StateAssets & {
  one: number
};

type DemoOptions = {
  startWithHuge?: boolean
};

class DemoState extends StateObject<DemoAssets> {
  get type() { return DemoState; }
  get name(): string { return 'Demo'; }
  get revertible(): boolean { return true; }
  get skipOnUndo(): boolean { return true; }

  protected demoOptions?: DemoOptions;

  constructor(options?: DemoOptions) {
    super();
    this.demoOptions = options;
  }

  protected assert(): void {}
  protected configure(): void {
    this.advance(DemoState, new DemoState({startWithHuge: true}));
  }
  updateInput(): void {}
  prev(): void {}
}

const machine = new StateMaster({
  name: 'DemoMachine',
  assets: {
    resetAssets() {},
    destroy() {},
    suspendInteractivity() { return false; },
    one: 1
  },
  entryPoint: DemoState,
});
const demo = new DemoState();
