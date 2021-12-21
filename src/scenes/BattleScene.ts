import { Scene } from "./Scene";
import { Game } from "..";
import { MapLayer } from "../scripts/battle/map/MapLayers";
import { UnitObject } from "../scripts/battle/UnitObject";
import { BattleSceneControllers } from "../scripts/battle/turn-machine/BattleSceneControllers";
import { BattleSystemManager } from "../scripts/battle/turn-machine/BattleSystemManager";
import { updateUniforms } from "../scripts/filters/TileSpotlight";
import { Point } from "../scripts/Common/Point";

/**
 * @author Dei Valko
 * @version 0.2.0
 */
export class BattleScene extends Scene {

    battleSystem!: BattleSystemManager;
    controllers!: BattleSceneControllers;

    unitSwap?: UnitObject;

    loadStep(): void {
        this.linker.push({name: 'NormalMapTilesheet', url: 'assets/sheets/normal-map-tiles-sm.json'});
        this.linker.push({name: 'NormalMapLandscapeSheet', url: 'assets/sheets/normal-map-landscapes.json'});
        this.linker.push({name: 'UnitSpritesheet', url: 'assets/sheets/unit-sprites.json'});
        this.linker.push({name: 'UnitIllustrationSpritesheet', url: 'assets/sheets/unit-illustrations.json'});
        this.linker.push({name: 'UISpritesheet', url: 'assets/sheets/ui-sprites.json'});
        this.linker.push({name: 'VFXSpritesheet', url: 'assets/sheets/vfx-sprites.json'});
        this.linker.push({name: 'CoSpritesheet', url: 'assets/sheets/commanding-officers.json'});
        this.linker.push({name: 'background', url: 'assets/background-battle.png'});

        this.linker.push({name: 'font-map-ui', url: 'assets/font-map-ui.xml'});
        this.linker.push({name: 'font-small-ui', url: 'assets/font-small-ui.xml'});
        this.linker.push({name: 'font-script', url: 'assets/font-script.xml'});
        this.linker.push({name: 'font-menu', url: 'assets/font-menu.xml'});
        this.linker.push({name: 'font-table-header', url: 'assets/font-table-header.xml'});
        this.linker.push({name: 'font-title', url: 'assets/font-title.xml'});
        this.linker.push({name: 'font-label', url: 'assets/font-label.xml'});
    }

    setupStep(): void {
        //this.controllers = new BattleSceneControllers({mapData: {width: 0, height: 0}});
        this.battleSystem = new BattleSystemManager({
            // stub
        });
        
        this.controllers = this.battleSystem.controllers;

        // Start scene-relevant shader tickers
        this.ticker.add(updateUniforms);
        
        // TODO Do something with the below notes:

        // Testing unit sprites
        // let unitName = 'seeker/red/idle';
        // let sheet = Game.app.loader.resources['UnitSpritesheet'].spritesheet;
        // let frames = sheet.animations[unitName];
        // frames.push(frames[1]);                     // This has to be done when the sheet is loaded, and so should be done in json, I guess; asking the units to do it causes muy problemas (too many frames.)
        // for (let i = 0; i < 5; i++) {
        //     let unit = new PIXI.AnimatedSprite(sheet.animations[unitName]);
        //     unit.animationSpeed = 1 / 12.5;     // Or 5 / 60, which is 5 frame updates per second.
        //     //unit.scale.x = -1;                // Then running could be 10 / 60.
        //     unit.x = unit.y = 32;               // And driving could be 15 / 60.
        //     unit.x += 16*i;
        //     unit.play();                        // Alt: idle = 4 / 50, which is 4 frames over 5/6ths a second.
        //     if (i % 3 == 0)                     //   running = 4 / 25       .42 seconds
        //         unit.tint = 0x888888;           //   driving = 3 / 12       .25 seconds
        //     Game.stage.addChild(unit);
        // }

        //// Syncing all units sprites:
        // Let there be a ticker of speed 0.08, whatever that is.
        // On update, increase a counter toward a maximum value (ping-ponging.)
        // Also on update, callback any listeners with the new value, so they can pull their new texture from sheet.animations['which'][frameIdx].
        // It would be smart of me to verify frameIdx is valid.
        // Eh.

        // Idle anim speed:        1/12.5   // Ping-pongs 3 frames      ← Both infantry and vehicles follow this one
        // Legs move anim speed:   1/6.25   // Ping-pongs 3 frames      // There are only 8 of these total. // TODO Copy frame 1 as 3 in texture-packer source.
        // Wheels move anim speed: 1/4      // Loops 3 frames           // Movement sprites do not need to be synced
        // Unit-spent tint:        0x888888
        // Unit-right is unit-left with scale.x = -1
        // MovementRailcar does ~not~ pause animation once it reaches its destination. It is just usually too fast to notice this.
    }

    updateStep(delta: number): void {

        // TODO Move this to the game's main update loop / ticker / something.
        this.controllers.gamepad.update();

        // TODO Move this to Camera.update(), a function which should add itself to the scene's ticker.
        // Window resize: camera-view rectangle fix.

        if (Game.display.width != MapLayer('bottom').filterArea?.width
            || Game.display.height != MapLayer('bottom').filterArea?.height) {

            let cameraView = new PIXI.Rectangle(0, 0, Game.display.width, Game.display.height);
            MapLayer('bottom').filterArea = cameraView;
        }

        // TODO Move this to... Camera.update()..?
        // I might actually make this a ControlScript that defaults to on.
        // It doesn't need to be toggleable, so... I dunno, but any other place
        // would seem odd.

        // Stage centering when stage is too smol
        // This, uh... don't look at it.
        // TODO Don't look at it.
        
        const { camera, map, mapCursor } = this.controllers;
        const view = camera.transform.worldRect();

        // TODO This was middle-snapping for small maps.
        // This needs to be handled somewhere else.

        // const camTarget = {position: {x:0,y:0}};
        // if (view.width <= map.width*16 + 80 && view.height <= map.height*16 + 64)
        //     camTarget.position = new Point(
        //         map.width*8,
        //         map.height*8
        //     );
        // else if (view.width >= map.width*16 + 80)
        //     camTarget.position = (() => { return {
        //         x: map.width*8,
        //         get y() { return mapCursor.transform.exact.y; }
        //     }})();
        // else if (view.height >= map.height*16 + 64)
        //     camTarget.position = (() => { return {
        //         get x() { return mapCursor.transform.exact.x; },
        //         y: map.height*8
        //     }})();
        // console.log(`${camTarget.position.x} ${camTarget.position.y}`);
        // camera.focalTarget = camTarget;
        
        //   Here's what the above block is doing and what to focus on when refactoring:
        // As *soon* as the map is too small not to fit neatly inside the camera frame,
        // the x or y (or both) coordinate that we're 'following' snaps to the middle of
        // the map, and at that point, zooming out just means zoomin out evenly from the center.
        //   Another note: The cursor has a draw order issue with the camera that I haven't
        // kinked out yet. The camera needs to shift the stage (or itself) *after* the cursor
        // has moved, but *before* draw has been called. Otherwise you get mom's massage head
        // as a tile selector.
    }

    destroyStep(): void {
    }
}