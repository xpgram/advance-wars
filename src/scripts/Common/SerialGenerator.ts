
/** Returns a generator object which, on each .next() call, returns a unique serial number (sequential).  
 * Remember to `delete` your reference at some point to relieve the memory. */
export function* SerialGenerator(start?: number): Generator<number, number, number> {
  let serial = start ?? 0;
  while (true) {
    yield serial;
    serial++;
  }
}
