import { Game } from "../../../..";
import { ScreenShake } from "../../../camera/DisplacementAlgorithms";
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
  private vfx!: PIXI.AnimatedSprite;
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
      if (defender.CoOnBoard)
        defender.boardPlayer.CoUnitDestroyedCallback();
      defender.destroy();
      trackCar?.hide();
    }

    MapLayer('ui').addChild(this.vfx);
  }

  protected update(): void {
    // Update VFX settings
    const lastidx = this.vfx.textures.length - 1;
    const curidx = this.vfx.currentFrame;
    const progress = curidx / lastidx;
    this.vfx.alpha = 1-Math.max(progress-.5, 0)/.65;

    // Signal finish
    if (curidx === lastidx)
      this.finish();
  }

  protected destroy(): void {
    const { camera } = this.options.assets;

    if (this.selfSetCameraAlg)  // Protection against double-events unsetting shake immediately
      camera.algorithms.displacement = undefined;

    this.vfx?.destroy();
    this.vfx = undefined;
    //@ts-expect-error
    this.options = undefined;
  }
}