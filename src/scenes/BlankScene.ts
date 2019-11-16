import { Scene } from "./Scene";

/**
 * This is scene default-state. Nothing is here.
 * In fact, something should be here. Some kind of visual signal that we are in
 * digital purgatory. Whatever.
 */
export class BlankScene extends Scene {
    protected loadStep(): void {
    }

    protected setupStep(): void {
    }

    protected updateStep(delta: number): void {
    }

    protected destroyStep(): void {
    }
}