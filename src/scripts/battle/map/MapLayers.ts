import { Game } from "../../..";
import { Debug } from "../../DebugUtils";

/** The build instructions for a MapLayer. */
type LayerProperties = {
  key: string,
  rowSegmented?: boolean,
  freezable?: boolean,
  children?: MapLayerOptions[],
}

/** This object defines the map layer structure. */
const layers_config: LayerProperties[] = [
  {key: 'sea'},
  {key: 'bottom', freezable: true},
  {key: 'top', rowSegmented: true, children: [
    {key: 'static', freezable: true},
    {key: 'animated'},
    {key: 'glass-tile'},
    {key: 'unit', movingEntities: true},
  ]},
  {key: 'cloud-shadow'},
  {key: 'ui'},
];

/** A container which pairs a MapLayer's scene graph container, build instructions
 * and descendants. */
class Layer {
  private _path: string[];
  container: Container;
  properties: LayerProperties;
  children: Layer[];
  
  constructor(properties: LayerProperties, parent?: Layer) {
    this.container = new PIXI.Container();
    this.properties = properties;
    this.children = [];
    
    this._path = (parent)
      ? [...parent._path, properties.key]
      : [properties.key];
  }
  
  /** The string serial of this layer's location within the MapLayer system. */
  get path() {
    return this._path.join('/');
  }
  
  /** Builds children layers to the given index (inclusive) assuming that
   * this index will be used to retrieve a layer in the immediate future. */
  private lazyBuildChildren(toIndex: number) {
    // Numeric indexed
    if (this.properties.rowSegmented) {
      for (let i = this.children.length; i <= toIndex; i++) {
        const layer = new Layer({
          key: String(i),
          children: this.properties.children,
        });
        this.container.addChild(layer.container);
      }
    }

    // String indexed
    else {
      for (let i = this.children.length; i < this.properties.children.length; i++) {
        const layer = new Layer(this.properties.children[i]);
        this.container.addChild(layer.container);
      }
    }
  }
  
  /** Returns the Layer object indicated by the given key.
   * Throws an error if the key could not be linked to any children. */
  getChild(key: string | number) {
    function throwError(msg: string) {
      throw new ReferenceError(`Can't parse path ${this.path} by '${key}'; ${msg}`);
    }

    if (!this.properties.children)
      throwError('no children.');

    let idx: undefined | number;
    
    // String indexing
    if (typeof key === 'string') {
      if (this.properties.rowSegmented)
        throwError('layer is row indexed.');
      
      this.lazyBuildChildren(this.properties.children.length - 1);
      idx = this.children.findIndex( child => child.properties.key === key );
      
      if (idx === -1)
        throwError('key does not exist');
    }
    
    // Numeric indexing
    else if (typeof key === 'number') {
      if (!this.properties.rowSegmented)
        throwError('layer is string indexed');
      
      this.lazyBuildChildren(key);
      idx = key;
    }
    
    // Return child (cannot get here with idx == undefined)
    return this.children[idx];
  }
  
  /** Signals this layer and all its children that they should compile
   * and cache the resulting texture. */
  freeze() {
    this.children.forEach( child => child.freeze() );
    this.container.cacheAsBitmap = this.properties.freezable;
  }
  
  /** Signals this layer that it should re-render.
   * Does nothing if this layer is not designated as freezable. */
  update() {
    // this.children.forEach( child => child.update() );
    let prev = this.container.cachAsBitmap;
    this.container.cacheAsBitmap = false;
    this.container.cacheAsBitmap = prev;
  }
}

/** Layer which contains all others. */
let rootLayer: Layer;

/** 
* Globally accessible method for retrieving graphics layers from the map system.
* Must be initialized before use. Use MapLayerFunctions.Init() to initialize.
* 
* @author Dei Valko
* @version 2.0.0
*/
export function MapLayer(...terms: (string | number)[]): MapLayerContainer {
  if (MapLayerFunctions.destroyed)
    throw new Error(`Attempting to access MapLayer system before construction; run MapLayerFunctions.Init() first.`);
  
  let result = rootLayer;

  terms.forEach( term => {
    result = rootLayer.getChild(term);
  });

  return result;
}

/** 
* Extra, helpful methods for handling the MapLayer system.
* 
* @author Dei Valko
* @version 2.0.0
*/
export const MapLayerFunctions = {
  
  destroyed: true,
  
  /** Initializes the MapLayer system for use. 
  * MapLayer system will not be functional before calling this method. */
  Init() {
    if (!this.destroyed)
      return;
    
    rootLayer = new Layer({
      key: 'root',
      children: layers_config,
    })
    Game.stage.addChild(rootLayer.container);
    this.destroyed = false;
  },
  
  /** Frees up the resources held by the MapLayers system.
  * Do not reference graphics containers after calling this method before
  * once again calling the Init() method. */
  Destroy() {
    if (this.destroyed)
      return;
    
    rootLayer.container.destroy({children: true});
    this.destroyed = true;
  },

  /** Converts an object's world position to a row layer.
   * This is MapLayer's solution to z-ordering. */
  RowLayerFromWorldPosition(position: {x: number, y: number}) {
    return Math.floor(position.y / Game.display.standardLength);
  },
  
  /** Signals all freezable graphics layers that they are done being built
  * and should compile for draw efficiency. These layers are functionally
  * treated as immutable unless specifically signalled to update. */
  FreezeStaticLayers() {
    if (this.destroyed)
      return;
    rootLayer.freeze();
  },
  
  /** Compiles the layer structure into a single string report which is
   * then posted to the console. */
  Report() {
    function getString(layer: Layer) {
      let lines = [layer.path];
      layer.children.forEach( child => {
        lines.push( getString(child) );
      })
      return lines.join('\n');
    }

    Debug.ping('MapLayer Paths', getString(rootLayer));
  }
};
