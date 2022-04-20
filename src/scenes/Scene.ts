import * as PIXI from "pixi.js";
import { Game } from "..";
import { Debug } from "../scripts/DebugUtils";

class ResourceError extends Error {
  name = 'ResourceError';
}

/**
 * @author Dei Valko
 * @version 1.0.1
 */
export abstract class Scene {
  private static readonly UNBUILT = 0;
  private static readonly BUILDING = 1;
  private static readonly READY = 2;
  private state: number;

  protected linker: { name: string, url: string }[] = [];

  /** Whether the scene object still needs to set up its constructs. */
  get mustInitialize() { return this.state == Scene.UNBUILT; };
  /** Whether the scene object is set up and ready to be used. */
  get ready() { return this.state == Scene.READY; };

  /** Whether this scene's update steps are allowed to update. */
  private halted = false;

  /** Volatile ticker used to update object processes during the scene. Destroyed on scene closing. */
  get ticker(): PIXI.Ticker {
    if (!this._ticker)
      throw new Error("Attempted to access the scene's destroyed ticker.");
    return this._ticker;
  }
  private _ticker: PIXI.Ticker | null = null;

  /** Link URLs to the scene's depended resources.
   * Also a useful access library for resource names within the IResourceDictionary. */
  static readonly resourceLinks: Record<string, string>;

  /** Link URLs to the scene's depended typeface resources. */
  // TODO Extract Y from Record<T,Y> as a BitmapFont type object.
  static readonly resourceFonts: Record<string, {fontName: string, fontSize: number}>;

  /** Volatile reference to the scene's loaded resources. */
  get resources(): PIXI.IResourceDictionary {
    if (!this._resources)
      throw new Error("Attempted to access the scene's destroyed resources.");
    return this._resources;
  }
  private _resources: PIXI.IResourceDictionary | null = null;

  /** Returns a spritesheet from the scene's resource dictionary.
   * @throws ResourceError when the spritesheet referred to by 'name' does not exist. */
  getSpritesheet(name: string): PIXI.Spritesheet {
    const sheet = this.resources[name].spritesheet as PIXI.Spritesheet;
    if (sheet === undefined)
      throw new ResourceError(`Cannot find spritesheet '${name}'`);
    return sheet;
  }

  /** Returns a dictionary of Texture objects from the named spritesheet.
   * @throws ResourceError when the spritesheet referred to by 'sheet' does not exist. */
  texturesFrom(sheet: string) {
    return this.getSpritesheet(sheet).textures;
  }

  /** Returns a dictionary of lists of in-sequence Texture objects from the named spritesheet.
   * @throws ResourceError when the spritesheet referred to by 'sheet' does not exist. */
  animationsFrom(sheet: string) {
    return this.getSpritesheet(sheet).animations;
  }


  constructor() {
    this.state = Scene.UNBUILT;
  }

  /** Initialize step sets up the scene and readies it for the game-loop. */
  init() {
    if (this.state == Scene.UNBUILT) {
      this._ticker = new PIXI.Ticker();
      this._ticker.start();
      this.load(); // → setup → ready
    }
    else
      throw new Error("Attempted to reconstruct a constructed scene.");
  }

  /** Destroy step disassembles the scene object and un-readies it for game-looping. */
  destroy() {
    if (this.state == Scene.READY) {
      if (this._ticker) this._ticker.destroy();
      this._ticker = null;
      this.destroyStep();
      this.state = Scene.UNBUILT;
    } else
      throw new Error("Attempted to destroy an unconstructed scene.");
  }

  /** Collects resource links from inheriting scene, then loads them
   * with a provided callback to setup() on completion. */
  private load() {
    Game.loader.reset();                // Empty contents.
    Game.loader.reset();                // Let go of any callbacks we may have added.
    this.loadStep();                        // Collects resource URLs into this.linker[]
    this.linker.forEach(link => Game.loader.add(link.name, link.url) );
    this.state = Scene.BUILDING;            // Prevent calls to init() and update() while loading.

    const onComplete = () => {
      this._resources = Game.loader.resources;
      this.setup()
    }

    Game.loader.load().onComplete.once(onComplete);
    if (this.linker.length === 0)     // .onComplete is never triggered if there are no assets.
      onComplete();
  }

  /** Runs the inheriting scene's setup step, then readies the scene for
   * frame-by-frame updating. */
  private setup() {
    this.setupStep();
    this.state = Scene.READY;
  }

  /** Update step describes frame-by-frame events. */
  update() {
    if (!this.halted && this.state == Scene.READY)
      this.updateStep();
  }

  /** Stops this scene's update mechanisms.
   * Probably don't call this downline from scene.update() */
  halt() {
    this.halted = true;
    this._ticker?.stop();
  }

  /** Un-stops this scene's update mechanisms.
   * Unreachable downline from scene.update() */
  unhalt() {
    this.halted = false;
    this._ticker?.start();
  }

  protected abstract loadStep(): void;
  protected abstract setupStep(): void;
  protected abstract updateStep(): void;
  protected abstract destroyStep(): void;
}