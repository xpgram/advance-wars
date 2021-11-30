import { Spritesheet } from "pixi.js";
import { Game } from "../../../..";
import { Camera } from "../../../Camera";
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

export class SpeechBubbleEvent extends TileEvent {
  
  private options: SpeechBubbleEventOptions;

  private timer: Timer = new Timer(0.6);
  private image!: PIXI.Sprite;

  private readonly MaxScale = 2.5;
  private readonly IntroFrames = 3;

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
    const leftsideViewport = (camera.center.x > worldPos.x);

    const sheet = Game.scene.resources['UISpritesheet'].spritesheet as Spritesheet;
    const tex = sheet.textures[`bubble-${message}-${leftsideViewport ? 'right' : 'left'}.png`];
    this.image = new PIXI.Sprite(tex);

    worldPos.x += .5*tileSize;
    worldPos.y += .5*tileSize;

    this.image.position.set(worldPos.x, worldPos.y);
    this.image.anchor.set( ((leftsideViewport) ? 0 : 1), .5 );
    this.image.scale.set(this.MaxScale);
    this.image.alpha = 0;

    this.timer.start();

    if (message === 'repair') this.ratifyRepair();
    if (message === 'supply') this.ratifySupply();

    MapLayer('ui').addChild(this.image);
  }

  protected update(): void {
    this.image.scale.set(this.MaxScale - this.animSlider.output*(this.MaxScale-1));
    this.image.alpha = this.animSlider.output;

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