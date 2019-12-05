
type ErrorType = {
    new (msg: string): Error
}

/**
 * Commonly useful debug methods.
 * @author Dei Valko
 * @version 0.1.0
 */
export const Debug = {
    /** If the condition is false, throws an AssertionError with the given message, or an.
     * error of errorType if one is provided. */
    assert: (condition: boolean, msg: string, errorType?: ErrorType) => {
        if (!condition) {
            if (errorType)
                throw new errorType(msg);
            else
                throw new AssertionError(msg);
        }
    },

    // An accessible list of all (this application's) error classes.

    /** An error given when an asserted condition is not true. */
    get AssertionError() { return AssertionError; }
}

class AssertionError extends Error {
    name = "AssertionError";
}