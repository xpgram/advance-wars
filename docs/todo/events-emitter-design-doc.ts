
interface EventsMap {
  [event: string]: any;
}

declare type EventNames<Map extends EventsMap> = keyof Map & (string | symbol);
declare type EventParams<Map extends EventsMap, Ev extends EventNames<Map>> = Parameters<Map[Ev]>;
declare type EventCallback<Map extends EventsMap, Ev extends EventNames<Map>> = Map[Ev];

interface TypedEventBroadcaster<EmitEvents extends EventsMap> {
  emit<Ev extends EventNames<EmitEvents>>(ev: Ev, ...args: EventParams<EmitEvents, Ev>): boolean;
}

class EventEmitter<ListenEvents extends EventsMap> implements TypedEventBroadcaster<ListenEvents> {
  on<Ev extends EventNames<ListenEvents>>(ev: Ev, listener: EventCallback<ListenEvents, Ev>): this {
    return this;
  };
  emit<Ev extends EventNames<ListenEvents>>(ev: Ev, ...args: EventParams<ListenEvents, Ev>): boolean {
    return true;
  };
}

let count = 0;

// It has to be `EventName: [parameters, tuple],`
// The key is the event string and the value is the callback's arguments list.
// Here's the trick: Can I find a way to nest them? Folderize.
// Doing that isn't ~too~ hard, but I want One.A and Two.A to have different
// event signatures.
//
// Wait, what if I'm going about this wrong.
// I'll draft a quick demo down below.
interface Events {
  One: {
    A: () => void,
    B: (n: number) => void,
    C: (s: string) => void,
  },
  Two: {
    A: [n: number],
    B: [s: string, n: number],
    C: [options: {
      hello: string,
      whatchadoin: string,
      howgoesit: string,
    }]
  },
};

const Dispatcher = new EventEmitter<Events>();

Dispatcher.emit(Keys.One.A, null);

Events[Keys.One.B]();


// The below I promised:

type DeepRecord<T> = {
  [k: string]: T | DeepRecord<T>;
}

type DeepRecordReplace<Y, R extends DeepRecord<Y>, T> = {
  [k in keyof R]: R[k] extends DeepRecord<Y> ? DeepRecordReplace<Y, R[k], T> : T;
}

const EventsA = {
  One: {
    A: (a: number, b: string) => {},
    B: {
      a: (a: number) => {},
      b: (point: {x: number, y: number}) => {},
    },
  }
} satisfies DeepRecord<(...args: any[]) => void>;

// Generated.
let EventsG: DeepRecordReplace<(...args: any[]) => void, typeof EventsA, string> = {
  One: {
    A: 'EventsG.One.A',
    B: {
      a: 'EventsG.One.B.a',
      b: 'EventsG.One.B.b',
    }
  }
}

EventsG.One.B.b;

// The rest:
// EventsA is used to retrieve callback parameter data.
// EventsG is used to define the event-type.
//
// This gap is still quite a bit to bridge, but the idea is:
//  `Dispatcher.emit(EventsG.One.B.b, new Point(1,10));`
// This would provide type errors for `new Point()`; it would know to accept it.
// The event emitter just needs this:
//  `new Emitter<Events, Callbacks>();`
// And because they share the same structure, they should be able to match strings to listeners.
//  `Emitter.emit(EventsG.One.B.b, ...args: Parameters<EventsA.One.B.b>);`
//
// An important point:
// I need to tell Typescript that any resultant of EventsG will have not _any_ string but _the_
// string equivalent to `keys.join('-')`.
// This would allow them to be treated like consts.
// So, any of these three methods of access would work:
//   Emitter.emit('Event.One.B.b', <args>);
//   Emitter.emit(EventsG.One.B.b, <args>);
//   const B = EventsG.One.B;
//   Emitter.emit(B.b, <args>);
// Because Typescript understands that `B.b` is just an alias for 'EventsG.One.B.b'.
