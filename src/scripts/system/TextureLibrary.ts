import { StringDictionary } from "../CommonTypes"
import { Debug } from "../DebugUtils";

/** A simple key-value dictionary for pre-calculated textures.
 * This is intended to be a store for expensive textures that may be re-used
 * throughout a scene during a single frame, or any frame if you can manage that. */
export class TextureLibrary {

  private library: StringDictionary<PIXI.Texture> = {};

  /** Records the given ID within the library and assigns it the given texture. */
  register(...textures: {id: string, texture: PIXI.Texture}[]): void {
    textures.forEach( texture => {
      const cur = this.library[texture.id];
      Debug.assert(cur === undefined,
        `TextureLibrary ID ${texture.id} is being overwritten.`);
      if (!cur)
        this.library[texture.id] = texture.texture;
    });
  }

  /** Updates a recorded ID with a new texture. New additions are not excluded. */
  update(...textures: {id: string, texture: PIXI.Texture}[]): void {
    textures.forEach( texture => {
      this.library[texture.id] = texture.texture;
    });
  }

  /** Returns true if the given ID is already recorded within the library. */
  hasId(id: string): boolean {
    return Boolean(this.library[id]);
  }

  /** Returns the texture held under the given id string, or undefined if one isn't. */
  get(id: string): PIXI.Texture {
    return this.library[id];
  }

  /** Forgets all textures help up to this moment. */
  flush(): void {
    Object.keys(this.library).forEach( key => {
      delete this.library[key];   // TODO Is this doing anything the GC isn't?
    });                           // My work laptop has problems, I assumed this fixed them.
    this.library = {};
  }
}