import { PIXI } from "../../../../constants";
import { Game } from "../../../..";
import { Camera } from "../../../camera/Camera";
import { Point } from "../../../Common/Point";
import { Slider } from "../../../Common/Slider";
import { Timer } from "../../../timer/Timer";
import { UnitObject } from "../../UnitObject";
import { MapLayer } from "../MapLayers";
import { TileEvent } from "./TileEvent";

interface SpeechBubbleEventOptions {
  message: 'supply' | 'repair' | 'ambush';
  actor: UnitObject;
  repairHp?: number,        // This is mega-dumb. Split this into an inheriting RepairEvent
  repairCost?: number,      // like I had before—make these numbers mandatory.
  camera: Camera;
}

// TODO Tweens instead? Refactor for readability?

export class SpeechBubbleEvent extends TileEvent {
  
  private options: SpeechBubbleEventOptions;

  private timer: Timer = new Timer(0.6);
  private image!: PIXI.Sprite;

  private readonly MaxScale = 2.5;
  private readonly IntroFrames = 3;
  private shake = false;
  private position = new Point();

  private animSlider = new Slider({
    granularity: 1 / this.IntroFrames,
  });

  constructor(options: SpeechBubbleEventOptions) {
    super(options.actor.boardLocation);
    this.options = {...options};
  }

  private ratifySupply() {
    const { actor } = this.options;
    actor.resupply();
  }

  private ratifyRepair() {
    const { actor, repairHp, repairCost } = this.options;
    const player = actor.boardPlayer;
    actor.resupply();
    actor.hp += repairHp || 0;
    player.expendFunds(repairCost || 0);
  }

  protected create(): void {
    const { message, actor, camera } = this.options;
    const tileSize = Game.display.standardLength;

    const boardPos = actor.boardLocation;
    const worldPos = boardPos.multiply(tileSize);
    const view = camera.transform.worldRect();
    const leftsideViewport = (view.center.x > worldPos.x);

    const sheet = Game.scene.resources['UISpritesheet'].spritesheet as PIXI.Spritesheet;
    const tex = sheet.textures[`bubble-${message}-${leftsideViewport ? 'right' : 'left'}.png`];
    this.image = new PIXI.Sprite(tex);

    worldPos.x += ((leftsideViewport) ? .6 : .4)*tileSize;
    worldPos.y += .5*tileSize;

    this.image.position.set(worldPos.x, worldPos.y);
    this.image.anchor.set( ((leftsideViewport) ? 0 : 1), .5 );
    this.image.scale.set(this.MaxScale);
    this.image.alpha = 0;

    this.timer.startReset();

    if (message === 'repair') this.ratifyRepair();
    if (message === 'supply') this.ratifySupply();
    if (message === 'ambush') this.shake = true;

    this.position.set(this.image.position);

    MapLayer('ui').addChild(this.image);
  }

  protected update(): void {
    this.image.scale.set(this.MaxScale - this.animSlider.output*(this.MaxScale-1));
    this.image.alpha = this.animSlider.output;

    if (this.shake && this.animSlider.equalsMax()) {
      const clock = Math.sin(this.timer.elapsed*12*Math.PI);
      const x = Number(clock > 0);
      this.image.x = this.position.x + x;
    }

    this.animSlider.increment();

    if (this.timer.finished)
      this.finish();
  }

  protected destroy(): void {
    this.image?.destroy();
    //@ts-expect-error
    this.image = undefined;
    //@ts-expect-error
    this.options = undefined;
  }
}