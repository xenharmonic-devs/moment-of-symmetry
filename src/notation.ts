import {gcd} from 'xen-dev-utils';
import {mosGeneratorMonzo} from './helpers';

/**
 * Valid nominals for absolute pitches in [Diamond mos notation](https://en.xen.wiki/w/Diamond-mos_notation).
 */
export type DiamondMosAlphabet =
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
  scale: Map<string, MosMonzo>;
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
  /**
   * Bright generator of the scale.
   */
  brightGenerator: MosMonzo;
};

/** Single characters of valid nominals. */
export const DIAMOND_MOS_ALPHABET: DiamondMosAlphabet[] = [
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];

/**
 * Obtain the 0-indexed nth generalized Diamond-mos nominal.
 * @param n Index of the nominal.
 * @returns A single character from J through Z or a multi-character string like 'JJ' starting from n = 17.
 */
export function nthNominal(n: number): string {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error('Invalid nominal index');
  }
  if (n >= DIAMOND_MOS_ALPHABET.length) {
    return (
      nthNominal(Math.floor(n / DIAMOND_MOS_ALPHABET.length) - 1) +
      DIAMOND_MOS_ALPHABET[n % DIAMOND_MOS_ALPHABET.length]
    );
  }
  return DIAMOND_MOS_ALPHABET[n];
}

/**
 * Generate configuration for [Diamond mos notation](https://en.xen.wiki/w/Diamond-mos_notation).
 *
 * Always based on J and 0-indexed even if scale is diatonic.
 * @param mode Mode of a MOS scale such as 'LLsLLLs'.
 * @returns Configuration for notation software.
 */
export function generateNotation(mode: string): DiamondMosNotation {
  const scale = new Map<string, MosMonzo>();
  let i = 0;
  const monzo: MosMonzo = [0, 0];
  let hasLarge = false;
  let hasSmall = false;
  for (const character of mode) {
    scale.set(nthNominal(i++), [...monzo]);
    if (character === 'L') {
      monzo[0]++;
      hasLarge = true;
    } else if (character === 's') {
      monzo[1]++;
      hasSmall = true;
    } else {
      throw new Error(`Invalid abstract step '${character}'.`);
    }
  }
  if (!hasLarge || !hasSmall) {
    throw new Error("The scale must contain both 'L' and 's' steps.");
  }
  const equave: MosMonzo = [...monzo];
  const numPeriods = gcd(equave[0], equave[1]);
  const period: MosMonzo = [equave[0] / numPeriods, equave[1] / numPeriods];
  const gen = mosGeneratorMonzo(period[0], period[1]);
  const numUnique = period[0] + period[1];
  const edoperiod = 2 * period[0] + period[1];
  const basic: [number, MosMonzo, boolean, MosMonzo?][] = [
    [0, [0, 0], true, undefined],
  ];
  // Exception for nL ns
  if (numUnique === 2) {
    basic.push([2, [gen[0] - 0.5, gen[1] + 0.5], false, undefined]);
  } else {
    // Dark mid
    basic.push([
      edoperiod - 2 * gen[0] - gen[1],
      [period[0] - gen[0], period[1] - gen[1]],
      true,
      [period[0] - gen[0] + 0.5, period[1] - gen[1] - 0.5],
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
      while (edostep >= edoperiod) {
        edostep -= edoperiod;
        monzo[0] -= period[0];
        monzo[1] -= period[1];
      }
      // Imperfect central
      basic.push([edostep, [monzo[0] - 0.5, monzo[1] + 0.5], false, undefined]);
    }
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
    period,
    brightGenerator: gen,
  };
}
