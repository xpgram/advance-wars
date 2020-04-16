import { Debug } from "../DebugUtils";

/** Enum with terms for every possible search mode operable by QueueSearch.
 * DepthFirst is approximate: it extends outward to some limit, then works its way back to
 * a previous branching point and extends outward again.
 * BreadthFirst searches terms in the order they are encountered. */
enum SearchMode {
    DepthFirst,
    BreadthFirst
}

/** Enum describing the three possible results of a node-check:
 * "failure" (stop), "pass" (continue) or "final" (target found; cease search). */
enum NodeResult {
    Fail,
    Pass,
    Final
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

    SearchMode = SearchMode;
    NodeResult = NodeResult;

    /** A 'deposit-box' containing the final result of the fully evaluated algorithm. */
    resultNode: T | undefined;

    /** Algorithms are nameable for traceability reasons.
     * Generally only useful for staccatoed searches. */
    private name: string | undefined;

    private startTime = Date.now();
    private endTime: number | undefined;
    /** The time in milliseconds the algorithm will wait before warning that it may be looping forever. */
    private warningTimerLimit: number;

    /** The time since the search was started until now or when the search completed. */
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

    private checkNode: (node: T) => NodeResult;
    private queueNodes: (node: T) => T[];
    private onVisit: (node: T) => void;
    private onPass: (node: T) => void;
    private onFail: (node: T) => void;
    private onFinal: (node: T) => void;

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
        checkNode: (node: T) => NodeResult,
        queueNodes: (node: T) => T[],
        onVisit?: (node: T) => void,
        onPass?: (node: T) => void,
        onFail?: (node: T) => void,
        onFinal?: (node: T) => void
    }) {
        this.mode = options.searchMode;
        this.queue = [options.firstNode];
        this.staccatoSearch = options.staccatoSearch || false;
        this.warningTimerLimit = options.warningTimer || 1000; // Default: 1 second
        this.name = options.algorithmName;

        this.checkNode = options.checkNode;
        this.queueNodes = options.queueNodes;
        this.onVisit = options.onVisit || (() => {});
        this.onFail = options.onFail   || (() => {});
        this.onPass = options.onPass   || (() => {});
        this.onFinal = options.onFinal || (() => {});

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

        // Check the algorithm's elapsed time and warn the developer if it's taking too long.
        if (this.warningTimerLimit >= 0) {  // Allow negative timers to cancel this warning.
            if (this.elapsedTime >= this.warningTimerLimit) {
                let name = this.name || 'Nameless';
                Debug.warn(`Search algorithm '${name}' exceeded an expected completion time of ${this.elapsedTime}ms.`)                
            }
            // The idea, I think, is to prevent program catastrophic failure.
            // I wonder if this is the best way, though.
            if (this.elapsedTime >= this.warningTimerLimit*2) {
                let name = this.name || 'Nameless';
                Debug.warn(`Search algorithm '${name}' failed: too long. Stopping.`);
                this.endSearch();
            }
        }

        // Get the next node for consideration.
        let node: T | undefined;

        if (this.mode == SearchMode.BreadthFirst)
            node = this.queue.shift();
        else if (this.mode == SearchMode.DepthFirst)
            node = this.queue.pop();
        // (( If this gets any more complicated, write something of the form:
        // mode = function => T; node = mode(); ))

        // If the queue is empty, cease the search
        if (node == undefined) {
            this.endSearch();
            return;
        }

        this.onVisit(node);
        let result = this.checkNode(node);

        if (result == NodeResult.Fail) {
            this.onFail(node);
        }
        else if (result == NodeResult.Pass) {
            this.onPass(node);
            this.queue.concat(this.queueNodes(node));
        }
        else if (result == NodeResult.Final) {
            this.onFinal(node);
            this.resultNode = node;
            this.endSearch();
        }
    }

    /** If staccatoed-search is enabled, executes one iteration of the search algorithm.
     * Otherwise, does nothing. */
    update() {
        if (this.staccatoSearch)
            this.handleNextNode();
    }

    /** Ceases function of the search algorithm and timestamps its end. */
    endSearch() {
        this._finished = true;
        this.endTime = Date.now();
    }
}