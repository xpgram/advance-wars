import { Game } from "../../../..";
import { ScreenShake } from "../../../camera/DisplacementAlgorithms";
import { AnimatedSpritePresets } from "../../../system/vfx-components/AnimatedSpritePresets";
import { AttackMethod, UnitClass } from "../../EnumTypes";
import { TrackCar } from "../../TrackCar";
import { BattleSceneControllers } from "../../turn-machine/BattleSceneControllers";
import { UnitObject } from "../../UnitObject";
import { MapLayer } from "../MapLayers";
import { TileEvent } from "./TileEvent";

interface BattleDamageEventOptions {
  attacker?: UnitObject;
  defender: UnitObject;
  damage: number;
  trackCar?: TrackCar;
  assets: BattleSceneControllers;
}

export class BattleDamageEvent extends TileEvent {

  protected options: BattleDamageEventOptions;

  private selfSetCameraAlg = false;


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

    if (attacker && attacker.hp > 0) {  // TODO !attacker.destroyed: boolean
      
      if (attacker.attackMethodFor(defender) === AttackMethod.Primary)
        attacker.ammo -= 1;
      if (attacker.withinCoZone)
        attacker.boardPlayer.increasePowerMeter(damageDealt);
      if (defender.hp === 0)
        attacker.rank += 1;
    }

    // Configure camera for shake ­— unless already done by a different controller
    this.selfSetCameraAlg = camera.algorithms.displacement === undefined;
    if (this.selfSetCameraAlg)
      camera.algorithms.displacement = new ScreenShake();

    // Null case
    if (damageDealt === 0) {
      this.finish();
      return;
    }

    // TODO Conform with AnimatedSpritePresets implementation.

    // World position variables
    const boardPos = defender.boardLocation;
    const worldPos = boardPos.multiply(Game.display.standardLength);

    // Determine animation variant
    const variants = {} as Record<UnitClass, string>;
    variants[UnitClass.Ground] = 'dry';
    variants[UnitClass.Naval]  = 'wet';
    variants[UnitClass.Air]    = 'air';

    const destructVariant = variants[defender.unitClass];
    const destructAnim = `explosion-${destructVariant}`;
    const damageAnim = `damage-hit`;

    const explodeSprite = (defender.hp === 0);
    const animName = (explodeSprite) ? destructAnim : damageAnim;

    // Get animation object
    const sheet = Game.scene.resources[`VFXSpritesheet`].spritesheet as PIXI.Spritesheet;
    const textures = sheet.animations[animName];
    const anim = AnimatedSpritePresets.explosion(textures);
    if (!explodeSprite) anim.animationSpeed = 1/2;

    // Configure animation settings
    anim.position.set(worldPos.x, worldPos.y);
    anim.play();
    anim.onComplete = () => {
      anim.destroy();
      this.finish();
    }

    // Configure unit settings
    if (defender.hp === 0) {
      defender.destroy();
      trackCar?.hide();
    }

    MapLayer('ui').addChild(anim);
  }

  protected update(): void {
    
  }

  protected destroy(): void {
    const { camera } = this.options.assets;

    if (this.selfSetCameraAlg)  // Protection against double-events unsetting shake immediately
      camera.algorithms.displacement = undefined;
  }
}