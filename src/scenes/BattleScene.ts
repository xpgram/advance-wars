import * as PIXI from "pixi.js";
import { Scene } from "./Scene";
import { Map } from "../scripts/battle/Map";
import { Game } from "..";

var fpsText: PIXI.BitmapText;
var time: number = 0;

/**
 * @author Dei Valko
 * @version 0.2.0
 */
export class BattleScene extends Scene {

    map: Map;

    loadStep(): void {
        this.linker.push({name: 'NormalMapTilesheet', url: 'assets/sheets/normal-map-tiles-sm.json'});
        this.linker.push({name: 'TecTacRegular', url: 'assets/TecTacRegular.xml'});
    }

    setupStep(): void {
        this.map = new Map(18, 12);
        this.map.log();

        // Add an FPS ticker to measure performance
        // TODO Move this into a Debug class or something. Instantiate it in Game or Scene.
        // TODO Include a build number.
        let graphics = new PIXI.Graphics(); //(0, 160-10, 12, 8);
        graphics.beginFill(0x000000);
        graphics.alpha = 0.25;
        graphics.drawRect(0, Game.display.renderHeight-10, 14, 10);
        Game.debugHud.addChild(graphics);

        fpsText = new PIXI.BitmapText("", { font: '8px TecTacRegular', align: 'left'});
        fpsText.x = 2;
        fpsText.y = Game.display.renderHeight - 9;
        Game.debugHud.addChild(fpsText);
    }

    updateStep(delta: number): void {
        time += delta;
        if (time > 5) {
            time -= 5;
            if (fpsText)
                fpsText.text = `${Math.floor(Game.app.ticker.FPS)}`;
        }
    }

    destroyStep(): void {
    }
}