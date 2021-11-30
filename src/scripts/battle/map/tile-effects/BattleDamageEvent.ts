import { Game } from "../../../..";
import { Camera } from "../../../Camera";
import { Point } from "../../../Common/Point";
import { Slider } from "../../../Common/Slider";
import { AttackMethod, UnitClass } from "../../EnumTypes";
import { TrackCar } from "../../TrackCar";
import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { UnitObject } from "../../UnitObject";
import { MapLayer } from "../MapLayers";
import { TileEvent } from "./TileEvent";

interface BattleDamageEventOptions {
  attacker: UnitObject;
  defender: UnitObject;
  damage: number;
  trackCar?: TrackCar;
  assets: BattleSceneControllers;
}

export class BattleDamageEvent extends TileEvent {

  protected options: BattleDamageEventOptions;
  private vfx!: PIXI.AnimatedSprite;

  private cameraPoint!: Point;
  private cameraFollowAlgorithmSwap!: ((camera: Camera) => void) | null;
  private screenShakeSlider = new Slider({
    max: 4,
    track: 'max',
    granularity: 1/4,
    shape: v => ((v % 2 === 0) ? v : -v)*.5,
  });

  constructor(options: BattleDamageEventOptions) {
    super(options.defender.boardLocation);
    this.options = options;
  }

  protected create(): void {
    const { map, camera } = this.options.assets;
    const { attacker, defender, damage, trackCar } = this.options;

    // Calculate damage results
    const damageDealt = Math.min(defender.hp, damage);
    defender.hp -= damage;

    if (attacker.hp > 0) {  // TODO !attacker.destroyed: boolean
      if (attacker.attackMethodFor(defender) === AttackMethod.Primary)
        attacker.ammo -= 1;
      if (map.squareAt(attacker.boardLocation).COAffectedFlag)
        attacker.boardPlayer.increasePowerMeter(damageDealt);
      if (defender.hp === 0)
        attacker.rank += 1;
    }

    // Null case
    if (damageDealt === 0) {
      this.finish();
      return;
    }

    // World position variables
    const boardPos = defender.boardLocation;
    const worldPos = boardPos.multiply(Game.display.standardLength);

    // Determine animation variant
    const destructVariant = (defender.unitClass === UnitClass.Naval) ? 'wet' : 'dry';
    const destructAnim = `explosion-${destructVariant}`;
    const damageAnim = `damage-hit`;

    const explodeSprite = (defender.hp === 0);
    const anim = (explodeSprite) ? destructAnim : damageAnim;

    // Get animation object
    const sheet = Game.scene.resources[`VFXSpritesheet`].spritesheet as PIXI.Spritesheet;
    const textures = sheet.animations[anim];
    this.vfx = new PIXI.AnimatedSprite(textures);

    // Configure animation settings
    this.vfx.position.set(worldPos.x, worldPos.y);
    this.vfx.animationSpeed = (explodeSprite) ? 1/4 : 1;
    this.vfx.loop = false;
    this.vfx.play();

    // Configure unit settings
    if (defender.hp === 0) {
      defender.destroy();
      trackCar?.hide();
    }

    // Configure camera for shake
    this.cameraPoint = camera.pos;
    this.cameraFollowAlgorithmSwap = camera.followAlgorithm;
    camera.followAlgorithm = function(){};

    MapLayer('ui').addChild(this.vfx);
  }

  protected update(): void {
    const { camera } = this.options.assets;

    // Update VFX settings
    const lastidx = this.vfx.textures.length - 1;
    const curidx = this.vfx.currentFrame;
    const progress = curidx / lastidx;
    this.vfx.alpha = 1-Math.max(progress-.5, 0)/.65;

    // Update camera settings
    const curPoint = this.cameraPoint.add(0, this.screenShakeSlider.output);
    camera.pos = curPoint;
    this.screenShakeSlider.decrement();

    // Signal finish
    if (curidx === lastidx)
      this.finish();
  }

  protected destroy(): void {
    const { camera } = this.options.assets;

    camera.pos = this.cameraPoint;
    camera.followAlgorithm = this.cameraFollowAlgorithmSwap;

    this.vfx?.destroy();
    this.vfx = undefined;
    //@ts-expect-error
    this.options = undefined;
  }
}