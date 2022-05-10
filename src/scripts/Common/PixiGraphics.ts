import { PIXI } from "../../constants";
import { RectanglePrimitive } from "./Rectangle";
import { ImmutablePointPrimitive } from "./Point";

/** Common operations used when manipulating Pixi's Graphics objects.
 * Provides shortcuts to drawing common shapes and effects. */
export module PixiGraphics {

  /** Draws a rectangle with the given Graphics object. */
  export function drawRect(g: PIXI.Graphics, rect: RectanglePrimitive, color: number, alpha?: number): PIXI.Graphics {
    g.beginFill(color, alpha ?? 1);
    g.drawRect(rect.x, rect.y, rect.width, rect.height);
    g.endFill();
    return g;
  }

  /**  */
  export function drawLine(g: PIXI.Graphics, start: ImmutablePointPrimitive, end: ImmutablePointPrimitive, color: number, alpha?: number): PIXI.Graphics {
    // stub — I'm not sure how to do this one. Not at any angle.
    return g;
  }

}