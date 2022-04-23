import * as PIXI from "pixi.js";
import { Game } from "..";
import { Common } from "../scripts/CommonUtils";
import { Debug } from "../scripts/DebugUtils";

const DOMAIN = "Scene";

class ResourceError extends Error {
  name = 'ResourceError';
}

export type SceneType<T> = {
  new(options: T): Scene;
}

enum ConstructionState {
  Unbuilt,
  Building,
  Ready,
  Destroyed,
}


/**
 * Describes the maintenance logic of a scene object.
 * These are manipulated by Game to control which mode of the program is currently operating.
 * You might think of them like different rooms or different pages in the application.
 * @author Dei Valko
 * @version 1.1.0
 */
export abstract class Scene {

  private state = ConstructionState.Unbuilt;

  protected linker: { name: string, url: string }[] = [];

  /** Whether the scene object still needs to set up its constructs. */
  get mustInitialize() { return this.state === ConstructionState.Unbuilt; };
  /** Whether the scene object is set up and ready to be used. */
  get ready() { return this.state === ConstructionState.Ready; };
  /** Whether the scene object is dismantled and unusable. */
  get destroyed() { return this.state === ConstructionState.Destroyed; };

  /** Whether this scene's update steps are allowed to update. */
  private halted = false;

  /** Volatile ticker used to update object processes during the scene. Destroyed on scene closing. */
  get ticker(): PIXI.Ticker {
    if (!this._ticker)
      throw new Error("Attempted to access the scene's destroyed ticker.");
    return this._ticker;
  }
  private _ticker: PIXI.Ticker;

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

  /** A container for the scene's visual layers. */
  readonly visualLayers = Common.freezeObject({
    /** Root visual layer. All other layers for this scene are some nth-level member of this container. */
    root: new PIXI.Container(),
    /** A member of root. This is where the game's universe is located. */
    world: new PIXI.Container(),
    /** A member of world. This appears behind stage and is intended for skies and background art. */
    backdrop: new PIXI.Container(),
    /** A member of world. This is the world the game takes place in. */
    stage: new PIXI.Container(),
    //foreground: new PIXI.Container(),
    /** A member of root. This is where the game's user interface is located. */
    hud: new PIXI.Container(),
    /* debugHud will stay in Game */
  });


  constructor() {
    const { root, world, backdrop, stage, hud } = this.visualLayers;
    world.addChild(backdrop, stage);
    root.addChild(world, hud);
  }

  /** Initialize step sets up the scene and readies it for the game-loop. */
  init() {
    if (this.state == ConstructionState.Unbuilt) {
      this._ticker = new PIXI.Ticker();
      this._ticker.start();
      this.load(); // → setup → ready
    }
    else
      throw new Error("Attempted to reconstruct a constructed scene.");
  }

  /** Destroy step disassembles the scene object and un-readies it for game-looping. */
  destroy() {
    if (this.state == ConstructionState.Ready) {
      Debug.log(DOMAIN, "Destroy", {message: `Disassembling '${this.constructor.name}'`})
      this.destroyStep();
      (this._ticker) && this._ticker.destroy();
      this.visualLayers.root.destroy({children: true});
      this.state = ConstructionState.Destroyed;
    } else
      throw new Error("Attempted to destroy an unconstructed scene.");
  }

  /** Collects resource links from inheriting scene, then loads them
   * with a provided callback to setup() on completion. */
  private load() {
      // TODO Do I really have to call this twice?
    Game.loader.reset();                // Empty contents.
    Game.loader.reset();                // Let go of any callbacks we may have added.
      // TODO Automate this by mapping this.linker into whatever. I have plans written in BattleScene.
    this.loadStep();                    // Collects resource URLs into this.linker[]
    this.linker.forEach(link => Game.loader.add(link.name, link.url) );
    this.state = ConstructionState.Building;  // Prevent calls to init() and update() while loading.

    const onComplete = () => {
      this._resources = Game.loader.resources;
      this.setup()
    }

    if (this.linker.length > 0)
      Game.loader.load().onComplete.once(onComplete);
    else
      onComplete();
  }

  /** Runs the inheriting scene's setup step, then readies the scene for
   * frame-by-frame updating. */
  private setup() {
    this.setupStep();
    this.state = ConstructionState.Ready;
  }

  /** Update step describes frame-by-frame events. */
  update() {
    if (!this.halted && this.state == ConstructionState.Ready)
      this.updateStep();
  }

  /** Stops this scene's update mechanisms.
   * Warning: If calling this from within scene.update(), you will be unable to resume
   * without the help of a third-party service. */
  halt() {
    this.halted = true;
    this._ticker?.stop();
  }

  /** Resumes this scene's update mechanisms.
   * Unreachable from within scene.update() */
  resume() {
    this.halted = false;
    this._ticker?.start();
  }

  protected abstract loadStep(): void;
  protected abstract setupStep(): void;
  protected abstract updateStep(): void;
  protected abstract destroyStep(): void;
}