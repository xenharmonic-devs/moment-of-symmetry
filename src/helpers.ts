/**
 * Internal helper functions not intended to be published.
 */

import {arraysEqual, extendedEuclid, gcd} from 'xen-dev-utils';

/**
 * Distribute subsequences as evenly as possible using Björklund's algorithm.
 */
export function bjorklund<T>(subsequences: T[][]) {
  while (true) {
    const remainder = subsequences[subsequences.length - 1];
    const distributed: T[][] = [];
    while (
      subsequences.length &&
      arraysEqual(subsequences[subsequences.length - 1], remainder)
    ) {
      distributed.push(subsequences.pop()!);
    }
    if (!subsequences.length || distributed.length <= 1) {
      return subsequences.concat(distributed);
    }
    for (let i = 0; distributed.length && i < subsequences.length; ++i) {
      subsequences[i] = subsequences[i].concat(distributed.pop()!);
    }
    subsequences = subsequences.concat(distributed);
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
 * Find the modular inverse of a mod b, provided gcd(a,b) == 1.
 */
export function modInv(a: number, b: number): number {
  const ee = extendedEuclid(a, b);
  const {gcd, coefA} = ee;
  if (gcd === 1) {
    return ((coefA % b) + b) % b; // to ensure remainder is always in {0, 1, ..., b-1}
  } else {
    throw new Error(
      '`a` does not have a modular inverse mod `b` since `a` and `b` are not coprime'
    );
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
