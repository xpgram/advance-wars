import { StateConstructorData, StateMaster } from "./StateMaster";
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

  constructor(machine: StateMaster<DemoAssets>, options?: DemoOptions) {
    super(machine);
    this.demoOptions = options;
  }

  protected assert(): void {}
  protected configureScene(): void {}
  updateInteractions(): void {}
  prev(): void {}
}

const machine = new StateMaster(DemoState, {suspendInteractivity(){return false;}, one: 1});
const demo = new DemoState(machine);

const demo2 = <StateConstructorData<DemoAssets,DemoOptions>>{
  stateType: DemoState,
  data: {startWithHuge},
}

machine.advanceT({
  stateType: DemoState,
  data: {}
});