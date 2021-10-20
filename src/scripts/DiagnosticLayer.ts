import { Game } from "..";
import { Keys } from "./controls/KeyboardObserver";
import { Debug } from "./DebugUtils";

/**
 * Populates a PIXI.Container with performance information, among other things.
 * Also, toggleable. (That is, when I add controller/keyboard support.)
 * 
 * @author Dei Valko
 * @version 0.1.0
 */
 export class DiagnosticLayer {
    
    static readonly suppressDiagnostics = true; // If true, force hide all diagnostics (production setting).
                                                 // Why am I forcing myself to set it manually, though?

    private _container: PIXI.Container;
    /** The visual layer this class operates. */
    get container() { return this._container; }

    private clock: number = 0;

    private fpsBackground: PIXI.Graphics;
    private fpsText: PIXI.BitmapText;

    constructor(options?: {enable?: boolean}) {
        this._container = new PIXI.Container();

        //@ts-ignore : Property is readonly. // TODO Should I conform this to DevController or conform DevController to this?
        DiagnosticLayer.suppressDiagnostics = !(options?.enable || false);

        // FPS Background
        this.fpsBackground = new PIXI.Graphics(); //(0, 160-10, 12, 8);
        this.fpsBackground.beginFill(0x000000);
        this.fpsBackground.alpha = 0.25;
        this.fpsBackground.drawRect(0, Game.display.renderHeight-10, 14, 10);
        this._container.addChild(this.fpsBackground);

        // FPS Measure
        this.fpsText = new PIXI.BitmapText("", { fontName: 'TecTacRegular', fontSize: 8, align: 'left'});
        this.fpsText.x = 2;
        this.fpsText.y = Game.display.renderHeight - 9;
        this._container.addChild(this.fpsText);

        // Add update method to global ticker
        Game.app.ticker.add(this.update, this);

        // Hide visual layer if suppressed.
        this._container.visible = !DiagnosticLayer.suppressDiagnostics;
    }

    private update(delta: number) {
        this.clock += delta;
        if (this.clock > 10) {
            this.clock -= 8;
            this.fpsText.text = `${Math.floor(Game.app.ticker.FPS)}`
        }

        // Toggle DevUI control
        if (!DiagnosticLayer.suppressDiagnostics) {
            const contr = Game.devController;
            if (contr.get(Keys.Shift).down && contr.get(Keys.GraveAccent).pressed) {
                this._container.visible = !this._container.visible;
            }
        }
    }
 }