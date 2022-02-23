import { Scene } from "./Scene";
import { Game } from "..";
import { MapLayer } from "../scripts/battle/map/MapLayers";
import { UnitObject } from "../scripts/battle/UnitObject";
import { BattleSceneControllers } from "../scripts/battle/turn-machine/BattleSceneControllers";
import { BattleSystemManager } from "../scripts/battle/turn-machine/BattleSystemManager";
import { updateUniforms } from "../scripts/filters/TileSpotlight";
import { Point } from "../scripts/Common/Point";
import { ViewRect } from "../scripts/camera/ViewRect";

/**
 * @author Dei Valko
 * @version 0.2.0
 */
export class BattleScene extends Scene {

    battleSystem!: BattleSystemManager;
    controllers!: BattleSceneControllers;

    unitSwap?: UnitObject;

    loadStep(): void {
        // TODO I want more strict references to resources.
        // I'm not sure how to get TypeScript to comply, but here's what I want:
        // links = {normalTileset: {name: string, url: string}}
        //   => .forEach( o => this.linker.push(o) )
        //   ∴ {normalTileset: Spritesheet}
        // ∴ (Game.scene as BattleScene).resource.normalTileset

        // An alternative would be bundling.
        // So, this.linker.push(...bundles.BattleScene)
        // Game.scene.resources[bundles.BattleScene.name]
        //
        // I... disprefer this. Hm. I'm not sure how to avoid it, though.
        // Either would be better than what I'm currently doing, I guess.
        //
        // And of course, scene.resources should be left alone for legacy support.
        //
        // Btw, I think 'name' is just how we want the resource to be referred to in-app.
        // There's probably no reason bundles.normalTileset couldn't just name url and name
        // the same thing during the linking process; the bundle kind of eliminates the
        // need for a resource name at all. Well, except for legacy.

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
        this.linker.push({name: 'font-day-ui', url: 'assets/font-day-ui.xml'});
        this.linker.push({name: 'font-player-splash', url: 'assets/font-player-splash.xml'});
    }

    setupStep(): void {
        //this.controllers = new BattleSceneControllers({mapData: {width: 0, height: 0}});
        this.battleSystem = new BattleSystemManager({
            // stub
        });
        
        this.controllers = this.battleSystem.controllers;

        // Start scene-relevant shader tickers
        this.ticker.add(updateUniforms);

        // TODO This is awful. Kinda. I dunno, clean it up.
        // Add small-map camera squeezing.
        const { camera, map } = this.controllers;
        camera.algorithms.destinationCorrection = (transform: ViewRect) => {
            const tileSize = Game.display.standardLength;
            const mapWidth = map.width * tileSize;  
            const mapHeight = map.height * tileSize;
            const mapFocalWidth = mapWidth - tileSize;    // Tile origin in topleft corner means
            const mapFocalHeight = mapHeight - tileSize;  // last tileSize isn't considered.

            const subject = transform.subjectRect();
            const world = transform.worldRect();
            const viewCenter = world.center;

            // Bounding
            if (subject.left < 0)
                transform.position.x = -transform.border.left;
            if (subject.right > mapWidth)
                transform.position.x = mapFocalWidth - subject.width - transform.border.right;
            if (subject.top < 0)
                transform.position.y = -transform.border.top;
            if (subject.bottom > mapHeight)
                transform.position.y = mapFocalHeight - subject.height - transform.border.bottom;

            // Centering
            if (subject.width >= mapWidth)
                transform.position.x = .5*mapWidth - viewCenter.x + world.x;
            if (subject.height >= mapHeight)
                transform.position.y = .5*mapHeight - viewCenter.y + world.y;
            
            return transform;
        }
    }

    updateStep(): void {

        // TODO Move this to the game's main update loop / ticker / something.
            // Haven't I? Fug, I can't even remember.
        this.controllers.gamepad.update();

        // TODO Move this to Camera.update(), a function which should add itself to the scene's ticker.
        // Window resize: camera-view rectangle fix.

        if (Game.display.width != MapLayer('bottom').filterArea?.width
            || Game.display.height != MapLayer('bottom').filterArea?.height) {

            let cameraView = new PIXI.Rectangle(0, 0, Game.display.width, Game.display.height);
            MapLayer('bottom').filterArea = cameraView;
        }
    }

    destroyStep(): void {
        // TODO destroy map, assets, etc.
    }

}