import { RectanglePrimitive } from "./Rectangle";
import { ImmutablePointPrimitive } from "./Point";

type Graphics = PIXI.Graphics;

/** Common operations used when manipulating Pixi's Graphics objects.
 * Provides shortcuts to drawing common shapes and effects. */
export module PixiGraphics {

  /** Returns the given, or a new, PIXI.Graphics object.
   * Useful to confirm a real object is always being manipulated. */
  function confirmGraphicsObject(g?: Graphics): Graphics {
    return g ?? new PIXI.Graphics();
  }

  /** Draws a rectangle with the given Graphics object. */
  export function drawRect(g: Graphics, rect: RectanglePrimitive, color: number, alpha?: number): Graphics {
    // g = confirmGraphicsObject(g);
      // TODO How should g be optional? It's the first parameter.
    g.beginFill(color, alpha ?? 1);
    g.drawRect(rect.x, rect.y, rect.width, rect.height);
    g.endFill();
    return g;
  }

  /**  */
  export function drawLine(g: Graphics, start: ImmutablePointPrimitive, end: ImmutablePointPrimitive, color: number, alpha?: number): Graphics {
    // stub — I'm not sure how to do this one. Not at any angle.
    return g;
  }

}