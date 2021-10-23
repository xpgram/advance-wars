import { ControlScript } from "../../ControlScript";
import { VirtualGamepad } from "../../controls/VirtualGamepad";
import { Slider } from "../../Common/Slider";
import { Camera } from "../../Camera";
import { Game } from "../../..";

export class CameraZoom extends ControlScript {

    readonly zoomOutMaxAdditionalTiles = 10;
    
    private gamepad: VirtualGamepad;
    private camera: Camera;

    private zoomSlider = new Slider({
        track: 'max',
        granularity: 0.1
    });

    defaultEnabled() { return true; }

    constructor(gp: VirtualGamepad, camera: Camera) {
        super();

        this.gamepad = gp;
        this.camera = camera;
    }

    protected enableScript(): void {
        
    }

    protected updateScript(): void {
        let w1 = Game.display.renderWidth;
        let w2 = w1 + this.zoomOutMaxAdditionalTiles*Game.display.standardLength;
        let widthsRatio = w1/w2;  // Ratio between the two desired pixel-width views of the map.

        if (this.gamepad.button.Y.pressed)
            this.zoomSlider.incrementFactor *= -1;

        this.zoomSlider.increment();

        // Camera zoom is the widthsRatio (out) or 1 (in), transition-smoothed by zoomSlider.
        this.camera.zoom = (widthsRatio) + ((1 - widthsRatio) * this.zoomSlider.output);
    }

    protected disableScript(): void {
        
    }
}