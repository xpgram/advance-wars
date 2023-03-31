import { Weather } from "../../battle/EnumTypes";
import { Point } from "../../Common/Point";

/** Function callback to be called when an event message is recieved. */
type EventHandler = (...args: any[]) => void;

/** Recursive record type. */
type DeepRecord<K extends string | number | symbol, T> = {
  [k in K]: T | DeepRecord<K, T>;
}

/** Recursive replace of all resultant types with the type Y. */
type DeepReplace<T extends DeepRecord<any, any>, Y> = {
  [k in keyof T]: T[k] extends DeepRecord<any, any>
    ? DeepReplace<T[k], Y>
    : Y;
}

/** Given the root of a nested Object structure, assumes an Object type with the same
 * structure but with string resultants instead of the original type.
 * 
 * These string resultants are explicitly equivalent to `path.join('-')`, where `path`
 * is an array of all index-keys from the root object to this resultant value.
 * 
 * For example:  
 * ```javascript
 * when T = {
 *   Car: {
 *     Engine: 'v8'
 *   }
 * }  
 * KeyPathEnum = {
 *   Car: {
 *     Engine: 'Car-Engine'
 *   }
 * }
 * ```
 */
type KeyPathEnum<T extends DeepRecord<string, EventHandler>, Path extends string> = {
  readonly [k in keyof T & string]:
    T[k] extends EventHandler
      ? `${Path}-${k}`
      : T[k] extends DeepRecord<string, EventHandler>
        ? KeyPathEnum<T[k], `${Path}-${k}`>
        : never;
}




const CommandsStructure = {
  UI: {
    DetailsWindow: {
      UpdateInfo: (name: string, details: string, defBonus: number) => {},
      UpdateVisibleTab: (tabIndex: number) => {},
    },
    Map: {
      MoveFieldCursor: (location: Point) => {},
    },
  },
} satisfies DeepRecord<string, EventHandler>;


// Now make the Dispatcher types

/**
 * Given the root of an EventMap, returns a KeyPathEnum with the same object structure.
 */
function fillKeyPathEnum<T extends DeepRecord<string, EventHandler>, Y extends string>(root: T, namespace: Y): KeyPathEnum<T, typeof namespace> {
  return fillKeyPathEnum_helper(root, namespace);
}

type EventMap = DeepRecord<string, EventHandler>;
type EventSigMap = DeepRecord<string, string>;

/**  */
function fillKeyPathEnum_helper<T extends EventMap, Y extends string>(
  root: T,
  namespace: Y,
  ...path: string[]
): KeyPathEnum<T, Y> {
  const record: EventSigMap = {};
  for (const key of Object.keys(root)) {
    const val = root[key];
    if (typeof val !== 'function')
      record[key] = fillKeyPathEnum_helper(val, namespace, ...path, key);
    else {
      record[key] = `${path.join('-')}-${key}`;
    }
  }
  return record as KeyPathEnum<T, Y>;
}

const Commands = fillKeyPathEnum(CommandsStructure, 'Commands');

Commands.UI.DetailsWindow.UpdateInfo;

// Nice!
// Now I have the args object ~and~ the keys object.
// I need some way of mixing them now.
// Like, flattening them.
// I just need to match these key-paths to the functions they correspond to.
// 
// I think... there's probably a way I could do the recursive search along
// the structure of ~both~ in the same way that I've done one or the other.
// Yeah.

// I need to flat-map these bois.
// The goal is to recursively traverse both and assign each listener and
// identifier to a more traditional EventMap.

type Test<T extends EventMap, Y extends DeepReplace<T, string>, k = keyof T> = 
  k extends string
    ? T[k] extends EventMap
      ? Y[k] extends DeepReplace<T[k], string>
        ? Test<T[k], Y[k], keyof T[k]>
        : never
      : Y[k] extends string
        ? { [key in `${Y[k]}`]: T[k] }
        : never
    : never;

type TestB = Test<typeof CommandsStructure, typeof Commands>;

type UnionToIntersection<T> = 
  (T extends any
    ? (x: T) => any
    : never
    ) extends (x: infer R) => any
      ? R
      : never;

type TestC = UnionToIntersection<TestB>;

interface TestD extends TestC {};

// This implementation could use some cleaning up for general readability.





type FlattenObjectKeys<
  T extends Record<string, unknown>,
  Key = keyof T
> = Key extends string
  ? T[Key] extends Record<string, unknown>
    ? `${Key}-${FlattenObjectKeys<T[Key]>}`
    : `${Key}`
  : never

type FlatKeys = FlattenObjectKeys<typeof Commands>;







interface EventsMap {
  [event: string | symbol]: any;
}

type EventNames<Map extends EventsMap> = keyof Map & (string | symbol);

type EventParams<
  Map extends EventsMap,
  Ev extends EventNames<Map>,
  > = Parameters<Map[Ev]>;

type EventListener<
  Map extends EventsMap,
  Ev extends EventNames<Map>
  > = Map[Ev];

class Dispatcher<UserEvents extends EventsMap> {
  
  on<Ev extends EventNames<UserEvents>>(
    ev: Ev,
    listener: EventListener<UserEvents, Ev>
  ) {
    // pass
  }

  once<Ev extends EventNames<UserEvents>>(
    ev: Ev,
    listener: EventListener<UserEvents, Ev>
  ) {
    // pass
  }

  off<Ev extends EventNames<UserEvents>>(
    ev: Ev,
    listener: EventListener<UserEvents, Ev>
  ) {
    // pass
  }

  emit<Ev extends EventNames<UserEvents>>(
    ev: Ev,
    ...args: EventParams<UserEvents, Ev>
  ) {
    // pass
  }
}




const dispatcher = new Dispatcher<TestD>();
dispatcher.emit(Commands.UI.DetailsWindow.UpdateInfo, 'hello', 'what do you do', 2);
dispatcher.on(Commands.UI.DetailsWindow.UpdateVisibleTab, (n) => { })
dispatcher.emit(Commands.UI.Map.MoveFieldCursor, new Point(1,10));
dispatcher.emit('Commands-UI-Map-MoveFieldCursor', new Point(2,20));

// Oh my god, that is so satisfying.
// I did it.

// I think there's still some development to do.
// interface TestD is strictly defined, but I want it to be kind of inferred.
// Like, if you give a function a structure object like Commands and a root keyword,
// it will generate the set of EventSignature and EventsMap (or Dispatcher) objects
// for you to export and use elsewhere. But it needs to know what type to extend
// in order to do that.
// Hm.
// But anyway. A major leap we made. I need a nap.
