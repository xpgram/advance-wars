import { Game } from "../../..";
import { Debug } from "../../DebugUtils";
import { StringDictionary } from "../../CommonTypes";

// TODO Refactor to use cacheAsBitmap
// TODO Refactor to be less complicated

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

/** stub */
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
  
  get path() {
    return this._path.join('/');
  }
  
  /**  */
  buildChildren(toIndex: number) {
    
  }
  
  /**  */
  getChild(key: string | number) {
    if (!this.properties.children)
      throw new Error(`Can't parse path ${this.path} by '${key}'; no children.`);
    
    let idx: undefined | number;
    
    // String indexing
    if (typeof key === 'string') {
      if (this.properties.rowSegmented)
        throw new Error(`Can't parse path ${this.path} by '${key}'; row indexed.`);
      
      // TODO Lazy build children
      idx = this.children.findIndex( child => child.properties.key === key );
      
      if (idx === -1)
        throw new Error(`Can't parse path ${this.path} by '${key}'; key does not exist.`);
    }
    
    // Numeric indexing
    else if (typeof key === 'number') {
      if (!this.properties.rowSegmented)
        throw new Error(`Can't parse path ${this.path} by '${key}'; string indexed.`);
      
      // TODO Lazy build children
      idx = key;
    }
    
    // Return child (cannot get here with idx == undefined)
    return this.children[idx];
  }
  
  /**  */
  freeze() {
    this.children.forEach( child => child.freeze() );
    this.container.cacheAsBitmap = this.properties.freezable;
  }
  
  /**  */
  update() {
    // this.children.forEach( child => child.update() );
    this.container.cacheAsBitmap = false;
    this.container.cacheAsBitmap = this.properties.freezable;
  }
}

/** Layer which contains all others. */
const rootLayer: Layer;

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
  // TODO Retrieve
}

// TODO Refactor access functions vv

/** 
* Functions for the management of the game-layers container.
* 
* @author Dei Valko
* @version 1.0.0
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
    layerIndex = [];
    this.destroyed = true;
  },
  
  /** Signals all freezable graphics layers that they are done being built
  * and should compile for draw efficiency. These layers are functionally
  * treated as immutable unless specifically signalled for update. */
  FreezeStaticLayers() {
    if (this.destroyed)
      return;
    rootLayer.freeze();
  },
  
  /**  */
  Report() {
    function getString(layer: Layer) {
      let lines = [layer.path];
      layer.children.forEach( child => {
        lines.push( getString(child) );
      })
      return lines.join('\n');
    }

    Debug.ping('MapLayer paths', getString(rootLayer));
  }
};
