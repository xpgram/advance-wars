import { Game } from "../../..";
import { Point } from "../../Common/Point";
import { Slider } from "../../Common/Slider";
import { Color } from "../../CommonUtils";
import { Pulsar } from "../../timer/Pulsar";

type Rectangle = PIXI.Rectangle;
const Rectangle = PIXI.Rectangle;

/**  */
export class MenuCursor {

  /** Graphics container. */
  readonly sprite = new PIXI.Container();

  readonly settings = {
    /** The width of the cursor's borders. */
    thickness: 2,
    /** The single-shade color of the selection cursor. */
    color: Color.HSV(166,100, 80),
    /** The number of frames before settling from old to new position. */
    motionFrames: 3,
    /** The number of frames between pulse animation frame updates. */
    pulseFrameInterval: 3,
  }

  /** The on-screen position and dimensions of the cursor. */
  get rect() { return this.goalPose; }
  set rect(p: Rectangle) {
    this.lastPose = this.goalPose;  // Technically this grows the bounds by settings.thickness, but it probably doesn't matter.
    this.goalPose = p;
    this.motionSlider.track = 'min';
  }
  private goalPose = new Rectangle();
  private lastPose = new Rectangle();

  /** Used to smoothly transition between poses. */
  private motionSlider = new Slider({
    track: 'max',
    granularity: 1 / this.settings.motionFrames,
    shape: v => Math.sqrt(v),
  });

  /** Used to pick an animation frame for the pulse animation. */
  private animSlider = new Slider({
    max: 3,
    track: 'max',
    granularity: 1 / this.settings.pulseFrameInterval,
    shape: v => Math.floor(v),
  });

  /** Retriggers the pulse animation at a set interval. */
  private animPulsar = new Pulsar(
    {
      firstInterval: 20,
      interval: 40,
    },
    () => { this.animSlider.track = 'min' },
    this
  )

  constructor(parent?: PIXI.Container) {
    parent?.addChild(this.sprite);
    this.animPulsar.start();
    Game.scene.ticker.add(this.update, this);
  }

  destroy() {
    this.sprite.destroy();
    this.animPulsar.destroy();
    Game.scene.ticker.remove(this.update, this);
  }

  /** Update dimensions and redraw the graphic. */
  private update() {
    this.motionSlider.increment();
    this.animSlider.increment();
    this.updateFrame();
  }

  /** Updates the cursor graphics. */
  private updateFrame() {
    if (!this.sprite.visible)
      return;

    // Split dimension rects
    const goalP = new Point(this.goalPose);
    const goalD = new Point(this.goalPose.width, this.goalPose.height);
    const lastP = new Point(this.lastPose);
    const lastD = new Point(this.lastPose.width, this.lastPose.height);

    // TODO Interpolation is broken.
    // Or maybe it was get bounds.

    // Get real position: interpolate between old and new.
    const position = goalP
      .subtract(lastP)
      .multiply(this.motionSlider.output)
      .add(lastP);
    const dimensions = goalD
      .subtract(lastD)
      .multiply(this.motionSlider.output)
      .add(lastD);

    // Get pulse frame: how many pixels to shrink area by.
    const shrinkValues = [1,2,1,0];
    const shrink = shrinkValues[this.animSlider.output];

    /* Draw */

    const thick = this.settings.thickness;
    const g = new PIXI.Graphics();
    
    // Draw a bordering rectangle
    g.beginFill(this.settings.color);
    g.drawRect(
      position.x - thick + shrink,
      position.y - thick + shrink,
      dimensions.x + 2*thick - 2*shrink,
      dimensions.y + 2*thick - 2*shrink
    );
    g.endFill();

    // Cut a hole in the middle; leave bordering thickness
    g.beginHole();
    g.drawRect(
      position.x + shrink,
      position.y + shrink,
      dimensions.x - 2*shrink,
      dimensions.y - 2*shrink
    );
    g.endHole();

    // Final
    this.sprite.removeChildren();
    this.sprite.addChild(g);
  }

  /** Teleports the cursor to wherever it is currently moving toward. */
  skipMotion() {
    this.motionSlider.track = 'max';

    // I'm treating this function like a full reset.
    this.animSlider.track = 'max';
    this.animPulsar.reset();
  }
}