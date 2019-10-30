import * as PIXI from "pixi.js";
import { Point } from "../CommonTypes";
import { Map } from "./Map";
import { Game } from "../..";
import { VirtualGamepad } from "../controls/VirtualGamepad";
import { Common } from "../CommonUtils";
import { LowResTransform } from "../LowResTransform";

/**
 * @author Dei Valko
 */
export class MapCursor {
    static readonly spritesheet = 'UISpritesheet';
    static readonly animSpeed = 0.4;
    static readonly animInterval = 45;
    animTime = 0;

    static readonly moveTime_initial = 10;
    static readonly moveTime_repeated = 3;
    moveTime = 0;

    pos: Point;
    transform: LowResTransform;
    mapRef: Map;
    controller: VirtualGamepad;
    spriteLayer = new PIXI.Container();

    constructor(map: Map, gp: VirtualGamepad) {
        this.pos = {x:0,y:0};
        this.transform = new LowResTransform(this.pos);
        this.mapRef = map;      // A reference to the map object this object cursors.
        this.controller = gp;   // A reference to the controller operating this object.
        // TODO Get the controller from Game.player[0] or something.

        // Set up the cursor's imagery
        let sheet = Game.app.loader.resources[ MapCursor.spritesheet ].spritesheet;

        let cursor = new PIXI.AnimatedSprite(sheet.animations['mapcursor']);
        cursor.animationSpeed = MapCursor.animSpeed;
        cursor.loop = false;

        let arrow = new PIXI.AnimatedSprite(sheet.animations['mapcursor-arrow']);
        arrow.animationSpeed = MapCursor.animSpeed;
        arrow.loop = false;

        this.spriteLayer.addChild(cursor);
        this.spriteLayer.addChild(arrow);

        // Add the created image layer to relevant places
        this.transform.object = this.spriteLayer;
        Game.hud.addChild(this.spriteLayer);

        // Add a ticker to manage animation
        Game.app.ticker.add( (delta: number) => this.updateAnimation(delta) );
    }

    destroy() {
        this.transform.destroy();
        Game.app.ticker.remove( this.updateAnimation ); // FIXME This shouldn't even work.
        // I think I have to wrap it in a nameless f because of context (this).
        // It might be easier to just ask Game.app.ticker to purge itself on scene end.
    }

    updateAnimation(delta: number) {
        this.animTime += delta;
        if (this.animTime > MapCursor.animInterval) {
            this.animTime -= MapCursor.animInterval;
            this.spriteLayer.children.forEach( displayObj => {
                (displayObj as PIXI.AnimatedSprite).gotoAndPlay(0);
            });
        }
    }

    update(delta: number) {
        if (this.controller.dpadDown) {
            if (this.moveTime == MapCursor.moveTime_initial)
                this.move(this.controller.dpadAxis);
            else if (this.moveTime < 0) {
                this.move(this.controller.dpadAxis);
                this.moveTime = MapCursor.moveTime_repeated;
            }
            this.moveTime -= delta;
        }
        else
            this.moveTime = MapCursor.moveTime_initial;
    }

    move(dir: Point) {
        this.pos.x += dir.x;
        this.pos.y += dir.y;
        Common.confine(this.pos.x, 0, this.mapRef.width);
        Common.confine(this.pos.y, 0, this.mapRef.height);

        let tileSize = Game.display.standardLength;
        let realPos = {x: this.pos.x * tileSize, y: this.pos.y * tileSize};
        this.transform.pos = realPos;
    }
}