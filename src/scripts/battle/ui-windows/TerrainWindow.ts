import * as PIXI from "pixi.js";
import { InfoUI } from "./DisplayInfo";
import { SlidingWindow } from "./SlidingWindow";
import { Game } from "../../..";

export class TerrainWindow extends SlidingWindow {

    thumbnail = new PIXI.Container();
    name = new PIXI.BitmapText('', Game.app.loader.resources)

    constructor(options: SlidingWindowOptions) {
        // Change options here, if needed
        super(options);

        let thumbnail = InfoUI.displayObjects.terrainThumbnail;
        thumbnail.x = thumbnail.y = SlidingWindow.stdLength;

        let name = InfoUI.displayObjects.terrainName;
        name.x = 24; name.y = 3;

        let defBoost = InfoUI.displayObjects.terrainDefenseStars;
        defBoost.x = 24; defBoost.y = 16;

        let captureMeter = InfoUI.displayObjects.captureMeter;
        captureMeter.x = 60; captureMeter.y = 16;

        // Formal add
        this.displayContainer.addChild(thumbnail);
        this.displayContainer.addChild(name);
        this.displayContainer.addChild(defBoost);
        this.displayContainer.addChild(captureMeter);
    }
}

// Possible refactor:
// Why aren't I just creating the UI elements here? Why in InfoUI?
// They're not per se reusable.
// If segregation is important, I could put the 'create UI elements' block in a function.
// Eh, I dunno.
// What I have is fine for now.