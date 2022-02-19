import { Game } from "../..";
import { Debug } from "../DebugUtils";

/** Common functions to be used with the Pixi WebGL framework. */
export module PixiUtils {

  /** Returns a rendered texture of the given container object. */
  export function snapshotContainerObject(container: PIXI.Container): PIXI.Texture {
    const canvas = PIXI.RenderTexture.create(
      container.x + container.width,
      container.y + container.height,
    );
    Game.renderer.render(container,
      {
        renderTexture: canvas
      }
    );
    return canvas;
  }

  /** Mutates the given BitmapText object so its text field is no longer than the given max pixel width.
   * Returns the mutated BitmapText object. */
  export function limitBitmapTextToWidth(gtext: PIXI.BitmapText, maxWidth: number): PIXI.BitmapText {
    Debug.assert(maxWidth >= 1, `Width limit cannot be less than 1 pixel.`);

    while (gtext.width > maxWidth)
      gtext.text = gtext.text.slice(0,-1);

    return gtext;
  }

}