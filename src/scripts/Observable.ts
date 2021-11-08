import { Debug } from "./DebugUtils";

/** Abstract class which introduces listener-object interaction to inheritors.
 * Added functionality maintains a list of callbacks whose collective call may
 * be manually triggered by the inheriting class.
 */
export abstract class Observable {

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