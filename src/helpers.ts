/**
 * Internal helper functions not intended to be published.
 */
import {gcd, modInv} from 'xen-dev-utils';

/**
 * Distribute subsequences as evenly as possible using Björklund's algorithm;
 * modified as to always return the brightest mode.
 */
export function bjorklund<T>(a: number, b: number, first: T, second: T): T[] {
  return Array.from(bjorklundStr(a, b)).map(x => (x === 's' ? second : first));
}

/**
 * Using this function so that we don't have to replace `first' and `second`
 * with `true` and `false` every time the algorithm does an array comparison.
 */
export function bjorklundStr(a: number, b: number): string {
  if (isNaN(a) || isNaN(b)) {
    throw new Error('Invalid input');
  }
  const d = gcd(a, b);
  if (d === 1) {
    let [countFirst, countSecond] = [a, b];
    // These are the seed strings we build the brightest MOS word from.
    // The algorithm uses two subwords at each step, iteratively appending the
    // lexicographically second subword to the lexicographically first subword to ensure
    // that the lexicographically first mode is returned.
    // Note that 'L' is brighter; 'L' < 's' in js.
    let first = 'L';
    let second = 's';
    while (countSecond !== 1) {
      // Possibly after switching, are there more copies of `first` than `second`?
      // Then all the `second`s get appended to the first `countSecond` copies of `first`s,
      // and the new `second`s are the remaining copies of `first`s.
      if (countFirst > countSecond) {
        [countFirst, countSecond] = [countSecond, countFirst - countSecond];
        [first, second] = [first.concat(second), first];
      }
      // Otherwise, there are strictly fewer `first`s than `second`s (as gcd(a, b) === 1),
      // and *all* the `first`s get modified, whereas `second` is unchanged since copies of it remain.
      // `countFirst` is also unchanged.
      else {
        countSecond = countSecond - countFirst;
        first = first.concat(second);
      }
      // At the current step we have `countFirst` `first` substrings and `countSecond` `second` substrings,
      // where we must guarantee that `first < second`.
      // Thus if `first > second`, then swap them and swap the count variables.
      // Do this step before checking the while condition; we know the desired lex. ordering holds for the first step,
      // and our stopping condition requires that `first < second` actually hold to really behave correctly.
      if (first > second) {
        [countFirst, countSecond] = [countSecond, countFirst];
        [first, second] = [second, first];
      }
    }
    // At the end, we have `countFirst`-many `first`s and 1 `second`s,
    // so return (`first`)^`countFirst` `second` (in standard mathematical word notation).
    return first.repeat(countFirst).concat(second);
  } else {
    // multiperiod MOS
    return bjorklundStr(a / d, b / d).repeat(d);
  }
}

// This algorithm, a variant of the Bresenham line algorithm, returns the "brightest mode" of
// the "scale" where `first` is treated as larger than `second`.
// It's based on following the closest approximation of the line y = b/a*x that is strictly below the line.
export function bresenham<T>(a: number, b: number, first: T, second: T): T[] {
  const d = gcd(a, b);
  if (d === 1) {
    const result: T[] = [];
    // `xHere` = current number of `first`, `yHere` = current number of `second`; start at (0, 0).
    let [xHere, yHere] = [0, 0];
    while (xHere < a || yHere < b) {
      // If going north (taking a (0, 1) step) doesn't lead to going north of the line y = b/a*x,
      if (a * (yHere + 1) <= b * xHere) {
        // append `second` to `resultScale` and update the current location.
        result.push(second);
        yHere += 1;
      } else {
        // Else, append `first` and take one step to the east.
        result.push(first);
        xHere += 1;
      }
    }
    return result;
  } else {
    // aLbs is a d-period MOS, so we concatenate `d` copies of the primitive MOS a/d*L b/d*s.
    return Array(d)
      .fill(bresenham(a / d, b / d, first, second))
      .flat();
  }
}

/**
 * Cumulative sum of input array.
 * @param array Array of steps.
 * @returns Scale of accumulated steps.
 */
export function cumsum(array: number[]): number[] {
  if (!array.length) {
    return [];
  }
  const result = [array[0]];
  for (let i = 1; i < array.length; ++i) {
    result.push(result[i - 1] + array[i]);
  }
  return result;
}

const BRIGHT_GENERATORS: Map<string, [number, number]> = new Map([
  ['2,5', [1, 2]],
  ['5,2', [3, 1]],
  ['2,9', [1, 4]],
  ['3,8', [2, 5]],
  ['4,7', [3, 5]],
  ['7,4', [2, 1]],
  ['8,3', [3, 1]],
  ['9,2', [5, 1]],
  ['3,5', [2, 3]],
  ['5,3', [2, 1]],
  ['2,7', [1, 3]],
  ['7,2', [4, 1]],
  ['3,7', [1, 2]],
  ['7,3', [5, 2]],
  ['5,7', [3, 4]],
  ['7,5', [3, 2]],
]);

/**
 * Find the bright generator for a MOS pattern.
 * @param l Number of large steps.
 * @param s Number of small steps.
 * @returns [generator's number of large steps, generator's number of small steps]
 */
export function mosGeneratorMonzo(l: number, s: number): [number, number] {
  // Shortcuts
  if (s === 1) {
    return [1, 0];
  }
  if (l === 1) {
    return [1, s - 1];
  }
  if (l === s - 1) {
    return [1, 1];
  }
  if (l === s + 1) {
    return [l - 1, s - 1];
  }

  // Pre-calculated
  const key = `${l},${s}`;
  if (BRIGHT_GENERATORS.has(key)) {
    return BRIGHT_GENERATORS.get(key)!;
  }

  // Degenerate cases
  if (l === 0) {
    return [0, 1];
  }
  if (s === 0) {
    return [1, 0];
  }

  // General algorithm

  // https://en.xen.wiki/w/UDP
  // "The bright generator will always be s⁻¹ mod T...",
  const t = l + s;
  const brightGeneratorSteps = modInv(s, t);

  // Obtain some MOS pattern
  const pattern = bjorklundStr(l, s);
  const current: [number, number] = [0, 0];
  const euclidScale: [number, number][] = [current];
  for (const character of pattern) {
    if (character === 'L') {
      current[0] += 1;
    } else {
      current[1] += 1;
    }
    euclidScale.push([...current]);
  }

  // Take the bright generator
  return euclidScale[brightGeneratorSteps];
}
