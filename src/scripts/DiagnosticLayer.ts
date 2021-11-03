import { Game } from "..";
import { Keys } from "./controls/KeyboardObserver";

/**
 * Populates a PIXI.Container with performance information, among other things.
 * Also, toggleable. (That is, when I add controller/keyboard support.)
 * 
 * @author Dei Valko
 * @version 0.1.0
 */
 export class DiagnosticLayer {
    
    /** If true, force hide the diagnostic UI layer from the scene.
     * Production builds should force set this to off. */
    static readonly suppressDiagnostics = true;

    private _container: PIXI.Container;
    /** The visual layer this class operates. */
    get container() { return this._container; }

    private clock: number = 0;

    private fpsBackground: PIXI.Graphics;
    private fpsText: PIXI.BitmapText;

    private pointBackground: PIXI.Graphics;
    private pointText: PIXI.BitmapText;
    get cursorPos() {
        return this.pointText.text;
    }
    set cursorPos(s: string) {
        this.pointText.text = s;
    }

    constructor(options?: {enable?: boolean}) {
        this._container = new PIXI.Container();

        //@ts-expect-error : Property is readonly.
        DiagnosticLayer.suppressDiagnostics = !(options?.enable || false);

        // TODO This should really make use of some kind of messaging system.
        // TODO And/or MapCursor should just post its own little box message
        //   to the debug UI layer. Like, positionally. I guess it would still
        //   make use of Diagnostic as an accessor to that layer.

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
        this.fpsText.tint = 0xEEEEEE;
        this._container.addChild(this.fpsText);

        // Cursor Pos Background
        this.pointBackground = new PIXI.Graphics();
        this.pointBackground.beginFill(0x000000);
        this.pointBackground.alpha = 0.25;
        this.pointBackground.drawRect(16, Game.display.renderHeight-10, 30, 10);
        this._container.addChild(this.pointBackground);

        // Cursor Pos Measure
        this.pointText = new PIXI.BitmapText("", { fontName: 'TecTacRegular', fontSize: 8, align: 'left'});
        this.pointText.x = 18;
        this.pointText.y = Game.display.renderHeight - 9;
        this.pointText.tint = 0xEEEEEE;
        this._container.addChild(this.pointText);

        // Add update method to global ticker
        Game.app.ticker.add(this.update, this);

        // Visual layer is always hidden by default. Enable with dev controls.
        this._container.visible = false;
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