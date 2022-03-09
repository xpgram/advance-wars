import { Ease, EaseFunction } from "../../Common/EaseMethod";

// TODO There are two modules here; should they be in separate files?

/** Shortcut methods for common configurations of AnimatedSprite VFX. */
export module AnimatedSpriteConfigurators {

  /** Returns a PIXI.AnimatedSprite preconfigured to fade-out as it plays.
   * Auto-destructs on completion. `.play()` must be called on the returned
   * object to begin the effect.
   **/
  export function progressiveTransparency(o: {
    textures: PIXI.Texture[],
    /** Speed is `1/f`, where f is the number of frames between texture swaps. Default 1/4. */
    animationSpeed?: number,
    /** The alpha value of the final frame of animation. Must be in the range 0–1 to be meaningful. Default 0.1 */
    alphaFloor?: number,
    /** The transition function between full opacity and the final alpha value. Default linear. */
    easeMethod?: EaseFunction,
  }) {
    const anim = new PIXI.AnimatedSprite(o.textures);
    anim.animationSpeed = o.animationSpeed ?? .25;
    anim.loop = false;
    anim.onFrameChange = () => {
      const ease = o.easeMethod ?? ((n: number) => n);
      const lim = anim.textures.length || 1;  // positive number > 0
      const alphaRange = 1 - (o.alphaFloor ?? 0.1);

      const prog = ease(anim.currentFrame / lim);
      anim.alpha = 1 - prog*alphaRange;
    }
    anim.onComplete = () => {
      anim.destroy();
    }
    return anim;
  }

}

/** Preset configurations for common AnimatedSprite VFX. */
export module AnimatedSpritePresets {

  /** Returns an AnimatedSprite configured for explosion-type effects.
   * Self-destructs on completion. */
  export function explosion(textures: PIXI.Texture[]) {
    return AnimatedSpriteConfigurators.progressiveTransparency({
      textures,
      animationSpeed: 1/5,
      alphaFloor: .35,
      easeMethod: Ease.quad.in,
    })
  }

}