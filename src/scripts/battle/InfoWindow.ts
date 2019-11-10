import * as PIXI from "pixi.js";
import { Map } from "./Map";
import { Point } from "../CommonTypes";
import { TerrainObject } from "./TerrainObject";
import { Camera } from "../Camera";
import { Game } from "../..";
import { Terrain } from "./Terrain";

export class InfoWindow {
    static readonly WINDOW_WIDTH = 88;
    static readonly WINDOW_HEIGHT = 48;
    static readonly WINDOW_BORDER = 4;

    private mapRef: Map;    // A reference to the map object this one will provide information on.
    private cameraRef: Camera;
    private mapPos!: Point; // A point on the map this object will provide information for.
    private show: boolean = false;

    private container: PIXI.Container;
    private tileShowcase: PIXI.Container;
    private tileName: PIXI.BitmapText;
    private tileDefenseStars: PIXI.Container;
    private tileDefenseStarsFull: PIXI.TilingSprite;
    private tileCaptureIcon: PIXI.Sprite;
    private tileCaptureMeter: PIXI.BitmapText;
    private showOnLeftSide!: boolean;

    constructor(map: Map, camera: Camera, pos: Point) {
        this.mapRef = map;
        this.cameraRef = camera;
        this.mapPos = {x: -1, y: -1};   // Null, basically.

        this.container = new PIXI.Container;

        // Set up background
        let background = new PIXI.Graphics();
        background.alpha = 0.5;
        background.beginFill(0x000000);
        background.drawRect(0, 24, InfoWindow.WINDOW_WIDTH, InfoWindow.WINDOW_HEIGHT/2);
        background.endFill();

        // Set up terrain picture
        this.tileShowcase = new PIXI.Container();
        this.tileShowcase.x = InfoWindow.WINDOW_BORDER;
        this.tileShowcase.y = InfoWindow.WINDOW_HEIGHT * 0.5 + InfoWindow.WINDOW_BORDER;

        // Set up terrain name
        this.tileName = new PIXI.BitmapText("", {font: {name: 'font-map-ui', size: 13}});
        this.tileName.x = InfoWindow.WINDOW_BORDER*2 + Game.display.standardLength;
        this.tileName.y = InfoWindow.WINDOW_HEIGHT * 0.5 + InfoWindow.WINDOW_BORDER - 1;

        let sheet = Game.app.loader.resources['UISpritesheet'].spritesheet;

        // Set up terrain DEF rating
        this.tileDefenseStars = new PIXI.TilingSprite(sheet.textures['icon-star-empty.png'], 4*8, 8);
        // TODO Get 8 dynamically
        this.tileDefenseStars.x = InfoWindow.WINDOW_BORDER*2 + Game.display.standardLength;
        this.tileDefenseStars.y = InfoWindow.WINDOW_HEIGHT * 0.5 + InfoWindow.WINDOW_BORDER + 12;

        this.tileDefenseStarsFull = new PIXI.TilingSprite(sheet.textures['icon-star-full.png'], 0, 8);
        this.tileDefenseStars.addChild(this.tileDefenseStarsFull);

        //this.starTextureEmpty = PIXI.Texture.from("");
        //this.starTextureFull = PIXI.Texture.from("");
        //this.tileDefense = new PIXI.Sprite(this.starTexture.Empty);  x4
        //for i in 4: this.tileDefense[i].texture = (i < tile.defense) ? this.starTextureFull : this.starTextureEmpty;
        // Give it a star texture, set its width to whole multiples of its own size by the defense rating.

        // Set up capture meter (buildings)
        this.tileCaptureIcon = new PIXI.Sprite(sheet.textures['icon-capture.png']);
        this.tileCaptureIcon.x = this.tileDefenseStars.x + 8*4 + 6;
        this.tileCaptureIcon.y = this.tileDefenseStars.y - 2;

        this.tileCaptureMeter = new PIXI.BitmapText("20", {font: {name: 'font-map-ui', size: 13}});
        this.tileCaptureMeter.anchor = new PIXI.Point(1, 0);
        this.tileCaptureMeter.x = this.tileCaptureIcon.x + 24;
        this.tileCaptureMeter.y = this.tileCaptureIcon.y - 1;

        // Add all children to main
        this.container.addChild(background);
        this.container.addChild(this.tileShowcase);
        this.container.addChild(this.tileName);
        //add DEF stars
        this.container.addChild(this.tileDefenseStars);
        this.container.addChild(this.tileCaptureIcon);
        this.container.addChild(this.tileCaptureMeter);
        Game.hud.addChild(this.container);

        this.inspectTile(pos);
        this.positionWindow();
        this.show = true;
    }

    inspectTile(pos: Point) {
        // if (pos.x == this.mapPos.x && pos.y == this.mapPos.y)
        //     return;
        
        this.mapPos = pos;
        let square = this.mapRef.squareAt(pos);

        // Gather tile information.
        this.tileShowcase.removeChildren();
        this.tileShowcase.addChild(square.terrain.preview);
        this.tileName.text = square.terrain.name;
        this.tileDefenseStarsFull.width = 8*square.terrain.defenseRating;
        // TODO Get 8 dynamically

        // Hide capture meter if not hovering over a building
        this.tileCaptureIcon.visible = this.tileCaptureMeter.visible = (square.terrain.building);

        // Gather unit information.

        // Figure out which side of the screen to display on.
        let worldX = pos.x * Game.display.standardLength;
        this.showOnLeftSide = (worldX > this.cameraRef.center.x);
    }

    positionWindow() {
        if (this.container.x == 0 && this.showOnLeftSide)
            return

        this.container.x = (this.showOnLeftSide) ? 0 : Game.display.renderWidth - InfoWindow.WINDOW_WIDTH;
        this.container.y = Game.display.renderHeight - InfoWindow.WINDOW_HEIGHT - 1;
    }
}