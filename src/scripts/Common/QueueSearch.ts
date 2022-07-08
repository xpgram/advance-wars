import { Debug } from "../DebugUtils";

const DOMAIN = "QueueSearch";

/** Enum with terms for every possible search mode operable by QueueSearch.
 * DepthFirst is approximate: it extends outward to some limit, then works its way back to
 * a previous branching point and extends outward again.
 * BreadthFirst searches terms in the order they are encountered. */
enum SearchMode {
    DepthFirst,
    BreadthFirst
}

/** A generic scaffolding-pattern for search algorithms,
 * the methodology of which is completely determinable by the invoking script.  
 * 
 * // TODO Write the rest of this.
 * // I should probably explain how to write an algorithm using this class.
 * // TODO Integrate this class with Map's two versions of the same algorithm. It's why I wrote it.
 * 
 * Searches stop either when the signal "Final" is given by the node-checking function,
 * or when the queue of search-nodes is emptied.
 */
export class QueueSearch<T> {

    static SearchMode = SearchMode;

    /** A 'deposit-box' containing the final result of the fully evaluated algorithm. */
    resultNode: T | null = null;

    /** Algorithms are nameable for traceability reasons.
     * Generally only useful for staccatoed searches. */
    private name: string | undefined;

    /** Algorithm start timestamp */
    private startTime = Date.now();
    /** Algorithm end timestamp */
    private endTime: number | undefined;

    /** The time in milliseconds the algorithm will wait before warning that it may be looping forever. */
    private warningTimerLimit: number;
    private warningPosted = false;

    /** The time since the search was started or the elapsed time taken to complete. */
    get elapsedTime(): number {
        if (this.endTime)
            return (this.endTime - this.startTime);
        else
            return (Date.now() - this.startTime);
    }

    /** Which search method the algorithm will conduct with. */
    mode: SearchMode;

    /** Whether iterations of the search should be carried out all at once (false)
     * or by request (true). Setting this to true requires you to invoke update()
     * yourself, but allows you to staccato the search across multiple program cycles. */
    staccatoSearch: boolean;

    /** Called on each node handled by the search algorithm.
     * May return a list of nodes to queue, nothing at all, or the signal ('break') to halt. */
    private handleNode: (node: T) => T[] | null | 'break';

    /** The list of requests for search-nodes to consider. */
    private queue: T[];

    /** Whether the search algorithm has concluded. */
    get finished(): boolean { return this._finished; }
    private _finished: boolean = false;


    constructor(options: {
        firstNode: T,
        searchMode: SearchMode,

        staccatoSearch?: boolean,
        warningTimer?: number,
        algorithmName?: string,

        /** Expected to return a list of nodes to queue, none at all, or the signal to stop. */
        nodeHandler: (node: T) => T[] | null | 'break',
    }) {
        this.mode = options.searchMode;
        this.queue = [options.firstNode];
        this.staccatoSearch = options.staccatoSearch || false;
        this.warningTimerLimit = options.warningTimer || 1000; // Default: 1 second
        this.name = options.algorithmName;

        this.handleNode = options.nodeHandler;

        // setup loop
        if (!this.staccatoSearch) {
            while (!this.finished)
                this.handleNextNode();
        }
    }


    /** Pulls one node from the queue and evaluates it. This may extend the search or stop it,
     * depending. */
    private handleNextNode() {
        // If search completed, do not continue.
        if (this.finished)
            return;

        const PROCESS = "HandleNode";

        // Check the algorithm's elapsed time and warn the developer if it's taking too long.
        // Allow negative timers to cancel this warning.
        if (this.warningTimerLimit >= 0) {

            const warnMsg = (msg: string) => {
                const name = this.name || 'Nameless';
                Debug.log(DOMAIN, PROCESS, {
                    message: `Search algorithm '${name}': ${msg}`,
                    warn: true,
                });
            }

            // Inform the developer if the warning limit has fully elapsed.
            if (!this.warningPosted && this.elapsedTime >= this.warningTimerLimit) {
                warnMsg(`Exceeded an expected completion time of ${this.elapsedTime}ms.`)
                this.warningPosted = true;
            }

            // Emergency search halt in the case of infinite loop (inferred by time elapsed)
            if (this.elapsedTime >= this.warningTimerLimit*2) {
                warnMsg(`Search took extroardinarily long. Assuming loop failure; aborting.`);
                this.endSearch();
            }
        }

        // Get the next node for consideration.
        let node: T | undefined;

        if (this.mode == SearchMode.BreadthFirst)       // If this gets any more complicated,
            node = this.queue.shift();                  // write something of the form:
        else if (this.mode == SearchMode.DepthFirst)    // mode = () => T; node = mode();
            node = this.queue.pop();

        // If the queue is empty, cease the search
        if (node == undefined) {
            this.endSearch();
            return;
        }

        let result = this.handleNode(node);

        // If result was the signal to stop searching, break.
        if (result == 'break') {
            this.resultNode = node;
            this.endSearch();
        }
        // If result is not null (thus T[])
        else if (result != null) {
            this.queue = this.queue.concat(result);
        }
    }

    /** If staccatoed-search is enabled, executes one iteration of the search algorithm. Otherwise does nothing.
     * Giving options.repeat an integer n will iterate over n nodes.
     * Giving options.duration an integer t will iterate until elapsed-time == t. */
    update(options?: {repeat?: number, duration?: number}) {
        // If not set to staccato, do nothing.
        if (!this.staccatoSearch)
            return;

        // Configure update limits
        let times;
        let duration;

        if (options) {
            times = (options.repeat != undefined) ? options.repeat : times;
            duration = (options.duration != undefined) ? options.duration : duration;
        }

        // No given options default case
        if (times == undefined && duration == undefined)
            times = 100;

        // Duration counters
        let count = 0;
        let start = Date.now();

        // Update until either limit reached
        while (duration == undefined || Date.now() - start < duration) {
            // Prevent CPU hogging when there's no work to do.
            if (this.finished) break;

            if (times == undefined || count < times) {
                this.handleNextNode();
                ++count;
            }
            else break;
        }
    }

    /** Ceases function of the search algorithm and timestamps its end. */
    endSearch() {
        this._finished = true;
        this.endTime = Date.now();

        const name = this.name || 'Nameless';
        Debug.log(DOMAIN, "Finish", {
            message: `Search algorithm '${name}': Ended with execution time ${this.elapsedTime}ms`,
            warn: this.warningPosted,
        })
    }
}