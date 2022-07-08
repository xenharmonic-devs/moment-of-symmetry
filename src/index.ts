import Fraction from 'fraction.js';
import {getHardness} from './hardness';
import {tamnamsInfo, modeName} from './names';
import {arraysEqual, gcd, mmod, getSemiconvergents, FractionSet} from './utils';

export * from './utils';
export * from './hardness';
export * from './names';

/**
 * Distribute subsequences as evenly as possible using Björklund's algorithm.
 */
function bjorklund(subsequences: any[][]) {
  while (true) {
    const remainder = subsequences[subsequences.length - 1];
    const distributed: any[][] = [];
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
      subsequences[i] = subsequences[i].concat(distributed.pop());
    }
    subsequences = subsequences.concat(distributed);
  }
}

/**
 * Produce an array of booleans that is mixed as evenly as possible.
 * @param numberOfTrue Number of true elements
 * @param numberOfFalse Number of false elements
 * @returns The array of evenly mixed booleans
 */
export function euclid(numberOfTrue: number, numberOfFalse: number): boolean[] {
  const subsequences = [];
  for (let i = 0; i < numberOfTrue; ++i) {
    subsequences.push([true]);
  }
  for (let i = 0; i < numberOfFalse; ++i) {
    subsequences.push([false]);
  }
  return bjorklund(subsequences).reduce((a, b) => a.concat(b), []);
}

const BRIGTH_GENERATORS: {[key: string]: [number, number]} = {
  '2,5': [1, 2],
  '5,2': [3, 1],
  '2,9': [1, 4],
  '3,8': [2, 5],
  '4,7': [3, 5],
  '7,4': [2, 1],
  '8,3': [3, 1],
  '9,2': [5, 1],
  '3,5': [2, 3],
  '5,3': [2, 1],
  '2,7': [1, 3],
  '7,2': [4, 1],
  '3,7': [1, 2],
  '7,3': [5, 2],
  '5,7': [3, 4],
  '7,5': [3, 2],
};

/**
 * Find the bright generator for a MOS pattern.
 * @param l Number of large steps.
 * @param s Number of small steps.
 * @returns [generator's number of large steps, generator's number of small steps]
 */
function mosGeneratorMonzo(l: number, s: number): [number, number] {
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
  if (key in BRIGTH_GENERATORS) {
    return BRIGTH_GENERATORS[key];
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
  let brightGeneratorSteps = -1;
  for (let i = 1; i < t; ++i) {
    if ((s * i) % t === 1) {
      brightGeneratorSteps = i;
      break;
    }
  }

  // Obtain some MOS pattern
  const pattern = euclid(l, s);
  const current: [number, number] = [0, 0];
  const euclidScale: [number, number][] = [current];
  pattern.forEach(e => {
    if (e) {
      current[0] += 1;
    } else {
      current[1] += 1;
    }
    euclidScale.push([...current]);
  });

  // Take the bright generator
  const g1 = euclidScale[brightGeneratorSteps];
  // Use a back-up in case euclid generated a dark scale
  const g2 = euclidScale[brightGeneratorSteps + 1];
  g2[0] -= euclidScale[1][0];
  g2[1] -= euclidScale[1][1];
  if (g2[0] > g1[0]) {
    return g2;
  }
  return g1;
}

/**
 * Generate MOS pattern as a subset of an EDO.
 * @param numberOfLargeSteps Number of large steps in the MOS pattern.
 * @param numberOfSmallSteps Number of small steps in the MOS pattern.
 * @param sizeOfLargeStep Size of the large step in EDO steps.
 * @param sizeOfSmallStep Size of the small step in EDO steps.
 * @param brightGeneratorsUp How many bright generators to go upwards. Also the number of large/major intervals in the resulting scale.
 * @returns An array of integers representing the EDO subset. The 0 degree is not included, but the final degree representing the size of the EDO is.
 */
export function mos(
  numberOfLargeSteps: number,
  numberOfSmallSteps: number,
  sizeOfLargeStep = 2,
  sizeOfSmallStep = 1,
  brightGeneratorsUp = 0
) {
  const numPeriods = gcd(numberOfLargeSteps, numberOfSmallSteps);
  if (brightGeneratorsUp % numPeriods !== 0) {
    throw new Error(`Number of generators not a multiple of ${numPeriods}`);
  }
  const period = (numberOfLargeSteps + numberOfSmallSteps) / numPeriods;
  const l = numberOfLargeSteps / numPeriods;
  const s = numberOfSmallSteps / numPeriods;
  const u = brightGeneratorsUp / numPeriods;
  const p = l * sizeOfLargeStep + s * sizeOfSmallStep;

  const gMonzo = mosGeneratorMonzo(l, s);
  const g = gMonzo[0] * sizeOfLargeStep + gMonzo[1] * sizeOfSmallStep;

  const base: number[] = [];
  for (let i = 0; i < period; ++i) {
    base.push(mmod((u - i) * g, p));
  }
  base.sort((a, b) => a - b);
  let result = base;
  for (let i = 1; i < numPeriods; ++i) {
    result = result.concat(base.map(s => s + i * p));
  }
  result.shift();
  result.push(numPeriods * p);

  return result;
}

/**
 * Generate MOS pattern as a subset of an EDO with parent MOS relationship indicated.
 * @param numberOfLargeSteps Number of large steps in the MOS pattern.
 * @param numberOfSmallSteps Number of small steps in the MOS pattern.
 * @param sizeOfLargeStep Size of the large step in EDO steps.
 * @param sizeOfSmallStep Size of the small step in EDO steps.
 * @param brightGeneratorsUp How many bright generators to go upwards. Also the number of large/major intervals in the resulting scale.
 * @param flats If true the non-parent scale degrees will be dark. Defaults to bright (`false`).
 * @returns A map of integers representing the EDO subset to booleans indicating if the scale degree belongs to the parent MOS or not.
 * The 0 degree is not included, but the final degree representing the size of the EDO is.
 */
export function mosWithParent(
  numberOfLargeSteps: number,
  numberOfSmallSteps: number,
  sizeOfLargeStep = 2,
  sizeOfSmallStep = 1,
  brightGeneratorsUp = 0,
  flats = false
) {
  const numPeriods = gcd(numberOfLargeSteps, numberOfSmallSteps);
  if (brightGeneratorsUp % numPeriods !== 0) {
    throw new Error(`Number of generators not a multiple of ${numPeriods}`);
  }
  const period = (numberOfLargeSteps + numberOfSmallSteps) / numPeriods;
  const l = numberOfLargeSteps / numPeriods;
  const s = numberOfSmallSteps / numPeriods;
  const u = brightGeneratorsUp / numPeriods;
  const p = l * sizeOfLargeStep + s * sizeOfSmallStep;

  const gMonzo = mosGeneratorMonzo(l, s);
  const g = gMonzo[0] * sizeOfLargeStep + gMonzo[1] * sizeOfSmallStep;

  const parentPeriod = Math.max(l, s);

  const base: Map<number, boolean> = new Map();
  for (let i = 0; i < period; ++i) {
    let isParent: boolean;
    if (flats) {
      isParent = period - i <= parentPeriod;
    } else {
      isParent = i < parentPeriod;
    }
    base.set(mmod((u - i) * g, p), isParent);
  }
  const edoDegrees = [...base.keys()].sort((a, b) => a - b);
  let result: Map<number, boolean> = new Map();
  for (let i = 0; i < numPeriods; ++i) {
    edoDegrees.forEach(degree => {
      result = result.set(degree + i * p, base.get(degree)!);
    });
  }
  const rootIsParent = result.get(0)!;
  result.delete(0);
  result.set(numPeriods * p, rootIsParent);

  return result;
}

/**
 * Generate the daughter MOS pattern as a subset of an EDO with parent MOS relationship indicated.
 * @param numberOfLargeSteps Number of large steps in the parent MOS.
 * @param numberOfSmallSteps Number of small steps in the parent MOS.
 * @param sizeOfLargeStep Size of the large step in EDO steps.
 * @param sizeOfSmallStep Size of the small step in EDO steps.
 * @param brightGeneratorsUp How many bright generators to go upwards. Also the number of large/major intervals in the resulting scale.
 * @param flats If true the additional scale degrees will be dark. Defaults to bright (`false`).
 * @returns A map of integers representing the EDO subset to booleans indicating if the scale degree belongs to the parent MOS or not.
 * The 0 degree is not included, but the final degree representing the size of the EDO is.
 */
export function mosWithDaughter(
  numberOfLargeSteps: number,
  numberOfSmallSteps: number,
  sizeOfLargeStep = 2,
  sizeOfSmallStep = 1,
  brightGeneratorsUp = 0,
  flats = false
) {
  const daughter = daughterMos(
    numberOfLargeSteps,
    numberOfSmallSteps,
    sizeOfLargeStep,
    sizeOfSmallStep
  );
  if (flats) {
    const numPeriods = gcd(
      daughter.numberOfLargeSteps,
      daughter.numberOfSmallSteps
    );
    brightGeneratorsUp =
      daughter.numberOfLargeSteps +
      daughter.numberOfSmallSteps -
      numPeriods -
      brightGeneratorsUp;
  }
  return mosWithParent(
    daughter.numberOfLargeSteps,
    daughter.numberOfSmallSteps,
    daughter.sizeOfLargeStep,
    daughter.sizeOfSmallStep,
    brightGeneratorsUp,
    flats
  );
}

/** Information about a MOS mode. */
export type ModeInfo = {
  /** Number of steps in a period. */
  period: number;
  /** Number of periods in an octave. */
  numberOfPeriods: number;
  /** UDP notation: U|D(P) where U = bright generators going up, D = bright generators going down, P = numberOfPeriods if not 1. */
  udp: string;
  /** Mode in step pattern format such as "LLsLLLs". */
  mode: string;
  /** Name of the mode. */
  modeName?: string;
};

/**
 * Information about the modes of a MOS scale.
 * @param numberOfLargeSteps Number of large steps in the MOS pattern.
 * @param numberOfSmallSteps Number of small steps in the MOS pattern.
 * @param extra If true adds extra mode names in parenthesis such as Ionian (Major).
 * @returns An array of mode information.
 */
export function mosModes(
  numberOfLargeSteps: number,
  numberOfSmallSteps: number,
  extra = false
): ModeInfo[] {
  const numberOfPeriods = gcd(numberOfLargeSteps, numberOfSmallSteps);
  const period = (numberOfLargeSteps + numberOfSmallSteps) / numberOfPeriods;
  const l = numberOfLargeSteps / numberOfPeriods;
  const s = numberOfSmallSteps / numberOfPeriods;
  const p = l * 2 + s;

  const gMonzo = mosGeneratorMonzo(l, s);
  const g = gMonzo[0] * 2 + gMonzo[1];

  const result = [];
  for (let u = 0; u < period; ++u) {
    const base: number[] = [];
    for (let i = 0; i < period; ++i) {
      base.push(mmod((u - i) * g, p));
    }
    base.sort((a, b) => a - b);
    let scale = base;
    for (let i = 1; i < numberOfPeriods; ++i) {
      scale = scale.concat(base.map(s => s + i * p));
    }
    scale.push(numberOfPeriods * p);

    let pattern = '';
    for (let i = 1; i < scale.length; ++i) {
      if (scale[i] - scale[i - 1] === 2) {
        pattern += 'L';
      } else {
        pattern += 's';
      }
    }
    const modeName_ = modeName(pattern, extra);
    let udp = `${u * numberOfPeriods}|${(period - 1 - u) * numberOfPeriods}`;
    if (numberOfPeriods > 1) {
      udp += `(${numberOfPeriods})`;
    }
    result.push({
      period,
      numberOfPeriods,
      udp,
      mode: pattern,
      modeName: modeName_,
    });
  }

  return result;
}

/**
 * Information about a mode of a MOS scale.
 * @param numberOfLargeSteps Number of large steps in the MOS pattern.
 * @param numberOfSmallSteps Number of small steps in the MOS pattern.
 * @param brightGeneratorsUp Number of bright generators going up.
 * @param extra If true adds extra mode names in parenthesis such as Ionian (Major).
 * @returns An array of mode information.
 */
export function modeInfo(
  numberOfLargeSteps: number,
  numberOfSmallSteps: number,
  brightGeneratorsUp: number,
  extra = false
): ModeInfo {
  const numberOfPeriods = gcd(numberOfLargeSteps, numberOfSmallSteps);
  const period = (numberOfLargeSteps + numberOfSmallSteps) / numberOfPeriods;
  const scale = mos(
    numberOfLargeSteps,
    numberOfSmallSteps,
    2,
    1,
    brightGeneratorsUp
  );
  scale.unshift(0);
  let pattern = '';
  for (let i = 1; i < scale.length; ++i) {
    if (scale[i] - scale[i - 1] === 2) {
      pattern += 'L';
    } else {
      pattern += 's';
    }
  }
  const modeName_ = modeName(pattern, extra);
  let udp = `${brightGeneratorsUp}|${
    (period - 1) * numberOfPeriods - brightGeneratorsUp
  }`;
  if (numberOfPeriods > 1) {
    udp += `(${numberOfPeriods})`;
  }
  return {
    period,
    numberOfPeriods,
    udp,
    mode: pattern,
    modeName: modeName_,
  };
}

/**
 * An array of fractions that convey information about a MOS scale.
 * @param generatorPerPeriod Generator divided by period.
 * @param maxSize Maximum size of a MOS pattern.
 * @param maxLength Maximum length of the result.
 * @returns An array of MOS forms.
 */
export function mosForms(
  generatorPerPeriod: number | Fraction,
  maxSize?: number,
  maxLength?: number
) {
  if (maxLength !== undefined) {
    maxLength += 2;
  }
  generatorPerPeriod = new Fraction(generatorPerPeriod);
  generatorPerPeriod.n = mmod(generatorPerPeriod.n, generatorPerPeriod.d);
  const convergents = getSemiconvergents(
    generatorPerPeriod,
    maxSize,
    maxLength
  );
  // Get rid of the first two
  convergents.shift();
  convergents.shift();
  return convergents;
}

/**
 * An array of sizes of MOS patterns.
 * @param generatorPerPeriod Generator divided by period.
 * @param maxSize Maximum size of a MOS pattern.
 * @param maxLength Maximum length of the result.
 * @returns An array of MOS sizes.
 */
export function mosSizes(
  generatorPerPeriod: number | Fraction,
  maxSize?: number,
  maxLength?: number
) {
  return mosForms(generatorPerPeriod, maxSize, maxLength).map(
    convergent => convergent.d
  );
}

/**
 * Flip a generator / period ratio to a bright version if necessary.
 * @param generatorPerPeriod Generator divided by period.
 * @param size Size of the scale.
 * @returns The first parameter. Flipped if it was dark.
 */
export function toBrightGeneratorPerPeriod(
  generatorPerPeriod: number,
  size: number
) {
  const one = new Fraction(1);
  const generator = new Fraction(generatorPerPeriod).mod(one).add(one).mod(one);
  const negativeGenerator = one.sub(generator);
  const range = [...Array(size).keys()];
  const positive = range.map(i => generator.mul(i).mod(one));
  positive.sort((a, b) => a.compare(b));
  positive.push(one);
  const negative = range.map(i => negativeGenerator.mul(i).mod(one));
  negative.sort((a, b) => a.compare(b));
  negative.push(one);

  // Check which scale has brighter intervals
  for (let i = 1; i < positive.length; ++i) {
    const positiveInterval = positive[i].sub(positive[0]);
    const negativeInterval = negative[i].sub(negative[0]);
    const cmp = positiveInterval.compare(negativeInterval);
    if (cmp > 0) {
      return mmod(generatorPerPeriod, 1);
    }
    if (cmp < 0) {
      return mmod(-generatorPerPeriod, 1);
    }
  }

  // Ambiguous generator
  return mmod(generatorPerPeriod, 1);
}

/** Information about a MOS pattern. */
export type MosInfo = {
  /** MOS pattern such as "5L 2s". */
  mosPattern: string;
  /** Number of large steps in the pattern. */
  numberOfLargeSteps: number;
  /** Number of small steps in the pattern. */
  numberOfSmallSteps: number;
  /** TAMNAMS name of the pattern. */
  name?: string;
  /** True if the pattern is a subset of a larger MOS pattern. */
  subset?: boolean;
  /** Interval prefix. */
  prefix?: string;
  /** TAMNAMS name abbreviation. */
  abbreviation?: string;
};

function splitMosPattern(mosPattern: string): [number, number] {
  const [l, s] = mosPattern.split('L');
  const numberOfLargeSteps = parseInt(l.trim());
  const numberOfSmallSteps = parseInt(s.split('s')[0].trim());
  return [numberOfLargeSteps, numberOfSmallSteps];
}

/**
 * Calculate the parent MOS of a given MOS pattern.
 * @param mosPattern MOS pattern such as "5L 2s".
 * @returns Information about the parent MOS.
 */
export function parentMos(mosPattern: string): MosInfo;
/**
 * Calculate the parent MOS of a given MOS pattern.
 * @param numberOfLargeSteps Number of large steps in the MOS pattern.
 * @param numberOfSmallSteps Number of small steps in the MOS pattern.
 * @returns Information about the parent MOS.
 */
export function parentMos(
  numberOfLargeSteps: number,
  numberOfSmallSteps: number
): MosInfo;
export function parentMos(
  patternOrLarge: string | number,
  numberOfSmallSteps?: number
): MosInfo {
  let numberOfLargeSteps: number;
  if (typeof patternOrLarge === 'string') {
    [numberOfLargeSteps, numberOfSmallSteps] = splitMosPattern(patternOrLarge);
  } else {
    numberOfLargeSteps = patternOrLarge;
    if (typeof numberOfSmallSteps !== 'number') {
      throw new Error('Number of small steps must be given');
    }
  }
  const parentSize = Math.max(numberOfLargeSteps, numberOfSmallSteps);
  numberOfLargeSteps = Math.min(numberOfLargeSteps, numberOfSmallSteps);
  numberOfSmallSteps = parentSize - numberOfLargeSteps;

  const mosPattern = `${numberOfLargeSteps}L ${numberOfSmallSteps}s`;
  const info = {
    numberOfLargeSteps,
    numberOfSmallSteps,
    mosPattern,
  };
  Object.assign(info, tamnamsInfo(mosPattern));
  return info;
}

/**
 * An array of information about the MOS patterns generated from a generator / period ratio.
 * @param generatorPerPeriod Generator divided by period.
 * @param numberOfPeriods Number of periods per octave.
 * @param maxSize Maximum size of a MOS pattern.
 * @param maxLength Maximum length of the result.
 * @returns An array of MOS information.
 */
export function mosPatterns(
  generatorPerPeriod: number | Fraction,
  numberOfPeriods = 1,
  maxSize?: number,
  maxLength?: number
) {
  if (maxLength !== undefined) {
    maxLength += 1;
  }
  const forms = mosForms(generatorPerPeriod, undefined, maxLength);
  const result: MosInfo[] = [];
  let size: number | undefined;
  for (let j = 0; j < forms.length; ++j) {
    const form = forms[j];
    if (size !== undefined) {
      if (size > maxSize!) {
        break;
      }
      // Mathematical correct modulo as recommended by Fraction.js documentation
      const scale = [...Array(size).keys()].map(i =>
        form.mul(i).mod(1).add(1).mod(1)
      );
      scale.push(new Fraction(1));
      scale.sort((a, b) => a.compare(b));
      let s = scale[1];
      for (let i = 0; i < size; ++i) {
        const other = scale[i + 1].sub(scale[i]);
        const cmp = other.compare(s);
        if (cmp < 0) {
          s = other;
          break;
        } else if (cmp > 0) {
          break;
        }
      }
      let numberOfSmallSteps = 0;
      let numberOfLargeSteps = 0;
      for (let i = 0; i < size; ++i) {
        if (scale[i].add(s).equals(scale[i + 1])) {
          numberOfSmallSteps++;
        } else {
          numberOfLargeSteps++;
        }
      }
      numberOfLargeSteps *= numberOfPeriods;
      numberOfSmallSteps *= numberOfPeriods;
      const mosPattern = `${numberOfLargeSteps}L ${numberOfSmallSteps}s`;
      const info = {
        numberOfLargeSteps,
        numberOfSmallSteps,
        mosPattern,
      };
      Object.assign(info, tamnamsInfo(mosPattern));
      result.push(info);
    }
    size = form.d;
  }

  return result;
}

/** Information about a MOS scale. */
export type MosScaleInfo = {
  /** MOS pattern such as "5L 2s". */
  mosPattern: string;
  /** Number of large steps in the pattern. */
  numberOfLargeSteps: number;
  /** Number of small steps in the pattern. */
  numberOfSmallSteps: number;
  /** Size of the large step in EDO steps. */
  sizeOfLargeStep: number;
  /** Size of the small step in EDO steps. */
  sizeOfSmallStep: number;
  /** Name of the step size ratio or the name of the hardness range it belongs to. */
  hardness: string;
  /** TAMNAMS name of the pattern. */
  name?: string;
  /** True if the pattern is a subset of a larger MOS pattern. */
  subset?: boolean;
  /** Interval prefix. */
  prefix?: string;
  /** TAMNAMS name abbreviation. */
  abbreviation?: string;
};

export function daughterMos(
  numberOfLargeSteps: number,
  numberOfSmallSteps: number,
  sizeOfLargeStep: number,
  sizeOfSmallStep: number
): MosScaleInfo {
  const size = numberOfLargeSteps + numberOfSmallSteps;
  if (sizeOfLargeStep >= 2 * sizeOfSmallStep) {
    numberOfSmallSteps = size;
    sizeOfLargeStep -= sizeOfSmallStep;
  } else {
    numberOfSmallSteps = numberOfLargeSteps;
    numberOfLargeSteps = size;
    const temp = sizeOfSmallStep;
    sizeOfSmallStep = sizeOfLargeStep - sizeOfSmallStep;
    sizeOfLargeStep = temp;
  }

  const mosPattern = `${numberOfLargeSteps}L ${numberOfSmallSteps}s`;
  const info = {
    numberOfLargeSteps,
    numberOfSmallSteps,
    sizeOfLargeStep,
    sizeOfSmallStep,
    mosPattern,
    hardness: getHardness(sizeOfLargeStep, sizeOfSmallStep),
  };
  Object.assign(info, tamnamsInfo(mosPattern));
  return info;
}

function scalePattern(scale: Fraction[]) {
  const stepSizes = new FractionSet();
  for (let i = 1; i < scale.length; ++i) {
    stepSizes.add(scale[i].sub(scale[i - 1]));
  }
  if (stepSizes.size === 1) {
    return 'M'.repeat(scale.length);
  }
  if (stepSizes.size === 2) {
    const sizes = [...stepSizes];
    sizes.sort((a, b) => a.compare(b));
    let pattern = '';
    for (let i = 1; i < scale.length; ++i) {
      if (scale[i].sub(scale[i - 1]).equals(sizes[0])) {
        pattern += 's';
      } else {
        pattern += 'L';
      }
    }
    return pattern;
  }
  if (stepSizes.size === 3) {
    const sizes = [...stepSizes];
    sizes.sort((a, b) => a.compare(b));
    let pattern = '';
    for (let i = 1; i < scale.length; ++i) {
      const interval = scale[i].sub(scale[i - 1]);
      if (interval.equals(sizes[0])) {
        pattern += 's';
      } else if (interval.equals(sizes[1])) {
        pattern += 'M';
      } else {
        pattern += 'L';
      }
    }
    return pattern;
  }
  throw new Error(`Too many step sizes (${stepSizes.size})`);
}

/** Information about a scale. */
export type ScaleInfo = {
  /** Steps of the scale L = large, M = medium, s = small */
  stepPattern: string;
  /** MOS pattern such as "5L 2s". */
  mosPattern?: string;
  /** TAMNAMS name of the pattern. */
  name?: string;
  /** True if the pattern is a subset of a larger MOS pattern. */
  subset?: boolean;
  /** Interval prefix. */
  prefix?: string;
  /** TAMNAMS name abbreviation. */
  abbreviation?: string;
  /** Name of the mode. */
  modeName?: string;
};

/**
 * Information about the scale generated from a generator / period ratio of a given size.
 * @param generatorPerPeriod Generator divided by period.
 * @param numberOfPeriods Number of periods per octave.
 * @param size Size of the scale.
 * @param generatorsDown How many generators to go downwards.
 * @returns Information about the scale.
 */
export function scaleInfo(
  generatorPerPeriod: number | Fraction,
  size: number,
  generatorsDown: number,
  numberOfPeriods = 1
): ScaleInfo {
  if (size % numberOfPeriods) {
    throw new Error('Size must be divisible by the number of periods');
  }
  if (generatorsDown % numberOfPeriods) {
    throw new Error(
      'Number of generators must be divisible by the number of periods'
    );
  }
  size /= numberOfPeriods;
  generatorsDown /= numberOfPeriods;

  const g = new Fraction(generatorPerPeriod);
  const scale = [...Array(size).keys()].map(i =>
    g
      .mul(i - generatorsDown)
      .mod(1)
      .add(1)
      .mod(1)
  );
  scale.push(new Fraction(1));
  scale.sort((a, b) => a.compare(b));
  const pattern = scalePattern(scale);
  const info: ScaleInfo = {stepPattern: pattern.repeat(numberOfPeriods)};
  if (pattern.includes('M')) {
    return info;
  }

  let numberOfSmallSteps = 0;
  let numberOfLargeSteps = 0;
  [...pattern].forEach(s => {
    if (s === 's') {
      numberOfSmallSteps++;
    } else {
      numberOfLargeSteps++;
    }
  });

  numberOfSmallSteps *= numberOfPeriods;
  numberOfLargeSteps *= numberOfPeriods;
  const mosPattern = `${numberOfLargeSteps}L ${numberOfSmallSteps}s`;
  info.mosPattern = mosPattern;
  (info.modeName = modeName(pattern.repeat(numberOfPeriods))),
    Object.assign(info, tamnamsInfo(mosPattern));
  return info;
}

// One entry in the EDO map for each hardness class
const STEP_SIZES: [number, number][] = [
  [2, 1], // basic
  [3, 2], // soft
  [3, 1], // hard
  [4, 3], // supersoft
  [4, 1], // superhard
  [5, 3], // semisoft
  [5, 2], // semihard

  [5, 4], // ultrasoft
  [5, 1], // ultrahard

  [7, 5], // parasoft
  [7, 4], // minisoft
  [7, 3], // minihard
  [7, 2], // parahard

  [8, 5], // quasisoft
  [8, 3], // quasihard
];

/**
 * Construct a mapping from EDO size to supported MOS scales.
 * @param maxSize Maximum size of the MOS patterns to include.
 * @returns A mapping from EDO size to an array of information about the supported MOS scales.
 */
export function makeEdoMap(maxSize = 12): Map<number, MosScaleInfo[]> {
  const result = new Map();
  STEP_SIZES.forEach(([sizeOfLargeStep, sizeOfSmallStep]) => {
    const hardness = getHardness(sizeOfLargeStep, sizeOfSmallStep);
    for (let size = 2; size <= maxSize; ++size) {
      for (
        let numberOfLargeSteps = 1;
        numberOfLargeSteps < size;
        ++numberOfLargeSteps
      ) {
        const numberOfSmallSteps = size - numberOfLargeSteps;
        const mosPattern = `${numberOfLargeSteps}L ${numberOfSmallSteps}s`;
        const edo =
          numberOfLargeSteps * sizeOfLargeStep +
          numberOfSmallSteps * sizeOfSmallStep;
        const info = {
          mosPattern,
          numberOfLargeSteps,
          numberOfSmallSteps,
          sizeOfLargeStep,
          sizeOfSmallStep,
          hardness,
        };
        Object.assign(info, tamnamsInfo(mosPattern));
        const infos = result.get(edo) || [];
        infos.push(info);
        result.set(edo, infos);
      }
    }
  });
  return result;
}

const STEP_COUNTS: [number, number][] = [
  [5, 2], // diatonic
  [4, 3], // smitonic
  [3, 4], // mosh
  [2, 5], // antidiatonic

  [3, 5], // sensoid
  [5, 3], // oneirotonic
  [6, 2], // echinoid
  [2, 6], // antiechinoid

  [4, 2], // lemon
  [2, 4], // antilemon
  [5, 1], // machinoid

  [2, 3], // pentic
  [3, 2], // antipentic
  [1, 4], // machinoid (subset)

  [1, 3], // manic

  [1, 2], // happy
  [2, 1], // grumpy

  [1, 1], // trivial
];

/**
 * Find a MOS scale supported by the given EDO.
 * @param edo Size of the EDO.
 * @returns Information about the supported MOS scale.
 */
export function anyForEdo(edo: number): MosScaleInfo {
  if (edo <= 1) {
    throw new Error('Minimum size is 2');
  }
  if (edo === 2) {
    return {
      mosPattern: '1L 1s',
      numberOfLargeSteps: 1,
      numberOfSmallSteps: 1,
      sizeOfLargeStep: 1,
      sizeOfSmallStep: 1,
      hardness: 'equalized',
      name: 'trivial',
      subset: false,
    };
  }

  for (let i = 0; i < STEP_COUNTS.length; ++i) {
    const [numberOfLargeSteps, numberOfSmallSteps] = STEP_COUNTS[i];
    let sizeOfLargeStep = 2;
    while (true) {
      const largePart = sizeOfLargeStep * numberOfLargeSteps;
      const smallPart = edo - largePart;
      if (smallPart <= 0) {
        break;
      }
      if (smallPart % numberOfSmallSteps === 0) {
        const sizeOfSmallStep = smallPart / numberOfSmallSteps;
        if (
          sizeOfLargeStep <= 3 * sizeOfSmallStep &&
          3 * sizeOfSmallStep <= 2 * sizeOfLargeStep
        ) {
          const mosPattern = `${numberOfLargeSteps}L ${numberOfSmallSteps}s`;
          const hardness = getHardness(sizeOfLargeStep, sizeOfSmallStep);
          const info = {
            mosPattern,
            numberOfLargeSteps,
            numberOfSmallSteps,
            sizeOfLargeStep,
            sizeOfSmallStep,
            hardness,
          };
          Object.assign(info, tamnamsInfo(mosPattern));
          return info;
        }
      }
      sizeOfLargeStep++;
    }
  }
  throw new Error(`Failed to find MOS pattern for ${edo}`);
}
