import {gcd} from 'xen-dev-utils';
import {mosGeneratorMonzo} from './helpers';

/**
 * Valid nominals for absolute pitches in [Diamond mos notation](https://en.xen.wiki/w/Diamond-mos_notation).
 */
export type DiamondMosNominal =
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z';

/**
 * Count of L steps followed by count of s steps.
 */
export type MosMonzo = [number, number];

/**
 * 0-indexed degree of [Diamond mos notation](https://en.xen.wiki/w/Diamond-mos_notation).
 */
export type DiamondMosDegree = {
  /**
   * Center of this degree. A perfect or a neutral interval.
   */
  center: MosMonzo;
  /**
   * Quality of this degree. Imperfect has a neutral center and must be further processed to obtain the minor and major variants.
   */
  perfect: boolean;
  /**
   * The neutral interval for perfect intervals where it makes sense.
   */
  mid?: MosMonzo;
};

/**
 * [Diamond mos notation](https://en.xen.wiki/w/Diamond-mos_notation) configuration.
 */
export type DiamondMosNotation = {
  /**
   * Counts of [L, s] steps for every available nominal with J at unison. Add equaves to reach other octaves.
   */
  scale: Map<DiamondMosNominal, MosMonzo>;
  /**
   * Interval of equivalence / octave.
   */
  equave: MosMonzo;
  /**
   * 0-indexed degree of the scale for one period. Add periods to reach further.
   */
  degrees: DiamondMosDegree[];
  /**
   * Interval of repetition.
   */
  period: MosMonzo;
};

/**
 * Generate configuration for [Diamond mos notation](https://en.xen.wiki/w/Diamond-mos_notation).
 *
 * Always based on J and 0-indexed even if scale is diatonic.
 * @param mode Mode of a MOS scale such as 'LLsLLLs'.
 * @returns Configuration for notation software.
 */
export function generateNotation(mode: string): DiamondMosNotation {
  const scale = new Map<DiamondMosNominal, MosMonzo>();
  let code = 'J'.charCodeAt(0);
  const monzo: MosMonzo = [0, 0];
  for (const character of mode) {
    scale.set(String.fromCharCode(code++) as DiamondMosNominal, [...monzo]);
    if (character === 'L') {
      monzo[0]++;
    } else if (character === 's') {
      monzo[1]++;
    }
  }
  if (code >= 'Z'.charCodeAt(0)) {
    throw new Error('Out of Diamond mos nominals.');
  }
  const equave: MosMonzo = [...monzo];
  const numPeriods = gcd(equave[0], equave[1]);
  const gen = mosGeneratorMonzo(equave[0] / numPeriods, equave[1] / numPeriods);
  const numUnique = (equave[0] + equave[1]) / numPeriods;
  const period = 2 * equave[0] + equave[1];
  const basic: [number, MosMonzo, boolean, MosMonzo?][] = [
    [0, [0, 0], true, undefined],
  ];
  // Dark mid
  basic.push([
    period - 2 * gen[0] - gen[1],
    [equave[0] - gen[0], equave[1] - gen[1]],
    true,
    [equave[0] - gen[0] + 0.5, equave[1] - gen[1] - 0.5],
  ]);
  let edostep = 2 * gen[0] + gen[1];
  // Bright mid
  basic.push([edostep, [...gen], true, [gen[0] - 0.5, gen[1] + 0.5]]);
  monzo[0] = gen[0];
  monzo[1] = gen[1];
  for (let i = 2; i < numUnique - 1; ++i) {
    edostep += 2 * gen[0] + gen[1];
    monzo[0] += gen[0];
    monzo[1] += gen[1];
    while (edostep >= period) {
      edostep -= period;
      monzo[0] -= equave[0];
      monzo[1] -= equave[1];
    }
    // Imperfect central
    basic.push([edostep, [monzo[0] - 0.5, monzo[1] + 0.5], false, undefined]);
  }
  basic.sort((a, b) => a[0] - b[0]);
  const degrees: DiamondMosDegree[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [_, center, perfect, mid] of basic) {
    degrees.push({center, perfect, mid});
  }
  return {
    scale,
    degrees,
    equave,
    period: [equave[0] / numPeriods, equave[1] / numPeriods],
  };
}
