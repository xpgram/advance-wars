import * as PIXI from "pixi.js";
import * as PixiFilter from "pixi-filters";
import { Scene } from "./Scene";
import { Map } from "../scripts/battle/Map";
import { Game } from "..";
import { Camera } from "../scripts/Camera";
import { VirtualGamepad } from "../scripts/VirtualGamepad";
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

        let cameraView = new PIXI.Rectangle(0, 0, Game.display.width-16, Game.display.height-16);
        (MapLayers['bottom'] as PIXI.Container).filterArea = cameraView;
        // Game.stage.filterArea = cameraView;
        //Game.app.stage.filterArea = cameraView;

        // I want to try this refactor:
        // Use one animated sprite → Sea
        // Use a tiling sprite to cover the view, or whatever,
        // On frame update (animated), change the texture of the tiling sprite.
        // Do this instead of creating up to 30^2 sea sprites that animate independently;
        // This ~might~ be more efficient. 

        // ↑ Which one of these performs better?
        // On the one hand, applying it to the stage should limit the pixels drawn just the same,
        // but on the other, maybe the color-replace-filter is applied on 'bottom' before stage gets
        // to limit anything.
        //
        // The only reason I want to apply it to stage is because it will also cull sprites beyond the camera view.
        // It's a two-birds-with-one-stone situation.
        // I suppose I could apply it to both.
        // I just want to know if I ~need~ to.

        // TODO Goal for today: 
        // Undo my cullables work——well, not completely.
        // It will be useful when trying to cull updateable-objects or something.
        // Maybe not for this game, but you know, no need to run the physics engine on a Goomba that is
        // 14 screens away.

        // TODO If it were possible to tile an animated sprite, and thus keep track of ~one~ sea sprite,
        // that might be good. I wonder if I could even set up such a thing myself: have one updating, animated,
        // but invisible sea sprite, and then a bunch of regular sprites that pull that one's current texture as
        // their main texture.
        // At a glance, I'm not really seeing any gains there, though.

        // Testing out gamepads, babay
        this.gamepad = new VirtualGamepad();
        this.cursor = new MapCursor(this.map, this.gamepad);

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
        time += delta;
        if (time > 5) {
            time -= 5;
            if (fpsText)
                fpsText.text = `${Math.floor(Game.app.ticker.FPS)}`;
        }

        this.gamepad.update();
        this.cursor.update(delta);

        if (this.gamepad.button.A.down)
            fpsText.text = "A button is pressed!";
        if (this.gamepad.button.dpadDown.down)
            this.camera.y += 0.1 * delta;
    }

    destroyStep(): void {
    }
}