import { InfoUI } from "./DisplayInfo";
import { SlidingWindow } from "./SlidingWindow";

export class UnitWindow extends SlidingWindow {

    constructor(options: SlidingWindowOptions) {
        // Change options here, if needed
        super(options);

        let thumbnail = InfoUI.displayObjects.unitThumbnail;
        thumbnail.x = thumbnail.y = SlidingWindow.stdLength;

        let name = InfoUI.displayObjects.unitName;
        name.x = 24; name.y = 3;

        let hpMeter = InfoUI.displayObjects.unitHPMeter;
        hpMeter.x = 24; hpMeter.y = 16;

        let gasMeter = InfoUI.displayObjects.unitGasMeter;
        gasMeter.x = 48; gasMeter.y = 16;

        let ammoMeter = InfoUI.displayObjects.unitAmmoMeter;
        ammoMeter.x = 72; ammoMeter.y = 16;

        // Loaded 1
        //x = 0; y = -16;

        // Loaded 2
        //x = 16; y = -16;

        // Formal add
        this.displayContainer.addChild(thumbnail);
        this.displayContainer.addChild(name);
        this.displayContainer.addChild(hpMeter);
        this.displayContainer.addChild(gasMeter);
        this.displayContainer.addChild(ammoMeter);
    }
}