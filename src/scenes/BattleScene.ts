import { Scene } from "./Scene";
import { Game } from "..";
import { MapLayer } from "../scripts/battle/map/MapLayers";
import { BattleSceneControllers } from "../scripts/battle/turn-machine/BattleSceneControllers";
import { BattleSystemManager } from "../scripts/battle/turn-machine/BattleSystemManager";
import { ViewRect } from "../scripts/camera/ViewRect";
import { PixiUtils } from "../scripts/Common/PixiUtils";
import { Point } from "../scripts/Common/Point";

const { newBitmapFont } = PixiUtils;

/**
 * @author Dei Valko
 * @version 0.2.0
 */
export class BattleScene extends Scene {

    // TODO Finish implementation of Scene resource bundles
    // [ ] load() iterates over resourceLinks and resourcesFonts to link all resources.
    // [ ] loadStep() is deprecated
    // [ ] All references of the form Game.scene.resources['NormalMapTilesheet'] are replaced with
    //     Game.scene.getSpritesheet(BattleScene.resourceLinks.normalMapTilesheet)
    // This is obviously longer and more tedious to write and invoke, but the benefit
    // is that Code's autocomplete will help me remember what's available.
    // A disbenefit is that child components which depend on certain resources are coupled
    // to BattleScene, but that was already kind of true anyway.
    // A benefit, then, is that these couplings are more explicit.
    // [ ] When I work on other scene's eventually: Common sheets can be extracted to bundle
    //     objects which get added via the ...spread operator, probably preserving their keys in
    //     their type. Then, objects can request resources based on the bundles they depend
    //     on instead of the Scene they're a member of, if that's even useful.
    // [x] BitmapFont is extracted to CommonTypes.d.ts
    //
    // Game.scene.getSpritesheet(ResourceBundles.War.normalTilesheet) <-- This is preferable.
    // [ ] .getSpritesheet() complains if it detects normalTilesheet was never linked.
    //   - The 'War' bundle inference is merely for the programmer to make.
    //
    // Alt 3
    // Not sure I even like this idea, but
    // [ ] Bundles.War.urls contains strings which are used to link assets for loading.
    // [ ] Bundles.War.resources.uiSprites => PIXI.Spritesheet
    //   .resources is a getter which complains if its parent, .War, is known to be un- or never-loaded.
    //   Bundles can be unloaded at will, or never unloaded if the footprint is small enough.
    //   Bundles are more-or-less decoupled from scenes entirely. They represent only the packaging of
    //   similar-purpose sfx/vfx which are directly invoked by the objects that depend on them.
    //   .War could easily be .WarMap for a more component-centric scheme.
    // Perhaps I do like this idea.
    // This class, then, would simply mark bundles for download.
    // Every other resource interaction skips Scene entirely.
    // Bundles.War should be a superset of Bundles.WarMap, .WarUI, .Troops, etc.
    // Bundle member management would nearly entirely be handled by the bundling scheme.


    static readonly resourceLinks = {
        normalMapTilesheet: 'assets/sheets/normal-map-tiles-sm.json',
        NormalMapLandscapeSheet: 'assets/sheets/normal-map-landscapes.json',
        UnitSpritesheet: 'assets/sheets/unit-sprites.json',
        UnitIllustrationSpritesheet: 'assets/sheets/unit-illustrations.json',
        UISpritesheet: 'assets/sheets/ui-sprites.json',
        VFXSpritesheet: 'assets/sheets/vfx-sprites.json',
        CoSpritesheet: 'assets/sheets/commanding-officers.json',
        background: 'assets/background-battle.png',
    };

    static readonly resourceFonts = {
        font_title: newBitmapFont('assets/font-title.xml', 10),
        scriptOutlined: newBitmapFont('assets/font-map-ui.xml', 14),
        smallScriptOutlined: newBitmapFont('assets/font-small-ui.xml', 12),
        script: newBitmapFont('assets/font-script.xml', 10),
        list: newBitmapFont('assets/font-table-header.xml', 6),
        menu: newBitmapFont('assets/font-menu.xml', 12),
        dayCounter: newBitmapFont('assets/font-day-ui.xml', 24),
        playerSplash: newBitmapFont('assets/font-player-splash.xml', 35),
        label: newBitmapFont('assets/font-label.xml', 6),
    }

    battleSystem!: BattleSystemManager;
    controllers!: BattleSceneControllers;

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
        this.linker.push({name: 'font-day-ui', url: 'assets/font-day-ui.xml'});
        this.linker.push({name: 'font-player-splash', url: 'assets/font-player-splash.xml'});
    }

    setupStep(): void {
        //this.controllers = new BattleSceneControllers({mapData: {width: 0, height: 0}});
        this.battleSystem = new BattleSystemManager({
            // stub
        });
        
        this.controllers = this.battleSystem.controllers;

        // TODO Move this to a repository of common bounding boxes
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
        camera.algorithms.focalCorrection = (p: Point, transform: ViewRect) => {
            const tileSize = Game.display.standardLength;
            const mapWidth = map.width * tileSize;  
            const mapHeight = map.height * tileSize;

            const subject = transform.subjectRect();

            let corrected = p.clone();

            // Centering
            if (subject.width >= mapWidth)
                corrected.x = .5*mapWidth;
            if (subject.height >= mapHeight)
                corrected.y = .5*mapHeight;

            return corrected;
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
        this.controllers.destroy();
        this.battleSystem.destroy();
        // Resources..?
    }

}