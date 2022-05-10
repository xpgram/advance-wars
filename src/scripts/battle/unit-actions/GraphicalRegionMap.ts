import { PIXI } from "../../../constants";
import { Palette } from "../../color/ColorPalette";
import { CardinalDirection, CardinalVector } from "../../Common/CardinalDirection";
import { Point } from "../../Common/Point";
import { Rectangle } from "../../Common/Rectangle";
import { RegionMap } from "./RegionMap";

/** Returns a PIXI.Graphics object which bounds a given RegionMap (projected to
 * cellSize) with a white line. */
export function buildBoundedRegionMapObject(region: RegionMap, cellSize: number) {
  const g = new PIXI.Graphics();

  region = region.fill(new Point());

  for (const p of region.points) {
    const sides = [] as CardinalDirection[];
    [
      CardinalDirection.North,
      CardinalDirection.South,
      CardinalDirection.West,
      CardinalDirection.East
    ].forEach( cardinal => {
      const vector = CardinalVector(cardinal);
      if (!region.get(p.add(vector)))
        sides.push(cardinal);
    })
    drawBoundedSquare(g, p, sides, cellSize);
  }

  return g;
}

function drawBoundedSquare(g: PIXI.Graphics, location: Point, sides: CardinalDirection[], length: number) {
  const light = Palette.white;
  const dark = Palette.blueprint;

  type LineRects = Record<CardinalDirection, Rectangle>

  const outerLines = {} as LineRects;
  outerLines[CardinalDirection.North] = new Rectangle(0,-1,length,1);
  outerLines[CardinalDirection.South] = new Rectangle(0,length,length,1);
  outerLines[CardinalDirection.East] = new Rectangle(length,0,1,length);
  outerLines[CardinalDirection.West] = new Rectangle(-1,0,1,length);

  const innerLines = {} as LineRects;
  innerLines[CardinalDirection.North] = new Rectangle(0,0,length,1);
  innerLines[CardinalDirection.South] = new Rectangle(0,length,length,-1);
  innerLines[CardinalDirection.East] = new Rectangle(length,0,-1,length);
  innerLines[CardinalDirection.West] = new Rectangle(0,0,1,length);

  location = location.multiply(length);

  function drawSides(lineRects: LineRects) {
    for (const side of sides) {
      const rect = lineRects[side];
      rect.x += location.x;
      rect.y += location.y;
      g.drawRect(rect.x, rect.y, rect.width, rect.height);
    }
  }

  g.beginFill(light);
  drawSides(outerLines);  
  g.endFill();

  g.beginFill(dark);
  drawSides(innerLines);
  g.endFill();
}