
import 'regenerator-runtime/runtime';
  // TODO ..? I'm not a huge fan of this. It's a fix to an invisible problem that I just have to... remember?
  // I think it only has to be included once, though? Maybe I can include it via webpack or something.

/** Returns a generator object which, on each .next() call, returns a unique serial number (sequential).  
 * Remember to `delete` your reference at some point to relieve the memory. */
export function* SerialGenerator(start?: number): Generator<number, number, number> {
  let serial = start ?? 0;
  while (true) {
    yield serial;
    serial++;
  }
}
