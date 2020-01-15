import { UnitObject } from "./UnitObject";
import { PointPrimitive, Point } from "../Common/Point";
import { Slider } from "../Common/Slider";
import { Game } from "../..";
import { CardinalDirection, CardinalVector } from "../Common/CardinalDirection";
import { Debug } from "../DebugUtils";

export class TrackCar {

    //enabled: boolean = false;               // Whether or not this object processes.
    private started = false;                // Whether this object's update process is doing so.

    tileSize: number = Game.display.standardLength; // Conversion factor from board points to world points.

    startPoint: Point = new Point(0,0);     // The source board location our sprite is moving from.
    curPoint: Point = new Point(0,0);       // The current board location our sprite is at/moving from.
    nextMove: Point = new Point(0,0);       // Relative point to curPoint.

    directions: CardinalDirection[];        // The list of directions from the source point to the final destination.
    directionIndex: number = 0;             // The current direction this animator is working on.

    moveSlider = new Slider({               // Incremental tile-to-tile slide animation controller.
        granularity: 1 / 5                  // 1 over number of frames
    });

    car = new PIXI.Container();             // The traveling car.
    sprite: PIXI.AnimatedSprite;            // The car passenger representing the moving sprite.
    leftFacing: boolean;                    // Whether the idle, before-transit-has-begun sprite is facing left or right.
    movementSpriteSet: {
        up: PIXI.Texture[],
        down: PIXI.Texture[],
        left: PIXI.Texture[]
    };

    /**
     * @param startPos Where on the game board this track car begins its journey.
     * @param directions The set of orthogonal instructions leading from start to end.
     * @param type Which unit-kind is being traveled.
     * @param leftFacing Whether to reverse the horizontal, idle sprite-facing before travel has begun.
     */
    constructor(startPos: PointPrimitive, directions: CardinalDirection[], type: UnitObject, leftFacing: boolean) {
        this.startPoint = new Point(startPos);
        this.directions = directions;
        this.leftFacing = leftFacing;
        this.movementSpriteSet = type.movementAnimations;

        // Create the on-screen sprite and place it in-world.
        this.sprite = new PIXI.AnimatedSprite(this.movementSpriteSet.left);
        let runningInterval = 6.25;     // Frames-per-texture-update for soldier units.
        let vehicleInterval = 4;        // "…" for vehicle units.
        let frameTick = type.soldierUnit ? runningInterval : vehicleInterval;
        this.sprite.animationSpeed = 1 / frameTick;     // 1 over frames-per-texture-update
        this.sprite.play();
        this.car.addChild(this.sprite);
        Game.stage.addChild(this.car);       // Car must be on top of all other board iconography

        // Set animation state to starting conditions.
        this.reset();
    }

    /** Dismantles this object and its dependencies. */
    destroy() {
        this.stop();
        this.car.destroy({children: true});
    }

    /* True if this moving animation has completed its journey. */
    get finished(): boolean {
        return (this.directionIndex >= this.directions.length);
    }

    /** Empties this TrackCar's properties. */
    reset(): void {
        this.curPoint = this.startPoint;
        this.directionIndex = -1;       // 'next' instruction is 0th
        this.prepareNextInstruction();
        this.setFacing( this.leftFacing ? CardinalDirection.West : CardinalDirection.East );
        this.updateWorldPosition();
        this.stop();                    // If already started, stop and idle at starting point.
    }

    /** Starts the movement animation from current board location to final destination. */
    start(): void {
        if (this.started)
            return;

        this.started = true;
        this.directionIndex--;  // Re-initiate the current instruction.
        this.prepareNextInstruction();
        Game.scene.ticker.add(this.update, this);
    }

    /** Halts the animation by removing update processes from the game loop. */
    stop(): void {
        this.started = false;
        Game.scene.ticker.remove(this.update, this);
    }

    /** Skips to the end of the animation. */
    skip(): void {
        while (!this.finished) {
            this.curPoint = this.curPoint.add(this.nextMove);
            this.prepareNextInstruction();
        }
        this.updateWorldPosition();
    }

    /** Incremental frame update function. */
    private update(): void {
        // Skip if 'turned off'
        if (this.finished)
            return;

        this.moveSlider.increment();

        if (this.moveSlider.track == this.moveSlider.max) {
            this.moveSlider.track = this.moveSlider.min;
            this.curPoint = this.curPoint.add(this.nextMove);
            this.prepareNextInstruction();  // update this.nextMove
        }

        // Update the sprite's world position — I'm skipping the pixel-fix step; no LowResTransform.    Truly, it would be better to build that pixel-fixing into the graphics engine.
        this.updateWorldPosition();
    }

    /** Update the on-screen sprite's world position. */
    private updateWorldPosition() {
        this.car.x = (this.curPoint.x + this.nextMove.x * this.moveSlider.value) * this.tileSize;
        this.car.y = (this.curPoint.y + this.nextMove.y * this.moveSlider.value) * this.tileSize;
    }

    /** Returns a 2D movement-vector representing the next instructional step, and changes the car's sprite facing accordingly. */
    private prepareNextInstruction() {
        this.directionIndex++;

        if (!this.finished) {
            let dir = this.directions[this.directionIndex];
            this.nextMove = CardinalVector(dir);
            this.setFacing(dir);
        }
        else
            this.nextMove = new Point(0,0);
    }

    /** Sets the car-passenger's facing according to the given direction. */
    private setFacing(dir: CardinalDirection) {
        // Assume no flipping.
        this.sprite.scale.x = 1;
        this.sprite.x = 0;

        switch (dir) {
            case CardinalDirection.North:
                this.sprite.textures = this.movementSpriteSet.up;
                break;
            case CardinalDirection.South:
                this.sprite.textures = this.movementSpriteSet.down;
                break;
            case CardinalDirection.East:
                this.sprite.textures = this.movementSpriteSet.left;
                this.sprite.scale.x = -1;       // Flip left-facing sprites.
                this.sprite.x = this.tileSize;  // Correct for flipping about the origin.
                break;
            case CardinalDirection.West:
                this.sprite.textures = this.movementSpriteSet.left;
                break;
        }

        this.sprite.play();
    }
}