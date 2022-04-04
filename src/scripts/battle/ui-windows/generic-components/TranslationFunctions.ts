
/**
 * @deprecated Use Ease — However, I can't until I refactor the UI system; this function is important.
 */
export module TranslationFunctions {

  export function easeIn(x: number): number {
    const { pow, cos, PI } = Math;
    return -pow(cos(PI*x / 2), 2) + 1;
  }

}