import * as PIXI from "pixi.js";
import { Map } from "./Map";
import { Point } from "../CommonTypes";
import { Camera } from "../Camera";
import { Game } from "../..";
import { Common } from "../CommonUtils";
import { VirtualGamepad } from "../controls/VirtualGamepad";
import { MoveType } from "./EnumTypes";

/**
 * This class is a goddamn mess because I'm experimenting right now.
 * For real, though. Mom says I need to clean my room in here.
 * 
 * Missing Ingredients:
 *  - I need a title font; font-panel is not working, it looks dumb.
 *  - A layout backdrop for Detail Window
 * 
 * Plans:
 * Default State:
 *  - Show CO Blurb
 *  - Show Tile Blurb
 *  - Show Unit Blurb (if present)
 *     - Unit blurb includes two little squares above for loaded units
 * Hold L:
 *  - Detailed Tile/Unit info window slides in
 *     - X changes page (tile to unit and back again)
 *  - Blocks access to Hold R
 * Hold R:
 *  - Other CO Blurbs slide in
 *  - Blocks access to Hold L
 */
export class InfoWindow {
    static readonly WINDOW_WIDTH = 88;
    static readonly WINDOW_HEIGHT = 48;
    static readonly WINDOW_BORDER = 4;
    static readonly DEF_METER_SPRITE_SIZE = 8;

    private mapRef: Map;    // A reference to the map object this one will provide information on.
    private cameraRef: Camera;
    private gamepad: VirtualGamepad;    // A reference to the active controller because we need dat L button. Maybe dat L button should control a slider somewhere else, a singleton of settings that this class could easily listen to?
    private mapPos!: Point; // A point on the map this object will provide information for.
    private show: boolean = false;  // TODO Getter/Setter = true means all sprites.visible = true;
    private showUnit: boolean = false;

    private slidePosition: number = 0;  // Determines the horizontal position of the window through a piecewise function.
    private detailSlidePosition: number = 0; // Determines the horizontal position of the detail window. Max is one.
    private static readonly SLIDE_POSITION_MAX = 2;     // 0, 1, 2 are basically different states.
    private static readonly DETAIL_SLIDE_POSITION_MAX = 1;  // 0 and 1 are states
    private static readonly SLIDE_POSITION_SPEED = 0.15; // How fast the slider moves from 0 to 2.

    // Container for the entire info window
    private container: PIXI.Container;

    // Window 1: Tile info and graphical elements
    private windowTile: PIXI.Container;
    private tileShowcase: PIXI.Container;
    private tileName: PIXI.BitmapText;
    private tileDefenseStars: PIXI.Container;
    private tileDefenseStarsFull: PIXI.TilingSprite;
    private tileCaptureIcon: PIXI.Sprite;
    private tileCaptureMeter: PIXI.BitmapText;
    private showOnLeftSide!: boolean;

    // Window 2: Unit info and graphical elements
    private windowUnit: PIXI.Container;
    // ...
    // ...

    // Window 3: Detailed info on units and terrain
    private windowDetail: PIXI.Container;
    private terrainName: PIXI.BitmapText;
    private description: PIXI.BitmapText;
    private landscapeShot: PIXI.Container;
    private moveCosts: PIXI.BitmapText[] = [];
    // ...
    // ...

    constructor(map: Map, camera: Camera, gp: VirtualGamepad) {
        this.mapRef = map;
        this.cameraRef = camera;
        this.gamepad = gp;
        this.mapPos = {x: -1, y: -1};   // Null, basically.

        let sheet = Game.app.loader.resources['UISpritesheet'].spritesheet;

        this.container = new PIXI.Container();
        this.windowTile = new PIXI.Container();
        this.windowUnit = new PIXI.Container();
        this.windowDetail = new PIXI.Container();

        // Set up background (windowTile)
        let background = new PIXI.Graphics();
        background.alpha = 0.5;
        background.beginFill(0x000000);
        background.drawRect(0, 24, InfoWindow.WINDOW_WIDTH, InfoWindow.WINDOW_HEIGHT/2);
        background.endFill();
        this.windowTile.addChild(background);

        // Set up terrain picture
        this.tileShowcase = new PIXI.Container();
        this.tileShowcase.x = InfoWindow.WINDOW_BORDER;
        this.tileShowcase.y = InfoWindow.WINDOW_HEIGHT * 0.5 + InfoWindow.WINDOW_BORDER;
        this.windowTile.addChild(this.tileShowcase);

        // Set up terrain name
        this.tileName = new PIXI.BitmapText("", {font: {name: 'font-map-ui', size: 13}});
        this.tileName.x = InfoWindow.WINDOW_BORDER*2 + Game.display.standardLength;
        this.tileName.y = InfoWindow.WINDOW_HEIGHT * 0.5 + InfoWindow.WINDOW_BORDER - 1;
        this.windowTile.addChild(this.tileName);

        // Set up terrain DEF rating
        let starSize = InfoWindow.DEF_METER_SPRITE_SIZE;
        this.tileDefenseStars = new PIXI.TilingSprite(sheet.textures['icon-star-empty.png'], starSize*4, starSize);
        this.tileDefenseStars.x = InfoWindow.WINDOW_BORDER*2 + Game.display.standardLength;
        this.tileDefenseStars.y = InfoWindow.WINDOW_HEIGHT * 0.5 + InfoWindow.WINDOW_BORDER + 12;
        // Set up terrain DEF meter fill
        this.tileDefenseStarsFull = new PIXI.TilingSprite(sheet.textures['icon-star-full.png'], 0, starSize);
        this.tileDefenseStars.addChild(this.tileDefenseStarsFull);

        this.windowTile.addChild(this.tileDefenseStars);

        // Set up number meter icon
        this.tileCaptureIcon = new PIXI.Sprite(sheet.textures['icon-capture.png']);
        this.tileCaptureIcon.x = this.tileDefenseStars.x + 8*4 + 4;
        this.tileCaptureIcon.y = this.tileDefenseStars.y - 2;
        this.windowTile.addChild(this.tileCaptureIcon);

        // Set up number meter number-text
        this.tileCaptureMeter = new PIXI.BitmapText("20", {font: {name: 'font-map-ui', size: 14}});
        (this.tileCaptureMeter.anchor as PIXI.Point).x = 1;     // Right aligned
        this.tileCaptureMeter.x = this.tileCaptureIcon.x + 25;
        this.tileCaptureMeter.y = this.tileCaptureIcon.y - 1;
        this.windowTile.addChild(this.tileCaptureMeter);

        // TODO Number meter icon must be changeable into a heart when hovering over meteors.
        // Capture isn't even legitimately grabbed from anything real yet anyway, so whatever.

        // Set up background (window2)
        background = new PIXI.Graphics();
        background.alpha = 0.5;
        background.beginFill(0x000000);
        background.drawRect(0, 0, InfoWindow.WINDOW_WIDTH, InfoWindow.WINDOW_HEIGHT/2);
        background.endFill();
        this.windowUnit.addChild(background);

        // Set up detail window (window3)
        background = new PIXI.Graphics();
        background.alpha = 0.5;
        background.beginFill(0x000000);
        background.drawRect(0, 0, 88, 165);     // TODO Change how InfoWindow considers its origin and its contained elements
        background.endFill();

        this.windowDetail.addChild(background);
        this.windowDetail.y = -142;

        // TODO Draw a white mask to the right/left (depending on side) of the detail window revealing the unit blurb.
        // When the detail window slides into view, the mask will slide off, wiping away the little guy.

        /*** Testing Out Detail Window Layout *********************************/
        this.landscapeShot = new PIXI.Container();
        this.landscapeShot.x = InfoWindow.WINDOW_BORDER * 2;
        this.landscapeShot.y = InfoWindow.WINDOW_BORDER * 3;
        this.windowDetail.addChild( this.landscapeShot );

        this.terrainName = new PIXI.BitmapText("Wasteland", {font: {name: "font-label", size: 6}});
        this.terrainName.tint = 0xE3E6E9;
        this.terrainName.x = 8;
        this.terrainName.y = 4;
        this.windowDetail.addChild( this.terrainName );

        this.description = new PIXI.BitmapText('', {font: {name: "font-script", size: 10}});
        this.description.x = 8;
        this.description.y = 58;
        this.description.maxWidth = InfoWindow.WINDOW_WIDTH - 16;
        this.windowDetail.addChild(this.description);

        let labels = ['Inf','Mech','TireA','Tank','TireB','Air','Ship','Trpt'];
        let chartX = 8, chartY = 128;
        for (let i = 0; i < 8; i++) {
            let label = new PIXI.BitmapText(labels[i], {font: {name: "font-table-header", size: 6}});
            label.x = chartX + ((i % 2 == 1) ? 38 : 0);
            label.y = chartY + 8*Math.floor(i/2);

            let value = new PIXI.BitmapText('3', {font: {name: "font-table-header", size: 6}});
            (value.anchor as PIXI.Point).x = 1;     // Right aligned
            value.x = label.x + 32;
            value.y = label.y;
            this.moveCosts.push(value);

            this.windowDetail.addChild(label);
            this.windowDetail.addChild(value);
        }

        /*** Testing Out Detail Window Layout *********************************/

        // Consolidate windows - this is also first to last draw order
        this.container.addChild(this.windowDetail);
        this.container.addChild(this.windowUnit);
        this.container.addChild(this.windowTile);
        Game.hud.addChild(this.container);

        // Set up windows' screen position  (There's no reason to set y more than once)
        this.container.y = Game.display.renderHeight - InfoWindow.WINDOW_HEIGHT - 1;
        Game.scene.ticker.add(this.updateWindowPosition, this);

        // Final setup: be visible.
        this.positionWindow();
        this.show = true;
    }

    destroy() {
        Game.scene.ticker.remove(this.updateWindowPosition, this);
    }

    /** Instantly positions the info window on screen; skips animation. */
    positionWindow() {
        // Instant set global window
        this.container.x = (this.showOnLeftSide) ? 0 : Game.display.renderWidth - InfoWindow.WINDOW_WIDTH;
        this.slidePosition = (this.showOnLeftSide) ? 0 : 2;

        // Instant set slide-in window
        this.detailSlidePosition = (this.gamepad.button.leftTrigger.down) ? 0 : 1;
        this.windowDetail.x = -InfoWindow.WINDOW_WIDTH * this.detailSlidePosition;
        if (this.slidePosition >= 1) this.windowDetail.x = -this.windowDetail.x;
    }

    /** Incrementally updates the window's screen position. */
    updateWindowPosition() {
        // Update slide's slider position, clamp its value.
        let speed = InfoWindow.SLIDE_POSITION_SPEED;
        let incrementAmt = (this.showOnLeftSide) ? -speed : speed;
        this.slidePosition += incrementAmt;
        this.slidePosition = Common.confine(this.slidePosition, 0, InfoWindow.SLIDE_POSITION_MAX);

        // Update position based on new slidePosition.
        if (this.slidePosition >= 1)
            // my.x = ScreenWidth - my.width*(n=0..1) : at n=1, window will be on right screen-side after sliding left.
            this.container.x = Game.display.renderWidth - (InfoWindow.WINDOW_WIDTH * (this.slidePosition - 1));
        else
            // my.x = -my.width*(n=0..1) : at n=0, window will be on left side after sliding right
            this.container.x = -InfoWindow.WINDOW_WIDTH * this.slidePosition;

        // Also handle the detail window sliding in and out
        incrementAmt = (this.gamepad.button.leftTrigger.down) ? -speed : speed;
        this.detailSlidePosition += incrementAmt;
        this.detailSlidePosition = Common.confine(this.detailSlidePosition, 0, InfoWindow.DETAIL_SLIDE_POSITION_MAX);

        // And update its position
        this.windowDetail.x = -InfoWindow.WINDOW_WIDTH * this.detailSlidePosition;
        if (this.slidePosition >= 1) this.windowDetail.x = -this.windowDetail.x;
    }

    /** Given a point on the map we're connected to, extract and update the window with strategic details about the location in question. */
    inspectTile(pos: Point) {
        if (pos.x == this.mapPos.x && pos.y == this.mapPos.y)
            return;

        // Figure out which side of the screen to display on.
        let worldX = pos.x * Game.display.standardLength;
        this.showOnLeftSide = (worldX >= this.cameraRef.center.x);

        // Update only if this assessment agrees with where the window is, or the window is off screen.
        if (this.slidePosition == 0 && this.showOnLeftSide ||
            this.slidePosition > .9 && this.slidePosition < 1.1 ||  // Off-screen dead zone
            this.slidePosition == 2 && !this.showOnLeftSide) {

            // Update the point we're looking at.
            this.mapPos.x = pos.x;
            this.mapPos.y = pos.y;

            let square = this.mapRef.squareAt(pos);

            // Gather tile information.
            this.tileShowcase.removeChildren();
            this.tileShowcase.addChild(square.terrain.preview);
            this.tileName.text = square.terrain.name;
            this.tileDefenseStarsFull.width = InfoWindow.DEF_METER_SPRITE_SIZE * square.terrain.defenseRating;
            this.tileCaptureMeter.text = (20).toString(); // - square.unit.captureProgress;

            // Detail window information
            this.landscapeShot.removeChildren();    // TODO Does this destoy() children? Probably not, right?
            this.landscapeShot.addChild( square.terrain.landscape );

            this.terrainName.text = square.terrain.name;

            this.description.text = square.terrain.description;
            // I really thought I could tint individual letters...
            this.description.text = this.description.text.replace(/\//g,'');

            this.moveCosts[0].text = square.terrain.movementCost.infantry.toString();
            this.moveCosts[1].text = square.terrain.movementCost.mech.toString();
            this.moveCosts[2].text = square.terrain.movementCost.tireA.toString();
            this.moveCosts[3].text = square.terrain.movementCost.tread.toString();
            this.moveCosts[4].text = square.terrain.movementCost.tireB.toString();
            this.moveCosts[5].text = square.terrain.movementCost.air.toString();
            this.moveCosts[6].text = square.terrain.movementCost.ship.toString();
            this.moveCosts[7].text = square.terrain.movementCost.transport.toString();

            for (let bitmapText of this.moveCosts)
                if (bitmapText.text == "0")
                    bitmapText.text = '-';

            // Hide capture meter if not hovering over a building
            this.tileCaptureIcon.visible = this.tileCaptureMeter.visible = (square.terrain.building);

            // Gather unit information.
            this.windowUnit.visible = false;
        }
    }
}