import { PIXI } from "../../../constants";
import { Game } from "../../..";
import { TerrainObject } from "./TerrainObject";
import { UnitObject } from "../UnitObject";
import { Terrain } from "./Terrain";
import { MapLayer } from "./MapLayers";
import { TerrainBuildingObject } from "./TerrainBuildingObject";
import { Map } from "./Map";
import { Point } from "../../Common/Point";
import { NeighborMatrix } from "../../NeighborMatrix";
import { CardinalDirection } from "../../Common/CardinalDirection";
import { Common } from "../../CommonUtils";
import { ArmorType, MoveType } from "../EnumTypes";
import { BitIO, BitMask } from "../../Common/BitIncrementer";

/**
 * Used by Map only. Maybe.
 * Generally a container for map information, but also self-manages appearance for UI purposes, etc.
 * 
 * @author Dei Valko
 * @version 0.1.1
 */
export class Square {

  /** A reference to the game board this Square is a member of. */
  private map: Map;

  /** This Square's x-coordinate on the game board. */
  readonly x: number;

  /** This Square's y-coordinate on the game board. */
  readonly y: number;

  /** A point object representing this square's positional coordinates on the map. */
  get boardLocation(): Point { return new Point(this.x,this.y); }

  /** The terrain object associated with this board location object. */
  get terrain() { return this._terrain; }
  set terrain(terr: TerrainObject) {
    this._terrain = terr;
  }
  private _terrain!: TerrainObject;

  /** The unit object inhabiting this board location object. */
  get unit() { return this._unit; }
  set unit(unitObj: UnitObject | undefined) {
    const oldUnit = this._unit;
    this._unit = unitObj;

    if (this._unit)
      MapLayer('top', this.y, 'unit').addChild(this._unit.sprite);
    if (oldUnit) {
      const container = MapLayer('top', this.y, 'unit');
      container.removeChild(oldUnit.sprite);
    }

    if (this._unit !== oldUnit)
      this.hideUnit = false;
  }
  private _unit?: UnitObject;

  /** The tinted-glass tile highlight that informs the player what actions or information is available for this square. */
  private overlayPanel = new PIXI.Sprite();

  /** The arrow-path layer which, by segment, informs the player what path a travelling unit would intend to take. */
  private overlayArrow = new PIXI.Sprite();

  /** Whether to show the spotlight effect over this tile's overlay panel. */
  private showSpotlight = false;

  /** A 32-bit number representing all or most of Square's relevant information. */
  private displayInfo = 0;

  // Constants/accessor-values for displayInfo
  private static readonly directionLength = 3;
  private static readonly tempLength = 4;
  private static readonly bitmask = Common.freezeObject({
    moveable: BitIO.Generate(1, 0),
    attackable: BitIO.Generate(1),
    targetable: BitIO.Generate(1),
    dangerous: BitIO.Generate(1),
    hidden: BitIO.Generate(1),
    hideUnit: BitIO.Generate(1),
    arrowFrom: BitIO.Generate(Square.directionLength),
    arrowTo: BitIO.Generate(Square.directionLength),
    showDropArrow: BitIO.Generate(1),
    temp: BitIO.Generate(Square.tempLength),
    tempFlag: BitIO.Generate(1),
    visitedFlag: BitIO.Generate(1),
  });


  constructor(map: Map, x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.terrain = new Terrain.Void();
    this.map = map;
  }

  /** Destroys this object and its children. */
  destroy() {
    this.terrain.destroy();
    if (this.unit)
      this.unit.destroy();
    //@ts-expect-error
    this.map = undefined;
    Game.scene.ticker.remove(this.autoUpdateOverlayPanelTexture, this);
  }

  /** Staggers the texture update calculator to reduce frame-by-frame workload. */
  private autoUpdateOverlayPanelTexture() {
    if (Game.frameCount % 3 === 0)
      this.updateOverlayPanelTexture();
  }

  /** Retrieves the next frame for this tile's overlay panel. */
  private updateOverlayPanelTexture() {
    if (!this.overlayPanel.visible)
      return;
    this.overlayPanel.texture = (this.showSpotlight)
      ? this.terrain.getOverlayTexture(this.terrain.shapeId)
      : TerrainObject.getWhitemask(this.terrain.shapeId);
  }

  /** This method sets up terrain graphics, grabs its white texture, etc.
   * I'm trying to figure out, between this class and Map, which *should*
   * hold responsibility over what, though. */
  finalize(neighbors: NeighborMatrix<TerrainObject>) {
    const tileSize = Game.display.standardLength;

    // Terrain Graphic Layer
    const worldPos = {
      x: this.x * tileSize,
      y: this.y * tileSize,
      z: Map.calculateZIndex({ x: this.x, y: this.y })
    };
    this.terrain.init(neighbors, worldPos);

    // TODO When calling finalize() twice, confirm that the below instructions only move
    //   known components and do not duplicate any structures.

    // Overlay Panel
    MapLayer('top', this.y, 'glass-tile').addChild(this.overlayPanel);
    this.overlayPanel.position.set(worldPos.x, worldPos.y);
    this.overlayPanel.anchor.set(0,.5);

    // Overlay panel continuous texture update step
    Game.scene.ticker.add(this.autoUpdateOverlayPanelTexture, this);

    // Arrow Layer
    MapLayer('ui').addChild(this.overlayArrow);
    this.overlayArrow.position.set(worldPos.x, worldPos.y);
    this.overlayArrow.zIndex = 10;  // Puts arrows above unit info. // TODO Put this in a function somewhere? Like Map.calculateZIndex()?

    this.updateHighlight();
  }

  /**
   * Writes bits to the object's information number. All JS numbers are 64-bit.
   * @param length The length of the bit-mask.
   * @param shift How far left the bit-mask is applied.
   * @param value The value to write into info (overages are not possible; mask is applied to value, too).
   */
  private displayInfoSet(value: number, bitmask: BitMask, retriggerUI: boolean = true) {
    this.displayInfo = BitIO.WriteBits(this.displayInfo, value, bitmask);
    if (retriggerUI) {
      this.updateHighlight();
      this.updateArrows();
    }
  }

  /** Whether this tile is reachable by a traveling unit. */
  get moveFlag(): boolean {
    const bitmask = Square.bitmask.moveable;
    return BitIO.GetBoolean(this.displayInfo, bitmask);
  }
  /** Whether this tile is attackable by a unit. */
  get attackFlag(): boolean {
    const bitmask = Square.bitmask.attackable;
    return BitIO.GetBoolean(this.displayInfo, bitmask);
  }
  /** Whether this tile is targetable for some action. */
  get targetFlag(): boolean {
    const bitmask = Square.bitmask.targetable;
    return BitIO.GetBoolean(this.displayInfo, bitmask);
  }
  /** Whether this tile is attackable by enemy troops. */
  get dangerFlag(): boolean {
    const bitmask = Square.bitmask.dangerous;
    return BitIO.GetBoolean(this.displayInfo, bitmask);
  }
  /** Whether this tile's contents are obscured by Fog of War. */
  get hiddenFlag(): boolean {
    const bitmask = Square.bitmask.hidden;
    return BitIO.GetBoolean(this.displayInfo, bitmask);
  }
  /** Whether this square should hide its unit if one is present. */
  get hideUnit(): boolean {
    const bitmask = Square.bitmask.hideUnit;
    return BitIO.GetBoolean(this.displayInfo, bitmask);
  }
  /** The from direction of the movement arrow splice. Range 0–4: none, up, right, down, left. */
  get arrowFrom(): number {
    const bitmask = Square.bitmask.arrowFrom;
    return BitIO.ReadBits(this.displayInfo, bitmask);
  }
  /** The to direction of the movement arrow splice. Range 0–4: none, up, right, down, left. */
  get arrowTo(): number {
    const bitmask = Square.bitmask.arrowTo;
    return BitIO.ReadBits(this.displayInfo, bitmask);
  }
  /** Whether to show the drop-arrow sprite family instead of the normal movement arrows. */
  get showDropArrow(): boolean {
    const bitmask = Square.bitmask.showDropArrow;
    return BitIO.GetBoolean(this.displayInfo, bitmask);
  }
  /** Temporary store: A 4-bit number (value range -1–14) useful in search algorithms. */
  get value(): number {
    const bitmask = Square.bitmask.temp;
    return BitIO.ReadBits(this.displayInfo, bitmask) - 1;  // -1 modifies the numeric range to allow for -1 as a value.
  }
  /** Temporary store: A boolean value useful in search algorithms. */
  get flag(): boolean {
    const bitmask = Square.bitmask.tempFlag;
    return BitIO.GetBoolean(this.displayInfo, bitmask);
  }
  /** Temporary store: A boolean value describing whether this tile has been seen by the algorithm. */
  get visited(): boolean {
    const bitmask = Square.bitmask.visitedFlag;
    return BitIO.GetBoolean(this.displayInfo, bitmask);
  }

  set moveFlag(value) {
    const bitmask = Square.bitmask.moveable;
    this.displayInfoSet(~~value, bitmask);
  }
  set attackFlag(value) {
    const bitmask = Square.bitmask.attackable;
    this.displayInfoSet(~~value, bitmask);
  }
  set targetFlag(value) {
    const bitmask = Square.bitmask.targetable;
    this.displayInfoSet(~~value, bitmask);
  }
  set dangerFlag(value) {
    const bitmask = Square.bitmask.dangerous;
    this.displayInfoSet(~~value, bitmask);
  }
  set hiddenFlag(value) {
    const bitmask = Square.bitmask.hidden;
    this.displayInfoSet(~~value, bitmask);
  }
  set hideUnit(value) {
    const bitmask = Square.bitmask.hideUnit;
    this.displayInfoSet(~~value, bitmask);
  }
  set arrowFrom(value) {
    const bitmask = Square.bitmask.arrowFrom;
    this.displayInfoSet(value, bitmask);
  }
  set arrowTo(value) {
    const bitmask = Square.bitmask.arrowTo;
    this.displayInfoSet(value, bitmask);
  }
  set showDropArrow(value) {
    const bitmask = Square.bitmask.showDropArrow;
    this.displayInfoSet(~~value, bitmask);
  }
  set value(n: number) {
    const bitmask = Square.bitmask.temp;
    this.displayInfoSet(n + 1, bitmask, false); // +1 unmodifies the numeric range to allow for -1 as a value.
  }
  set flag(b: boolean) {
    const bitmask = Square.bitmask.tempFlag;
    this.displayInfoSet(~~b, bitmask, false);
  }
  set visited(b: boolean) {
    const bitmask = Square.bitmask.visitedFlag;
    this.displayInfoSet(~~b, bitmask, false);
  }

  /** Updates the tile overlay to reflect whatever UI state the tile is in. */
  private updateHighlight(): void {
    if (!this.terrain)
      return;

    // Define glassy-overlay presets.
    const colors = {
      natural:  { color: 0xFFFFFF, alpha: 0.50, mode: PIXI.BLEND_MODES.NORMAL, spotlight: false },
      green:    { color: 0x44CCAA, alpha: 0.50, mode: PIXI.BLEND_MODES.NORMAL, spotlight: true },
      red:      { color: 0xFF6666, alpha: 0.55, mode: PIXI.BLEND_MODES.NORMAL, spotlight: true },
      maroon:   { color: 0xFF77FF, alpha: 0.50, mode: PIXI.BLEND_MODES.NORMAL, spotlight: true },
      grey:     { color: 0x222222, alpha: 0.25, mode: PIXI.BLEND_MODES.MULTIPLY, spotlight: false },  // CO Affected, // TODO Animate shades
      darkgrey: { color: 0x000000, alpha: 0.40, mode: PIXI.BLEND_MODES.MULTIPLY, spotlight: false },
      shape:    { color: 0xFFFFFF, alpha: 1.00, mode: PIXI.BLEND_MODES.NORMAL, spotlight: false }     // Show white mask sprite
    }
    type ColorOptions = typeof colors.natural;

    // Adjusts the look of the glassy overlay to some preset.
    const setColor = (options: ColorOptions) => {
      this.overlayPanel.tint = options.color;
      this.overlayPanel.alpha = options.alpha;
      this.overlayPanel.blendMode = options.mode;
      this.overlayPanel.visible = true;
      this.showSpotlight = options.spotlight;
    }

    // Hidden by default
    this.overlayPanel.visible = false;

    // Choose glassy overlay preset
    if (this.moveFlag)        setColor(colors.green);
    else if (this.attackFlag) setColor(colors.red);
    else if (this.targetFlag) setColor(colors.green);
    else if (this.dangerFlag) setColor(colors.maroon);
    else if (this.hiddenFlag) setColor(colors.darkgrey);

    // First frame texture gather.
    this.updateOverlayPanelTexture();

    // Hidden tiles in Fog of War — Hide units and building details
    if (this.terrain instanceof TerrainBuildingObject)
      this.terrain.hidden = this.hiddenFlag;
    if (this.unit)
      this.unit.visible = this.unitVisible();
  }

  /** Updates the tile's arrow-path overlay to reflect its UI state.  */
  private updateArrows() {
    const sheet = Game.scene.getSpritesheet('UISpritesheet');
    this.overlayArrow.visible = false;

    // String array and index accessors——setup to build variation string.
    let variationChars = ['0', '0', '0', '0'];
    let fromIdx = this.arrowFrom - 1;
    let toIdx = this.arrowTo - 1;
    let arrowHeadIdx = (fromIdx + 2) % variationChars.length; // Arrow head exit side is opposite to entrance.

    // Set 'from' direction flag——and 'to' direction flag if path ends here.
    if (this.arrowFrom !== CardinalDirection.None)
      variationChars[fromIdx] = '1';
    // Set 'to' direction flag
    if (this.arrowTo !== CardinalDirection.None)
      variationChars[toIdx] = '1';
    // Set 'to' direction to arrow-head when empty.
    if (this.arrowTo === CardinalDirection.None)
      variationChars[arrowHeadIdx] = '2';

    // Correct the variation string for secondary arrow sprite-family
    if (this.showDropArrow)
      variationChars = variationChars.map( c => (c === '2') ? '1' : c );

    // Assemble string
    const variation = variationChars.join('');

    // If variation is "none", do not configure the new arrow graphic.
    if (variation === '0000')
      return;
    
    // Assemble sprite
    const spriteFamily = (this.showDropArrow)
      ? `drop-overlay`
      : `MovementArrow/movement-arrow`;

    this.overlayArrow.texture = sheet.textures[`${spriteFamily}-${variation}.png`];
    this.overlayArrow.visible = true;
  }

  /** Selectively clear common UI and algorithmic settings. */
  clearValues(options: { tempVals?: boolean, colorFlags?: boolean, arrowPaths?: boolean }) {
    const { tempVals, colorFlags, arrowPaths } = options;

    if (tempVals) {
      this.value = -1;
      this.flag = false;
      this.visited = false;
    }
    if (colorFlags) {
      this.moveFlag = false;
      this.attackFlag = false;
      this.targetFlag = false;
    }
    if (arrowPaths) {
      this.arrowFrom = 0;
      this.arrowTo = 0;
      this.showDropArrow = false;
    }
  }

  /** The neighboring tiles adjacent to this one. */
  get neighbors() {
    return this.map.neighborsAt(this.boardLocation);
  }

  /** The terrain of the tiles neighboring this one. */
  get neighboringTerrain() {
    return this.map.neighboringTerrainAt(this.boardLocation);
  }

  /** Returns true if the given unit may legally inhabit this square. */
  occupiable(unit: UnitObject): boolean {
    const traversable = this.traversable(unit);
    const empty = (!this.unit || this.unit === unit);  // Do not return 'inoccupiable' if the unit is already located there.
    const obscured = !this.unitVisible();
    return traversable && (empty || obscured);
  }

  /** Returns true if the given unit object may legally pass through this square, false
   * only if this square presents an obstruction to the travelling unit. */
  traversable(unit: UnitObject): boolean {
    const legalMovement = (this.terrain.getMovementCost(unit.moveType) > 0);              // Ships ≠ Land, Any ≠ Void Tiles
    const unitAlliedOrEmpty = (!this.unit || this.unit.faction === unit.faction);   // Team ≠ not-Team
    const obscured = !this.unitVisible();
    return legalMovement && (unitAlliedOrEmpty || obscured);
  }

  /** Returns true if the given unit can successfully target this square for attack. */
  // TODO This function is never called. As a consequence, Subs pretend as if they can attack anything on land.
  targetable(actor: UnitObject): boolean {
    if (this.terrain.type === Terrain.Void)
      return false;

    let targetable = false;

    // Describes associations between armortypes and movement types.
    const troopSet = {
      armorTypes: [ArmorType.Infantry],
      moveTypes:  [MoveType.Infantry, MoveType.Mech],
    }
    const treadSet = {
      armorTypes: [ArmorType.Vehicle],
      moveTypes:  [MoveType.Tread, MoveType.TireA, MoveType.TireB],
    }
    const airSet = {
      armorTypes: [ArmorType.Air, ArmorType.Heli],
      moveTypes:  [MoveType.Air],
    }
    const seaSet = {
      armorTypes: [ArmorType.Ship, ArmorType.Sub],
      moveTypes:  [MoveType.Ship, MoveType.Transport],
    }

    /** Returns true if any of the given armor-types is targetable and any of the given
     * move-types may legally inhabit this square. The UnitClass being inferred here is described
     * by the contents of the given lists. */
    const hypothetical = (o: {armorTypes: ArmorType[], moveTypes: MoveType[]}): boolean => {
      const someArmor = o.armorTypes.some( armor => actor.canTargetArmor(armor) );
      const someMove  = o.moveTypes.some( move => this.terrain.getMovementCost(move) > 0 );
      return someArmor && someMove;
    }

    // Check if this _square_ is targetable. If uninhabited, use hypotheticals.
    // (As a visual convenience, treat ally-unit squares as empty)
    if (!this.unit || !this.unitVisible() || this.unit.faction === actor.faction) {
      targetable = (
        actor.canTarget(this.terrain) ||
        hypothetical(troopSet) ||
        hypothetical(treadSet) ||
        hypothetical(airSet)   ||
        hypothetical(seaSet)
      );
    } else {
      targetable = actor.canTarget(this.unit);
    }

    return targetable;
  }

  /** Returns true if the given unit may launch an attack on a unit inhabiting this square.
   * Returns false if there is no inhabiting unit to attack, or if the inhabiting unit is not
   * targetable by the given. */
  attackable(actor: UnitObject): boolean {
    return (this.unit && this.unitVisible())
      ? actor.canTarget(this.unit)
      : actor.canTarget(this.terrain);
  }

  /** Returns true if the unit present here (if any) is hypothetically
   * visible given current settings. */
  unitVisible() {
    return !this.hiddenFlag && !this.hideUnit;
  }

}