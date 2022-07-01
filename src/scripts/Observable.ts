import { Constructable } from "./CommonTypes";


type Observer = {
  once?: boolean;
  event?: string;
  callback: () => void;
  context: undefined | object;
};


/** Returns a new type which extends the given one.
 * The new type introduces listener-object behavior which maintains a list of callback
 * functions whose collective call event may be manually triggered by the inheriting class.
 **/
export function Observable<BC extends Constructable>(Base: BC) {

  return class extends Base {

    private observers: Observer[] = [];

    /** Deconstructs the observer object. Call once in any inheriting class' destroy() method.*/
    destroy(): void {
      super.destroy?.call(this);
      this.clearListeners();
    }

    // TODO Why did I write on() and addListener() differently? Are they not the same request?
  
    /** Adds the given callback function and context to the list of observers under the given event key. */
    on(event: string, callback: () => void, context?: object): void {
      this.observers.push({ callback, context, event });
    }

    /** Adds the given callback function and conntext to the list of observers under the given event key.
     * The event is set to occur only once on first emit of the associated event or generic impulse. */
    // TODO Disabled because I'm micromanaging execution efficiency and this isn't important now.
    // once(event: string, callback: () => void, context?: object): void {
    //   this.observers.push({ callback, context, event, once: true });
    // }
  
    /** Adds the given callback function and context to the list of observers if it isn't already present. */
    addListener(callback: () => void, context?: object, event?: string): void {
      if (!this.observers.some(obs => obs.callback === callback && obs.context === context))
        this.observers.push({ callback, context, event });
    }
  
    /** Removes the given callback and context from the list of observers, if it was present. */
    removeListener(callback: () => void, context?: object): void {
      this.observers = this.observers.filter(obs => obs.callback !== callback || obs.context !== context);
    }
  
    /** Removes the given callback and context from the specific event trigger in the list of observers, if it was present. */
    removeListenerFromEvent(event: string, callback: () => void, context?: object) {
      this.observers = this.observers.filter(obs => obs.event !== event || obs.callback !== callback || obs.context !== context);
    }
  
    /** Empties the list of callback-context pairs. */
    protected clearListeners(event?: string): void {
      if (!event)
        this.observers = [];
      else
        this.observers = this.observers.filter(obs => obs.event !== event);
    }
  
    /** Triggers each callback function within their supplied context _only_ if their event key matches
     * the supplied event string. In effect, different event keys are treated as seperate lists. */
    protected updateListeners(event?: string): void {
      this.observers
        .filter(obs => obs.event === event)
        .forEach(obs => obs.callback.call(obs.context));
      
      // TODO This is a second-pass for the filter; is there a faster way to do this?
      // this.observers = this.observers.filter(obs => obs.event === event && !obs.once);
    }

  }
}

/** A class with listener-callback behaviors.
 * The messages called and responded to are maintained by the inheriting class; this class
 * simply defines the architecture. */
export const ObservableType = Observable(class {});
