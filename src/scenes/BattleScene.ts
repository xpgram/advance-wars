import * as PIXI from "pixi.js";
import { Scene } from "./Scene";
import { Map } from "../scripts/battle/Map";
import { Game } from "..";
import { Camera } from "../scripts/Camera";
import { VirtualGamepad } from "../scripts/controls/VirtualGamepad";
import { MapCursor } from "../scripts/battle/MapCursor";
import { MapLayers } from "../scripts/battle/MapLayers";

var fpsText: PIXI.BitmapText;
var time: number = 0;

/**
 * @author Dei Valko
 * @version 0.2.0
 */
export class BattleScene extends Scene {

    map: Map;
    camera: Camera;
    gamepad: VirtualGamepad;        // TODO Link this up as a property of Game.
    cursor: MapCursor;

    loadStep(): void {
        this.linker.push({name: 'NormalMapTilesheet', url: 'assets/sheets/normal-map-tiles-sm.json'});
        this.linker.push({name: 'UISpritesheet', url: 'assets/sheets/ui-sprites.json'});
        this.linker.push({name: 'TecTacRegular', url: 'assets/TecTacRegular.xml'});
    }

    setupStep(): void {
        this.map = new Map(30, 30);
        this.map.log();

        this.camera = new Camera(Game.stage);

        // Do it here.
        // Also, since I need it several places, I should probably initialize it here instead of in new Map()

        // This needs to go somewhere else, like MapLayers.init() or TerrainMethods.startPaletteAnimation(),
        // but how do I inform them... oh, never mind. They don't need to know where the camera's x/y is.
        let cameraView = new PIXI.Rectangle(0, 0, Game.display.width, Game.display.height);
        (MapLayers['bottom'] as PIXI.Container).filterArea = cameraView;
        // Game.stage.filterArea = cameraView;
        //Game.app.stage.filterArea = cameraView;

        // Testing out gamepads, babay
        this.gamepad = new VirtualGamepad();
        this.cursor = new MapCursor(this.map, this.gamepad);
        this.camera.followTarget = this.cursor;
        this.camera.frame.focusBox.x = 32;
        this.camera.frame.focusBox.y = 32;

        // Add an FPS ticker to measure performance
        // TODO Move this into a Debug class or something. Instantiate it in Game or Scene.
        // TODO Include a build number.
        let graphics = new PIXI.Graphics(); //(0, 160-10, 12, 8);
        graphics.beginFill(0x000000);
        graphics.alpha = 0.25;
        graphics.drawRect(0, Game.display.renderHeight-10, 14, 10);
        Game.debugHud.addChild(graphics);

        fpsText = new PIXI.BitmapText("", { font: {name: 'TecTacRegular', size: 8}, align: 'left'});
        fpsText.x = 2;
        fpsText.y = Game.display.renderHeight - 9;
        Game.debugHud.addChild(fpsText);
    }

    updateStep(delta: number): void {
        // FPS Counter
        time += delta;
        if (time > 5) {
            time -= 5;
            if (fpsText)
                fpsText.text = `${Math.floor(Game.app.ticker.FPS)}`;
        }

        // Update board mask
        (MapLayers['bottom'] as PIXI.Container).filterArea.width = Game.display.width;
        (MapLayers['bottom'] as PIXI.Container).filterArea.height = Game.display.height;

        this.gamepad.update();      // Update gamepad state (should probably be in main game loop)
        this.cursor.update(delta);  // Update map cursor state (I could just have it add its own ticker, you know... hm. I get more control this way, though. I think.)
        this.camera.update(delta);  // Update camera position (follows cursor)

        // Proof that buttons work.
        if (this.gamepad.button.A.down)
            fpsText.text = "A button is pressed!";
    }

    destroyStep(): void {
    }
}