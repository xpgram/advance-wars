import { Game } from "..";

type ErrorType = {
    new (msg: string): Error
}

/**
 * Commonly useful debug methods.
 * @author Dei Valko
 * @version 0.1.0
 */
export const Debug = {

    /** Throws a generic error and fails the program. */
    error: (msg?: any, ...optionalParams: any[]) => {
        console.error(msg, ...optionalParams);
    },

    /** If the condition resolves to true, throws an error using Debug.error(). */
    errif: (condition: boolean, msg: any, ...optionalParams: any[]) => {
        if (!condition)
            return;
        Debug.error(msg, optionalParams);
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

    /** System log data.
     * Use Debug.postLog() to write the log's contents to the browser console. */
    _logData: <string[]>[],

    /** Log to internal memory some system event. Useful for debugging.
     * Use Debug.postLog() to write the log's contents to the browser console. */
    log: (domain: string, process: string, options?: {message?: string, reason?: string, error?: boolean, warn?: boolean} ) => {
        const { message, reason, error, warn } = options ?? {};

        // Format "\n  : message text"
        const includeMsg = (d: string, msg?: string) => {
            if (!msg)
                return '';

            const firstindent = `  ${d} `;
            const indent = ' '.repeat(firstindent.length);

            const fmsg = msg
                .split('\n')
                .map( line => `${indent}${line}` )
                .join('\n');
            
            return `\n${firstindent}${fmsg.slice(indent.length)}`;
        }

        const timestamp = `[${new Date().toISOString()}] fr${Game.frameCount} ln${Debug._logData.length}`;
        const logstr = `${timestamp} ${domain} ${process}${includeMsg(':',message)}${includeMsg(';',reason)}`;
        // Ex:
        // [2022-03-30T13:32:57.112Z] fr1434672 ln41 BattleManager AdvanceToNextState
        //    : Failing to previous stable state.
        //    ; Generic error.
        // TODO Will '\n' make it hard to grep, even with ln41?

        // TODO It is not clear from impl. that error and warn can't be concurrent.
        // I would prefer `elevate?: 'warn' | 'error'`, I think, but I need to refactor elsewhere.
        // Or deprecate warn, I suppose.
        if (error)
            console.error(logstr);
        else if (warn)
            console.warn(logstr);
            
        Debug._logData.push(logstr);
    },

    /** Writes to the console the contents of the system event log. */
    exportLogToConsole: () => {
        console.groupCollapsed(`System Log (${Debug._logData.length})`);
        console.log(Debug._logData.join('\n'));
        console.groupEnd();
    },

    // An accessible list of all (this application's) error classes.

    /** An error given when an asserted condition is not true. */
    get AssertionError() { return AssertionError; }
}

class AssertionError extends Error {
    name = "AssertionError";
}