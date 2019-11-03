import * as PIXI from "pixi.js";
import { Map } from "./Map";
import { Point } from "../CommonTypes";
import { TerrainObject } from "./TerrainObject";
import { Camera } from "../Camera";
import { Game } from "../..";
import { Terrain } from "./Terrain";

export class InfoWindow {
    static readonly WINDOW_WIDTH = 80;
    static readonly WINDOW_HEIGHT = 48;
    static readonly WINDOW_BORDER = 4;

    private mapRef: Map;    // A reference to the map object this one will provide information on.
    private cameraRef: Camera;
    private mapPos!: Point; // A point on the map this object will provide information for.
    private show: boolean = false;

    private container: PIXI.Container;
    private tileShowcase: PIXI.Container;
    private tileName: PIXI.BitmapText;
    private tileDefense: PIXI.TilingSprite;
    private showOnLeftSide!: boolean;

    constructor(map: Map, camera: Camera, pos: Point) {
        this.mapRef = map;
        this.cameraRef = camera;
        this.mapPos = {x: -1, y: -1};   // Null, basically.

        this.container = new PIXI.Container;

        // Set up background
        let background = new PIXI.Graphics();
        background.alpha = 0.4;
        background.beginFill(0x000000);
        background.drawRect(0, 24, InfoWindow.WINDOW_WIDTH, InfoWindow.WINDOW_HEIGHT/2);
        background.endFill();

        // Set up terrain picture
        this.tileShowcase = new PIXI.Container();
        this.tileShowcase.x = InfoWindow.WINDOW_BORDER;
        this.tileShowcase.y = InfoWindow.WINDOW_HEIGHT * 0.5 + InfoWindow.WINDOW_BORDER;
        this.tileShowcase.addChild( new PIXI.Sprite(Terrain.sheet.textures['plain-0.png']) );
        this.tileShowcase.addChild( new PIXI.Sprite(Terrain.sheet.textures['mountain-00.png']) );
        this.tileShowcase.children[1].anchor.y = 0.5;

        // Set up terrain name
        this.tileName = new PIXI.BitmapText("", {font: {name: "TecTacRegular", size: 8}});
        this.tileName.x = InfoWindow.WINDOW_BORDER*2 + Game.display.standardLength;
        this.tileName.y = InfoWindow.WINDOW_HEIGHT * 0.5 + InfoWindow.WINDOW_BORDER;

        // Set up terrain DEF rating
        this.tileDefense = new PIXI.BitmapText("", {font: {name: "TecTacRegular", size: 8}});
        this.tileDefense.x = InfoWindow.WINDOW_BORDER*2 + Game.display.standardLength;
        this.tileDefense.y = InfoWindow.WINDOW_HEIGHT * 0.5 + InfoWindow.WINDOW_BORDER + 9;
        //this.starTextureEmpty = PIXI.Texture.from("");
        //this.starTextureFull = PIXI.Texture.from("");
        //this.tileDefense = new PIXI.Sprite(this.starTexture.Empty);  x4
        //for i in 4: this.tileDefense[i].texture = (i < tile.defense) ? this.starTextureFull : this.starTextureEmpty;
        // Give it a star texture, set its width to whole multiples of its own size by the defense rating.

        // Add all children to main
        this.container.addChild(background);
        this.container.addChild(this.tileShowcase);
        this.container.addChild(this.tileName);
        //add DEF stars
        this.container.addChild(this.tileDefense);
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
        //@ts-ignore
        square.terrain.layers.forEach( pair => {
            // Don't worry about doing this, DoR has special 'showcase' textures anyway.
            // I can easily just pull one of those based on terrain.name
        });
        this.tileName.text = square.terrain.name;
        this.tileDefense.text = `DEF: ${square.terrain.defenseRating}`;

        // Gather unit information.

        // Figure out which side of the screen to display on.
        let worldX = pos.x * Game.display.standardLength;
        this.showOnLeftSide = (worldX > this.cameraRef.center.x);
    }

    positionWindow() {
        if (this.container.x == 0 && this.showOnLeftSide)
            return

        this.container.x = (this.showOnLeftSide) ? 0 : Game.display.renderWidth - InfoWindow.WINDOW_WIDTH;
        this.container.y = Game.display.renderHeight - InfoWindow.WINDOW_HEIGHT;
    }
}