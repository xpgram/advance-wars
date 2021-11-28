/**
 * A repository for function calls which need to be delayed until some condition is met.
 * Work Orders™ return a boolean, whether they are complete or not, and meter their own
 * delay schedule.
 * 
 * @author Dei Valko
 * */
export class WorkOrderHandler {

    workOrders: {order: () => boolean | undefined, context?: object}[] = [];

    /** Close all closable work orders. Those that can't will be held until next call. */
    close() {
        this.workOrders = this.workOrders.filter( request => request.order.call(request.context) != true )
    }

    /** Submits a request to the handler, which will call the given function under the
     * given context every loop as many times as needed until it returns true. */
    send(order: () => boolean | undefined, context?: object) {
        this.workOrders.push({order:order, context:context});
    }

    /** Cancels a given work order, preventing it from being carried out (any further). */
    cancel(order: () => boolean | undefined, context?: object) {
        this.workOrders = this.workOrders.filter( request => request.order !== order || request.context !== context );
    }

    /** Abandons all work orders and empties the to-do list. Let's go golfing. */
    clear() {
        this.workOrders = [];
    }
}