import { Debug } from "../DebugUtils";

const DOMAIN = "QueueSearch";


enum SearchMode {
    /** Another name for last-in-first-out: prioritizes nodes at the end of the stack. */
    DepthFirst,
    /** Another name for first-in-first-out: prioritizes nodes at the beginning of the stack. */
    BreadthFirst,
}

/**
 * A boilerplate class for a stack-managed search algorithm.  
 * Set the search mode and then write the node-handler, which may return `null`, more nodes, or `'break'`
 * if a fixed-return has been found, the rest will be handled for you.
 * 
 * Searches stop when signaled to or when the queue of search-nodes is emptied.
 */
export class QueueSearch<T> {

    static SearchMode = SearchMode;

    /** A 'deposit-box' containing the final result of the fully evaluated algorithm. */
    resultNode?: T;

    /** Algorithms are nameable for traceability reasons.
     * Generally only useful for staccatoed searches. */
    private readonly name: string | undefined;

    /** Algorithm start timestamp */
    private startTime = Date.now();
    /** Algorithm end timestamp */
    private endTime: number | undefined;

    /** The time in milliseconds the algorithm will wait before warning that it may be looping forever. */
    private readonly warningTimerLimit: number;
    private warningPosted = false;

    /** The time since the search was started or the elapsed time taken to complete. */
    get elapsedTime(): number {
        return (this.endTime)
            ? (this.endTime - this.startTime)
            : (Date.now() - this.startTime);
    }

    /** Which search method the algorithm will conduct with. */
    private readonly mode: SearchMode;

    /** Whether iterations of the search should be carried out all at once (false)
     * or by request (true). Setting this to true requires you to invoke update()
     * yourself, but allows you to staccato the search across multiple program cycles. */
    private readonly staccatoSearch: boolean;

    /** Called on each node handled by the search algorithm.
     * May return a list of nodes to queue, nothing at all, or the signal ('break') to halt. */
    private handleNode: (node: T) => T[] | null | 'break';

    /** The list of requests for search-nodes to consider. */
    private queue: T[];

    /** Whether the search algorithm has concluded. */
    get finished(): boolean { return this._finished; }
    private _finished: boolean = false;


    constructor(options: {
        /** Name description of the owning object; the job issuer. For logging purposes. */
        owner: string,
        /** Name description of the job this search is performing. For logging purposes. */
        process: string,

        firstNode: T,
        searchMode: SearchMode,

        /** Set to `true` if you'd like to stagger the search over multiple frames; update() must be called manually. */
        staccatoSearch?: boolean,
        /** The ms time the loop may continue before a console warning is issued. Twice this duration and the search
         * will assume it is looping infinitely. */
        warningTimer?: number,
        /** Expected to return a list of nodes to queue, none at all, or the signal to stop. */
        nodeHandler: (node: T) => T[] | null | 'break',
    }) {
        this.mode = options.searchMode;
        this.queue = [options.firstNode];
        this.staccatoSearch = options.staccatoSearch ?? false;
        this.warningTimerLimit = options.warningTimer ?? 1000; // Default: 1 second
        this.name = `${options.owner}:${options.process}`;

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

        if (this.mode === SearchMode.BreadthFirst)      // If this gets any more complicated,
            node = this.queue.shift();                  // write something of the form:
        else if (this.mode === SearchMode.DepthFirst)   // mode = () => T; node = mode();
            node = this.queue.pop();

        // If the queue is empty, cease the search
        if (node === undefined) {
            this.endSearch();
            return;
        }

        let result = this.handleNode(node);

        // If result was the signal to stop searching, break.
        if (result === 'break') {
            this.resultNode = node;
            this.endSearch();
        }
        // If result is not null (thus T[])
        else if (result !== null) {
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

        let maxLoop = options?.repeat;
        let maxTime = options?.duration;

        // Default staccato limit
        if (!maxLoop && !maxTime)
            maxLoop = 100;

        let loopCount = 0;
        let startTime = Date.now();

        // Update until either limit reached
        while (true) {
            const timedOut = (maxTime && Date.now() - startTime >= maxTime);
            const loopFinish = (maxLoop && loopCount >= maxLoop);
            if (this.finished || timedOut || loopFinish)
                break;

            this.handleNextNode();
            loopCount++;
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