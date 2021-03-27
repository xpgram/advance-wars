import { Debug } from "./DebugUtils";


export abstract class Observable {

    private observers: {callback: () => void, context: undefined | object}[] = [];

    /** Adds the given callback function and context to the list of observers if it isn't already present. */
    addListener(callback: () => void, context?: object): void {
        if (!this.observers.some(obs => obs.callback === callback && obs.context === context))
            this.observers.push({callback: callback, context: context});
    }

    /** Removes the given callback and context from the list of observers, if it was present. */
    removeListener(callback: () => void, context?: object): void {
        this.observers = this.observers.filter(obs => obs.callback !== callback || obs.context !== context);
    }

    /** Empties the list of callback-context pairs. */
    protected clearListeners(): void {
        this.observers = [];
    }

    /** Triggers each callback function within their supplied context in the list of observers. */
    protected updateListeners(): void {
        this.observers.forEach( obs => obs.callback.call(obs.context) );
    }
}