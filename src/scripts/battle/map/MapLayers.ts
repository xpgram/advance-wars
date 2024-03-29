import { PIXI } from "../../../constants";
import { Game } from "../../..";
import { Debug } from "../../DebugUtils";

const DOMAIN = "MapLayerSys";

/** The build instructions for a MapLayer. */
type LayerProperties = {
  key: string,
  rowSegmented?: boolean,
  freezable?: boolean,
  children?: LayerProperties[],
}

/** This object defines the map layer structure. */
const layers_config: LayerProperties[] = [
  {key: 'sea'},
  {key: 'bottom', children: [
    {key: 'static', freezable: true},
    {key: 'animated'},
  ]},
  {key: 'top', rowSegmented: true, children: [
    {key: 'static', freezable: true},
    {key: 'animated'},
    {key: 'glass-tile'},
    {key: 'unit'},
  ]},
  {key: 'cloud-shadow'},
  {key: 'ui'},
];

/** A container which pairs a MapLayer's scene graph container, build instructions
 * and descendants. */
class Layer {
  private _path: string[];
  private _name: string;
  container: PIXI.Container;
  properties: LayerProperties;
  children: Layer[];
  
  constructor(properties: LayerProperties, parent?: Layer) {
    this.container = new PIXI.Container();
    this.properties = properties;
    this.children = [];
    
    this._name = properties.key;
    this._path = (parent)
      ? [...parent._path, properties.key]
      : [properties.key];
  }
  
  /** The string serial of this layer's location within the MapLayer system. */
  get path() {
    return this._path.join('/');
  }

  /** The string name for this layer. */
  get name() {
    return this._name;
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
        }, this);
        this.container.addChild(layer.container);
        this.children.push(layer);
      }
    }

    // String indexed
    else {
      const propChildren = this.properties.children || [];
      const start = this.children.length;
      for (let i = start; i < propChildren.length; i++) {
        const layer = new Layer(propChildren[i], this);
        this.container.addChild(layer.container);
        this.children.push(layer);
      }
    }
  }
  
  /** Returns the Layer object indicated by the given key.
   * Throws an error if the key could not be linked to any children. */
  getChild(key: string | number) {
    const path = this.path;

    function throwError(msg: string) {
      throw new ReferenceError(`Can't parse path ${path} by '${key}'; ${msg}`);
    }

    if (!this.properties.children)
      throwError('no children.');

    let idx: number = -1;
    
    // String indexing
    if (typeof key === 'string') {
      if (this.properties.rowSegmented)
        throwError('layer is row indexed.');
      
      this.lazyBuildChildren(-1);   // TODO This argument serves no purpose but is still necessary.
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
    this.container.cacheAsBitmap = this.properties.freezable || false;
  }
  
  /** Signals this layer that it should re-render.
   * Does nothing if this layer is not designated as freezable. */
  update() {
    this.children.forEach( child => child.update() );
    let prev = this.container.cacheAsBitmap;
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
export function MapLayer(...terms: (string | number)[]): PIXI.Container {
  if (MapLayerFunctions.isDestroyed())
    throw new Error(`Attempting to access MapLayer system before construction; run MapLayerFunctions.Init() first.`);
  
  let result = rootLayer;

  terms.forEach( term => {
    result = result.getChild(term);
  });

  return result.container;
}

/** 
* Extra, helpful methods for handling the MapLayer system.
* 
* @author Dei Valko
* @version 2.0.0
*/
export module MapLayerFunctions {
  
  let destroyed = true;
  export function isDestroyed() { return destroyed; }
  
  /** Initializes the MapLayer system for use. 
  * MapLayer system will not be functional before calling this method. */
  export function Init() {
    if (!destroyed) {
      Debug.log(DOMAIN, "Initialization", {
        message: "Initialization request rejected",
        reason: "Already initialized",
      });
      return;
    }
    
    rootLayer = new Layer({
      key: 'root',
      children: layers_config,
    })
    Game.scene.visualLayers.stage.addChild(rootLayer.container);
    destroyed = false;
    Debug.log(DOMAIN, "Initialization");
  }
  
  /** Frees up the resources held by the MapLayers system.
  * Do not reference graphics containers after calling this method before
  * once again calling the Init() method. */
  export function Destroy() {
    if (destroyed)
      return;
    
    rootLayer.container.destroy({children: true});
    destroyed = true;
    Debug.log(DOMAIN, "Destruction");
  }

  /** Converts an object's world position to a row layer.
   * This is MapLayer's solution to z-ordering. */
  export function RowLayerFromWorldPosition(position: {x: number, y: number}) {
    return Math.floor(position.y / Game.display.standardLength);
  }
  
  /** Signals all freezable graphics layers that they are done being built
  * and should compile for draw efficiency. These layers are functionally
  * treated as immutable unless specifically signalled to update. */
  export function FreezeStaticLayers() {
    if (destroyed)
      return;
    rootLayer.freeze();
    Debug.log(DOMAIN, "SysFunc", { message: "Static visual components frozen to prevent redraw" });
  }

  /** Signals all freezable graphics layers that they are to re-render and
   * cache their scene components. */
  export function RerenderStaticLayers() {
    if (destroyed)
      return;
    rootLayer.update();
  }

  /** Signals a layer to sort its children, and for all its children to sort their children. */
  export function SortLayer(...terms: (string | number)[]) {
    // TODO Is this function necessary? Does Pixi not watch z for changes and retrigger sort automatically?
    function sort(container: PIXI.Container) {
      container.children.forEach( child => sort(child as PIXI.Container) );
      container.sortChildren();
    }
    sort( MapLayer(...terms) );
    Debug.log(DOMAIN, "LayerSorting");
  }
  
  /** Compiles the layer structure into a single string report which is
   * then posted to the console. */
  export function Report() {
    function getString(layer: Layer) {
      let lines = [layer.path];
      layer.children.forEach( child => {
        lines.push( getString(child) );
      })
      return lines.join('\n');
    }
    Debug.ping('MapLayer Paths', getString(rootLayer));
  }

}
