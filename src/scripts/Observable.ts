import { Constructable } from "./CommonTypes";

/** Returns a new type which extends the given one.
 * The new type introduces listener-object behavior which maintains a list of callback
 * functions whose collective call event may be manually triggered by the inheriting class.
 **/
export function Observable<BC extends Constructable>(Base?: BC) {
  return class extends (Base || (class {})) {

    private observers: { event?: string, callback: () => void, context: undefined | object }[] = [];
  
    /** Adds the given callback function and context to the list of observers under the given event key. */
    on(event: string, callback: () => void, context?: object): void {
      this.observers.push({ callback, context, event });
    }
  
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
    }

  }
}
