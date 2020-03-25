

export abstract class Observable {

    private observers: (() => void)[] = [];

    /** Adds the given callback function to the list of observers if it isn't already present. */
    addListener(callback: () => void): void {
        if (this.observers.findIndex(cb => cb === callback) == -1)
            this.observers.push(callback);
    }

    /** Removes the given callback from the list of obersvers, if it was present. */
    removeListener(callback: () => void): void {
        this.observers = this.observers.filter(cb => cb !== callback);
    }

    /** Empties the list of callbacks. */
    protected clearListeners(): void {
        this.observers = [];
    }

    /** Triggers each callback function in the list of observer callbacks. */
    protected updateListeners(): void {
        this.observers.forEach( cb => cb() );
    }
}