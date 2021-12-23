import { ControlScript } from "../../ControlScript";
import { Slider } from "../../Common/Slider";
import { Game } from "../../..";

export class CameraZoom extends ControlScript {

  readonly zoomOutTiles = [0, 10, 24];

  readonly zoomSlider = new Slider({
    max: this.zoomOutTiles.length,
    granularity: 1,
    looping: true,
  });

  defaultEnabled() { return true; }

  protected enableScript(): void {

  }

  protected updateScript(): void {
    const { gamepad, camera } = this.assets;

    if (!gamepad.button.Y.pressed)
      return;

    this.zoomSlider.increment();
    
    const additionalTiles = this.zoomOutTiles[this.zoomSlider.output];
    const tileSize = Game.display.standardLength;

    const w1 = Game.display.renderWidth;
    const w2 = w1 + additionalTiles * tileSize;
    const widthsRatio = w1 / w2;  // Ratio between the two desired pixel-width views of the map.

    camera.transform.zoomToPoint(widthsRatio, camera.getFocalPoint());
  }

  protected disableScript(): void {

  }
}