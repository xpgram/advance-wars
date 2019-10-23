import * as PIXI from "pixi.js";
import { Game } from "..";

/**
 * Populates a PIXI.Container with performance information, among other things.
 * Also, toggleable. (That is, when I add controller/keyboard support.)
 * 
 * @author Dei Valko
 * @version 0.1.0
 */
 export class DebugLayer {
    
    clock: number = 0;

    layer: PIXI.Container;

    fpsBackground: PIXI.Graphics;
    fpsText: PIXI.BitmapText;

    constructor() {
        this.layer = new PIXI.Container();

        // FIXME I think what's happening is the battle-scene loader is interrupting this one. loader.reset, maybe.
        Game.app.loader.add('debug-regular', 'assets/TecTacRegular.xml');
        Game.app.loader.load().onComplete.add( () => {
            // FPS Background
            this.fpsBackground = new PIXI.Graphics(); //(0, 160-10, 12, 8);
            this.fpsBackground.beginFill(0x000000);
            this.fpsBackground.alpha = 0.25;
            this.fpsBackground.drawRect(0, Game.display.renderHeight-10, 14, 10);
            this.layer.addChild(this.fpsBackground);

            // FPS Measure
            this.fpsText = new PIXI.BitmapText("", { font: '8px debug-regular', align: 'left'});
            this.fpsText.x = 2;
            this.fpsText.y = Game.display.renderHeight - 9;
            this.layer.addChild(this.fpsText);


            // Final: Add update method to global ticker
            Game.app.ticker.add( (delta: number) => (this.update(delta)) );
        })
    }

    update(delta: number) {
        this.clock += delta;
        if (this.clock > 5) {       // TODO What does 5 mean? 5 centi-seconds? 5 frames?
            this.clock -= 5;
            this.fpsText.text = `${Math.floor(Game.app.ticker.FPS)}`
        }
    }
 }