import { InfoUI } from "./DisplayInfo";
import { SlidingWindow } from "./SlidingWindow";

export class DetailWindow extends SlidingWindow {

    constructor(options: SlidingWindowOptions) {
        options.height = 165;
        options.show = false;   // Should InfoWindowSystem change this? I dunno.
        options.drawMask = true;
        super(options);

        let name = InfoUI.displayObjects.articleHeader;
        name.x = 8; name.y = 4;
        name.tint = 0xE3E6E9;

        let picture = InfoUI.displayObjects.articleIllustration;
        picture.x = 8; picture.y = 12;

        let description = InfoUI.displayObjects.articleBody;
        description.x = 8; description.y = 58;
        description.maxWidth = this.width - 16;

        // Formal add
        this.displayContainer.addChild(name);
        this.displayContainer.addChild(picture);
        this.displayContainer.addChild(description);
        //this.displayContainer.addChild(income);
        //this.displayContainer.addChild(repairType);

        // Set up move cost table — Order is important to column organization (0–3: side A, 4–7: side B)
        let tablePos = {x: 8, y: 128};
        let moveCosts = [
            {label: InfoUI.displayObjects.articleStats.moveCostLabel.infantry,
            value: InfoUI.displayObjects.articleStats.moveCost.infantry},

            {label: InfoUI.displayObjects.articleStats.moveCostLabel.tireA,
            value: InfoUI.displayObjects.articleStats.moveCost.tireA},

            {label: InfoUI.displayObjects.articleStats.moveCostLabel.tireB,
            value: InfoUI.displayObjects.articleStats.moveCost.tireB},

            {label: InfoUI.displayObjects.articleStats.moveCostLabel.ship,
            value: InfoUI.displayObjects.articleStats.moveCost.ship},

            {label: InfoUI.displayObjects.articleStats.moveCostLabel.mech,
            value: InfoUI.displayObjects.articleStats.moveCost.mech},

            {label: InfoUI.displayObjects.articleStats.moveCostLabel.tread,
            value: InfoUI.displayObjects.articleStats.moveCost.tread},

            {label: InfoUI.displayObjects.articleStats.moveCostLabel.air,
            value: InfoUI.displayObjects.articleStats.moveCost.air},

            {label: InfoUI.displayObjects.articleStats.moveCostLabel.transport,
            value: InfoUI.displayObjects.articleStats.moveCost.transport},
        ];
        for (let i = 0; i < moveCosts.length; i++) {
            let keyShift = (i < moveCosts.length / 2) ? 0 : 38; // Sets up two columns
            let valueShift = 32;                                // The indent from label to value
            let rowShift = 8;                                   // Line height

            moveCosts[i].label.x = tablePos.x + keyShift;
            moveCosts[i].label.y = tablePos.y + (i * rowShift);
            moveCosts[i].value.x = moveCosts[i].label.x + valueShift;
            moveCosts[i].value.y = moveCosts[i].label.y;

            this.displayContainer.addChild(moveCosts[i].label);
            this.displayContainer.addChild(moveCosts[i].value);
        }
    }
}