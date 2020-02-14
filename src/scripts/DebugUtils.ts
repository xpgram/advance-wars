
type ErrorType = {
    new (msg: string): Error
}

/**
 * Commonly useful debug methods.
 * @author Dei Valko
 * @version 0.1.0
 */
export const Debug = {

    /** Throws a traceable error and fails the program. */
    error: (msg: string) => {
        throw new Error(msg);
    },

    /** If the condition is false, throws an AssertionError with the given message, or an
     * error of errorType if one is provided. */
    assert: (condition: boolean, msg: string, errorType?: ErrorType) => {
        if (!condition) {
            if (errorType)
                throw new errorType(msg);
            else
                throw new AssertionError(msg);
        }
    },

    /** Prints a message to the console as a traceable warning. Useful when you want to know
     * if a particular block of code is being reached. */
    ping: (msg?: string) => {
        let str = msg || 'ping';
        console.warn(str);
    },

    /** Given a list of objects or primitives, logs each one to the console underneath a traceable
     * ping. Handy when you want to report on multiple objects at once. */
    report: (...data: any[]) => {
        Debug.ping('Report:');
        data.forEach( obj => {
            console.log(obj);
        });
    },

    // An accessible list of all (this application's) error classes.

    /** An error given when an asserted condition is not true. */
    get AssertionError() { return AssertionError; }
}

class AssertionError extends Error {
    name = "AssertionError";
}