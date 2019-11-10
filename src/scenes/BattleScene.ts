import * as PIXI from "pixi.js";
import * as PixiFilters from "pixi-filters";
import { Scene } from "./Scene";
import { Map } from "../scripts/battle/Map";
import { Game } from "..";
import { Camera } from "../scripts/Camera";
import { VirtualGamepad } from "../scripts/controls/VirtualGamepad";
import { MapCursor } from "../scripts/battle/MapCursor";
import { MapLayers } from "../scripts/battle/MapLayers";
import { InfoWindow } from "../scripts/battle/InfoWindow";
import { Common } from "../scripts/CommonUtils";

var fpsText: PIXI.BitmapText;
var time: number = 0;

/**
 * @author Dei Valko
 * @version 0.2.0
 */
export class BattleScene extends Scene {

    map!: Map;
    camera!: Camera;
    gamepad!: VirtualGamepad;        // TODO Link this up as a property of Game.
    cursor!: MapCursor;
    infoWindow!: InfoWindow;

    loadStep(): void {
        this.linker.push({name: 'NormalMapTilesheet', url: 'assets/sheets/normal-map-tiles-sm.json'});
        this.linker.push({name: 'UnitSpritesheet', url: 'assets/sheets/unit-sprites.json'});
        this.linker.push({name: 'UISpritesheet', url: 'assets/sheets/ui-sprites.json'});
        this.linker.push({name: 'background', url: 'assets/background-battle.png'});
        this.linker.push({name: 'font-TecTacRegular', url: 'assets/TecTacRegular.xml'});
        this.linker.push({name: 'font-map-ui', url: 'assets/font-map-ui.xml'});
    }

    setupStep(): void {
        this.map = new Map(30, 30);

        this.camera = new Camera(Game.stage);
        // Do it here.
        // Also, since I need it several places, I should probably initialize it here instead of in new Map()
        // ↑ I think this is referring to the camera?

        // This needs to go somewhere else, like MapLayers.init() or TerrainMethods.startPaletteAnimation(),
        // but how do I inform them... oh, never mind. They don't need to know where the camera's x/y is.
        let cameraView = new PIXI.Rectangle(0, 0, Game.display.width, Game.display.height);
        (MapLayers['bottom'] as PIXI.Container).filterArea = cameraView;
        // Game.stage.filterArea = cameraView;
        //Game.app.stage.filterArea = cameraView;

        // Set a backdrop for viewing pleasures
        let backdrop = new PIXI.Sprite( Game.app.loader.resources['background'].texture );
        Game.backdrop.addChild( backdrop );

        // Testing out gamepads, babay
        this.gamepad = new VirtualGamepad();
        this.cursor = new MapCursor(this.map, this.gamepad);
        this.camera.followTarget = this.cursor;
        this.camera.frame.focusBox.x = 32;
        this.camera.frame.focusBox.y = 32;

        // Info Window
        this.infoWindow = new InfoWindow(this.map, this.camera, this.cursor.pos);

        // Testing unit sprites
        let unitName = 'infantry/red/idle';
        let sheet = Game.app.loader.resources['UnitSpritesheet'].spritesheet;
        let frames = sheet.animations[unitName];
        frames.push(frames[1]);                     // This has to be done when the sheet is loaded, and so should be done in json, I guess; asking the units to do it causes muy problemas (too many frames.)
        for (let i = 0; i < 5; i++) {
            let unit = new PIXI.AnimatedSprite(sheet.animations[unitName]);
            unit.animationSpeed = 1 / 12.5;
            //unit.scale.x = -1;
            unit.x = unit.y = 32;
            unit.x += 16*i;
            unit.play();
            if (i % 3 == 0)
                unit.tint = 0x888888;
            Game.stage.addChild(unit);
        }

        //// Syncing all units sprites:
        // Let there be a ticker of speed 0.08, whatever that is.
        // On update, increase a counter toward a maximum value (ping-ponging.)
        // Also on update, callback any listeners with the new value, so they can pull their new texture from sheet.animations['which'][frameIdx].
        // It would be smart of me to verify frameIdx is valid.
        // Eh.

        // Idle anim speed:        0.08     // Ping-pongs 3 frames
        // Legs move anim speed:   0.15     // Ping-pongs 3 frames      // There are only 8 of these total. // TODO Copy frame 1 as 3 in texture-packer source.
        // Wheels move anim speed: 0.25     // Loops 3 frames           // Movement sprites do not need to be synced
        // Unit-spent tint:        0x888888
        // Unit-right is unit-left with scale.x = -1
        // MovementRailcar does ~not~ pause animation once it reaches its destination. It is just usually too fast to notice this.

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
        this.camera.update(delta);  // Update camera position (follows cursor)
        this.infoWindow.inspectTile(this.cursor.pos);
        this.infoWindow.positionWindow();

        // Proof that buttons work.
        if (this.gamepad.button.A.down)
            fpsText.text = "A button is pressed!";
    }

    destroyStep(): void {
    }
}