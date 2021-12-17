import { ControlScript } from "../../ControlScript";
import { Slider } from "../../Common/Slider";
import { Game } from "../../..";

export class CameraZoom extends ControlScript {

    readonly zoomOutMaxAdditionalTiles = 12;

    private zoomSlider = new Slider({
        track: 'max',
        granularity: 0.1
    });

    defaultEnabled() { return true; }

    protected enableScript(): void {
        
    }

    protected updateScript(): void {
        const { gamepad, camera } = this.assets;

        let w1 = Game.display.renderWidth;
        let w2 = w1 + this.zoomOutMaxAdditionalTiles*Game.display.standardLength;
        let widthsRatio = w1/w2;  // Ratio between the two desired pixel-width views of the map.

        if (gamepad.button.Y.pressed)
            this.zoomSlider.incrementFactor *= -1;

        this.zoomSlider.increment();

        // Camera zoom is the widthsRatio (out) or 1 (in), transition-smoothed by zoomSlider.
        camera.zoom = (widthsRatio) + ((1 - widthsRatio) * this.zoomSlider.output);
    }

    protected disableScript(): void {
        
    }
}