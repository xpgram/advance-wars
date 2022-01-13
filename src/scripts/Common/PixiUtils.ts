import { Game } from "../..";

/**  */
export module PixiUtils {

  /**  */
  export function SnapshotContainerObject(container: PIXI.Container): PIXI.Texture {
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

}