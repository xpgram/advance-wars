
/**
 * Commonly useful debug methods.
 * @author Dei Valko
 * @version 0.1.0
 */
export const Debug = {
    /** If the condition is false, throws an AssertionError with the given message. */
    assert: (condition: boolean, msg: string) => {
        if (!condition)
            throw new AssertionError(msg);
    }
}

/** An error given when an asserted condition is not true. */
export class AssertionError extends Error {
    name = "AssertionError";
}