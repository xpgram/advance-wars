
/* 
 * We're trying this time anew with a common inheritance pattern.
 * 
 * I need approximately the same implementation (to avoid costly rewrites,
 * and because it isn't really necessary) but a greater emphasis on dependency
 * chains.
 * 
 * Attack.schedule() should not handle Move.schedule() itself. This leads to
 * a lot of redundant code.
 * 
 * Attack.chain should instead indicate that [move, attack] are to be scheduled
 * in that order (and thus the chain can be halted by a third party at any time).
 * 
 * Move.schedule() can return a negative status code, the EventScheduler can
 * halt and continue with what it has.
 * 
 * The chain itself is independently orderable, so [dive, move] is still legal.
 * 
 * Oh, and the Attack extends CommandType isn't... strictly necessary, I just
 * find that including some commonly inheritable default behaviors would reduce
 * some boilerplate.
 * .chain could be added to the current implementation. I guess I still need
 * a third-party scheduler somewhere. I'll think about it.
 */

export abstract class CommandType {
  
}