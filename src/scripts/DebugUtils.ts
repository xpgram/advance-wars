
type ErrorType = {
    new (msg: string): Error
}

/**
 * Commonly useful debug methods.
 * @author Dei Valko
 * @version 0.1.0
 */
export const Debug = {

    /** Throws a generic error and fails the program, or an error of the given error type
     * if one is provided. */
    error: (msg: string, errorType?: ErrorType) => {
        if (errorType)
            throw new errorType(msg);
        else
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
    ping: (msg?: any, ...optionalParams: any[]) => {
        let str = (msg === undefined) ? 'ping' : msg;
        console.warn(str, ...optionalParams);
    },

    /** Prints a message to the console as a traceable warning. Useful when you want to report
     * the details of an operation by value. More-or-less an alias of Debug.ping(). */
    print: (msg: any, ...optionalParams: any[]) => {
        console.warn(msg, ...optionalParams);
    },

    /** Prints a traceable warning message to the console. */
    warn: (msg: any, ...optionalParams: any[]) => {
        console.warn(msg, ...optionalParams);
    },

    /** Given a list of objects or primitives, logs each one separately (list form) to the
     * console underneath a traceable ping. */
    report: (...data: any[]) => {
        Debug.ping('Report:');
        data.forEach( obj => {
            console.log(obj);
        });
    },

    /** Whether to hide logged messages from the console. 'true' by default. */
    logSuppression: true,

    /** Suppresses all messages with priority less than this value. */
    logPriorityFilter: 0,

    /** Which category of logged message should be let through the filter. By default an empty string, which
     * lets all categories through. */
    logTypeFilter: '',

    /** Sets Debug's log filter to the given values, or property-defaults of 'all' if none are provided. */
    filterLoggedMessages(options: {priority?: number, type?: string}) {
        Debug.logPriorityFilter = options.priority || 0;
        Debug.logTypeFilter = options.type || '';
    },

    /** Prints a suppressable message to the console if Debug's log-filter settings are compatible
     * with those given. */
    log: (options: {msg: string, priority?: number, type?: string}) => {
        options.priority = options.priority || 0;
        options.type = options.type || '*';

        if (!Debug.logSuppression) {
            if (options.priority >= Debug.logPriorityFilter) {
                if (Debug.logTypeFilter == '' || Debug.logTypeFilter == options.type)
                    console.log(`${options.type}: ${options.msg}`);
            }
        }
    },

    // An accessible list of all (this application's) error classes.

    /** An error given when an asserted condition is not true. */
    get AssertionError() { return AssertionError; }
}

class AssertionError extends Error {
    name = "AssertionError";
}