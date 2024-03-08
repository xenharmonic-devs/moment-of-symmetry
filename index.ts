import {getHardness} from './hardness';
import {tamnamsInfo, modeName} from './names';
import {ModeInfo, MosInfo, MosScaleInfo, RangeInfo} from './info';
import {
  Fraction,
  arraysEqual,
  fareyInterior,
  gcd,
  mmod,
  extendedEuclid,
} from 'xen-dev-utils';

export * from './hardness';
export * from './names';
export * from './generator-ratio';
export * from './info';

/**
 * Parameters for various function.
 */
export type BaseOptions = {
  /** How many bright generators to go downwards. Also the number of small/minor intervals in the resulting scale. Default = 0. */
  down?: number;
  /** How many bright generators to go upwards. Also the number of large/major intervals in the resulting scale. Defaults to the maximum possible. */
  up?: number;
};

/**
 * Parameters for the {@link modeInfo} function.
 */
export interface ModeInfoOptions extends BaseOptions {
  /** If true adds extra mode names in parenthesis such as Ionian (Major). */
  extraNames?: boolean;
}

/**
 * Parameters for the {@link mos} function.
 */
export interface MosOptions extends BaseOptions {
  /** Size of the large step. Default = 2.*/
  sizeOfLargeStep?: number;
  /** Size of small step. Default = 1. */
  sizeOfSmallStep?: number;
}

/**
 * Parameters for the {@link mosWithParent} function.
 */
export interface MosWithParentOptions extends MosOptions {
  /** How the main scale relates to the parent. Defaults to 'sharp'. */
  accidentals?: 'flat' | 'sharp';
}

/**
 * Parameters for the {@link mosWithDaughter} function.
 */
export interface MosWithDaughterOptions extends MosOptions {
  /** How the daughter scale(s) relates to the main scale. Defaults to 'sharp'. */
  accidentals?: 'flat' | 'sharp' | 'both';
}

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
  // return bresenham(numberOfTrue, numberOfFalse, true, false);
  const subsequences = [];
  for (let i = 0; i < numberOfTrue; ++i) {
    subsequences.push([true]);
  }
  for (let i = 0; i < numberOfFalse; ++i) {
    subsequences.push([false]);
  }
  return bjorklund(subsequences).reduce((a, b) => a.concat(b), []);
}

// This algorithm, a variant of the Bresenham line algorithm, returns the "brightest mode" of
// the "scale" where `first` is treated as larger than `second`.
// It's based on following the closest approximation of the line y = b/a*x that is strictly below the line.
function bresenham(a: number, b: number, first: any, second: any): any[] {
  const d = gcd(a, b);
  if (d === 1) {
    const result: boolean[] = [];
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

const BRIGHT_GENERATORS: {[key: string]: [number, number]} = {
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
 * Find the modular inverse of a mod b, provided gcd(a,b) == 1.
 */
function modInv(a: number, b: number): number {
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
  if (key in BRIGHT_GENERATORS) {
    return BRIGHT_GENERATORS[key];
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

  // Obtain the brightest mode of the MOS pattern
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

  // Return the bright generator
  return euclidScale[brightGeneratorSteps];
}

/**
 * Obtain the bright generator of the MOS scale expressed as multipliers of the size of the large and small steps.
 * @param numberOfLargeSteps Number of large steps in the MOS pattern.
 * @param numberOfSmallSteps Number of small steps in the MOS pattern.
 * @returns An array of [number of large steps in the bright generator, number of small steps in the bright generator].
 */
export function brightGeneratorMonzo(
  numberOfLargeSteps: number,
  numberOfSmallSteps: number
): [number, number] {
  const numPeriods = gcd(numberOfLargeSteps, numberOfSmallSteps);
  return [
    ...mosGeneratorMonzo(
      numberOfLargeSteps / numPeriods,
      numberOfSmallSteps / numPeriods
    ),
  ];
}

function getDown(options: ModeInfoOptions, period: number, numPeriods: number) {
  let down = 0;
  if (options.up !== undefined) {
    down = period * numPeriods - numPeriods - options.up;
    if (options.down !== undefined && down !== options.down) {
      throw new Error('Incompatible up and down with the scale size');
    }
  } else if (options.down !== undefined) {
    down = options.down;
  }
  if (down < 0) {
    throw new Error('Down must not be negative');
  }
  if (down >= period * numPeriods) {
    throw new Error('Up must not be negative');
  }
  if (down % numPeriods !== 0) {
    throw new Error('Up/down must be divisible by the number of periods');
  }
  return down;
}

/**
 * Generate MOS pattern as a subset of an EDO.
 * @param numberOfLargeSteps Number of large steps in the MOS pattern.
 * @param numberOfSmallSteps Number of small steps in the MOS pattern.
 * @param options Options for sizes of the steps and brightness of the scale.
 * @returns An array of integers representing the EDO subset. The 0 degree is not included, but the final degree representing the size of the EDO is.
 */
export function mos(
  numberOfLargeSteps: number,
  numberOfSmallSteps: number,
  options?: MosOptions
) {
  options ??= {};
  const numPeriods = gcd(numberOfLargeSteps, numberOfSmallSteps);
  const period = (numberOfLargeSteps + numberOfSmallSteps) / numPeriods;

  const sizeOfLargeStep = options.sizeOfLargeStep ?? 2;
  const sizeOfSmallStep = options.sizeOfSmallStep ?? 1;

  const brightGeneratorsDown = getDown(options, period, numPeriods);

  const l = numberOfLargeSteps / numPeriods;
  const s = numberOfSmallSteps / numPeriods;
  const d = brightGeneratorsDown / numPeriods;
  const p = l * sizeOfLargeStep + s * sizeOfSmallStep;

  const gMonzo = mosGeneratorMonzo(l, s);
  const g = gMonzo[0] * sizeOfLargeStep + gMonzo[1] * sizeOfSmallStep;

  const base: number[] = [];
  for (let i = 0; i < period; ++i) {
    base.push(mmod((i - d) * g, p));
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
 * @param options Options for sizes of the steps, brightness of the scale and flat/sharp relationship.
 * @returns A map of integers representing the EDO subset to booleans indicating if the scale degree belongs to the parent MOS or not.
 * The 0 degree is not included, but the final degree representing the size of the EDO is.
 */
export function mosWithParent(
  numberOfLargeSteps: number,
  numberOfSmallSteps: number,
  options?: MosWithParentOptions
) {
  options ??= {};
  const numPeriods = gcd(numberOfLargeSteps, numberOfSmallSteps);
  const period = (numberOfLargeSteps + numberOfSmallSteps) / numPeriods;

  const sizeOfLargeStep = options.sizeOfLargeStep ?? 2;
  const sizeOfSmallStep = options.sizeOfSmallStep ?? 1;

  const brightGeneratorsDown = getDown(options, period, numPeriods);

  const l = numberOfLargeSteps / numPeriods;
  const s = numberOfSmallSteps / numPeriods;
  const d = brightGeneratorsDown / numPeriods;
  const p = l * sizeOfLargeStep + s * sizeOfSmallStep;

  const gMonzo = mosGeneratorMonzo(l, s);
  const g = gMonzo[0] * sizeOfLargeStep + gMonzo[1] * sizeOfSmallStep;

  const parentPeriod = Math.max(l, s);

  const base: Map<number, boolean> = new Map();
  for (let i = 0; i < period; ++i) {
    let isParent: boolean;
    if (options.accidentals === 'flat') {
      isParent = period - i <= parentPeriod;
    } else {
      isParent = i < parentPeriod;
    }
    base.set(mmod((i - d) * g, p), isParent);
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
 * @param options Options for sizes of the steps, brightness of the scale and flat/sharp relationship.
 * @returns A map of integers representing the EDO subset to booleans indicating if the scale degree belongs to the parent MOS or not.
 * The 0 degree is not included, but the final degree representing the size of the EDO is.
 */
export function mosWithDaughter(
  numberOfLargeSteps: number,
  numberOfSmallSteps: number,
  options?: MosWithDaughterOptions
) {
  options ??= {};
  const numPeriods = gcd(numberOfLargeSteps, numberOfSmallSteps);
  const period = (numberOfLargeSteps + numberOfSmallSteps) / numPeriods;

  const sizeOfLargeStep = options.sizeOfLargeStep ?? 2;
  const sizeOfSmallStep = options.sizeOfSmallStep ?? 1;

  const brightGeneratorsDown = getDown(options, period, numPeriods);

  const l = numberOfLargeSteps / numPeriods;
  const s = numberOfSmallSteps / numPeriods;
  const d = brightGeneratorsDown / numPeriods;
  const p = l * sizeOfLargeStep + s * sizeOfSmallStep;

  const gMonzo = mosGeneratorMonzo(l, s);
  const g = gMonzo[0] * sizeOfLargeStep + gMonzo[1] * sizeOfSmallStep;

  const daughterPeriod = 2 * l + s;

  const base: Map<number, 'parent' | 'flat' | 'sharp' | 'both'> = new Map();
  for (let i = 0; i < period; ++i) {
    base.set(mmod((i - d) * g, p), 'parent');
  }
  const accs = options.accidentals ?? 'sharp';
  if (accs === 'flat' || (accs === 'both' && sizeOfLargeStep > 2)) {
    for (let i = period - daughterPeriod; i < 0; ++i) {
      base.set(mmod((i - d) * g, p), 'flat');
    }
  }
  if (accs === 'sharp' || accs === 'both') {
    const acc = sizeOfLargeStep === 2 ? 'both' : 'sharp';
    for (let i = period; i < daughterPeriod; ++i) {
      base.set(mmod((i - d) * g, p), acc);
    }
  }
  const edoDegrees = [...base.keys()].sort((a, b) => a - b);
  let result: Map<number, 'parent' | 'flat' | 'sharp' | 'both'> = new Map();
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
 * Information about the modes of a MOS scale.
 * @param numberOfLargeSteps Number of large steps in the MOS pattern.
 * @param numberOfSmallSteps Number of small steps in the MOS pattern.
 * @param extraNames If true adds extra mode names in parenthesis such as Ionian (Major).
 * @returns An array of mode information.
 */
export function mosModes(
  numberOfLargeSteps: number,
  numberOfSmallSteps: number,
  extraNames = false
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
    const modeName_ = modeName(pattern, extraNames);
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
 * @param options Options for brightness of the scale and for adding extra names like Ionian (Major).
 * @returns An array of mode information.
 */
export function modeInfo(
  numberOfLargeSteps: number,
  numberOfSmallSteps: number,
  options?: ModeInfoOptions
): ModeInfo {
  options ??= {};
  const numberOfPeriods = gcd(numberOfLargeSteps, numberOfSmallSteps);
  const period = (numberOfLargeSteps + numberOfSmallSteps) / numberOfPeriods;
  const brightGeneratorsDown = getDown(options, period, numberOfPeriods);
  const scale = mos(numberOfLargeSteps, numberOfSmallSteps, options);
  scale.unshift(0);
  let pattern = '';
  for (let i = 1; i < scale.length; ++i) {
    if (scale[i] - scale[i - 1] === 2) {
      pattern += 'L';
    } else {
      pattern += 's';
    }
  }
  const modeName_ = modeName(pattern, options.extraNames);
  const brightGeneratorsUp =
    (period - 1) * numberOfPeriods - brightGeneratorsDown;

  let udp = `${brightGeneratorsUp}|${brightGeneratorsDown}`;
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
 * Split a string like "5L 2s" into [5, 2].
 * @param mosPattern MOS pattern such as "5L 2s".
 * @returns A pair of intergers representing the number of large and small steps.
 */
export function splitMosPattern(mosPattern: string): [number, number] {
  const [l, s] = mosPattern.split('L');
  const numberOfLargeSteps = parseInt(l.trim(), 10);
  const numberOfSmallSteps = parseInt(s.split('s')[0].trim(), 10);
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
  // Calculate the parent's size.
  const size = Math.max(numberOfLargeSteps, numberOfSmallSteps);
  numberOfLargeSteps = Math.min(numberOfLargeSteps, numberOfSmallSteps);
  numberOfSmallSteps = size - numberOfLargeSteps;

  const mosPattern = `${numberOfLargeSteps}L ${numberOfSmallSteps}s`;
  const info = {
    size,
    numberOfLargeSteps,
    numberOfSmallSteps,
    mosPattern,
  };
  Object.assign(info, tamnamsInfo(mosPattern));
  return info;
}

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

/**
 * Find all MOS scales supported by the given EDO within the given constraints.
 * @param edo Size of the EDO.
 * @param minSize Minimum size of a MOS scale in the result.
 * @param maxSize Maximum size of a MOS scale in the result.
 * @param maxHardness Maximum hardness of the step ratio L/s.
 * @returns Array of information about the supported MOS scales.
 */
export function allForEdo(
  edo: number,
  minSize = 2,
  maxSize?: number,
  maxHardness?: number
): MosScaleInfo[] {
  if (maxSize === undefined) {
    maxSize = edo;
  }
  if (minSize < 2) {
    throw new Error('Minimum size must be at least 2');
  }
  if (maxSize > edo) {
    throw new Error(`Maximum size must be smaller or equal to edo (${edo})`);
  }
  const result: MosScaleInfo[] = [];
  for (
    let numberOfLargeSteps = 1;
    numberOfLargeSteps < maxSize;
    ++numberOfLargeSteps
  ) {
    for (
      let numberOfSmallSteps = Math.max(1, minSize - numberOfLargeSteps);
      numberOfSmallSteps <= maxSize - numberOfLargeSteps;
      numberOfSmallSteps++
    ) {
      for (const hardness of fareyInterior(edo - numberOfSmallSteps)) {
        const {n: sizeOfSmallStep, d: sizeOfLargeStep} = hardness;
        if (maxHardness && sizeOfLargeStep > sizeOfSmallStep * maxHardness) {
          continue;
        }
        if (
          numberOfLargeSteps * sizeOfLargeStep +
            numberOfSmallSteps * sizeOfSmallStep ===
          edo
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
          result.push(info);
        }
      }
    }
  }
  return result;
}

/**
 * Find the ranges of all (equally tempered) fractions of the equave that span MOS scales.
 * @param size Size of the scales to consider.
 * @param includeMultiPeriods Include scales that split the equave into multiple periods.
 * @returns Information about the ranges of generator that span MOS. Ranges are grouped by period and otherwise sorted in ascending order.
 */
export function generatorRanges(size: number, includeMultiPeriods = false) {
  const result: RangeInfo[] = [];
  for (
    let numberOfLargeSteps = 1;
    numberOfLargeSteps < size;
    numberOfLargeSteps++
  ) {
    const numberOfSmallSteps = size - numberOfLargeSteps;

    const numPeriods = gcd(numberOfLargeSteps, numberOfSmallSteps);

    if (!includeMultiPeriods && numPeriods !== 1) {
      continue;
    }

    const period = new Fraction(1, numPeriods);

    const monzo = mosGeneratorMonzo(
      numberOfLargeSteps / numPeriods,
      numberOfSmallSteps / numPeriods
    );

    // Collapsed endpoint
    let lowerBound = new Fraction(monzo[0], numberOfLargeSteps);
    // Equalized endpoint
    let upperBound = new Fraction(monzo[0] + monzo[1], size);

    if (lowerBound.compare(upperBound) > 0) {
      [lowerBound, upperBound] = [upperBound, lowerBound];
    }

    result.push({
      period,
      lowerBound,
      upperBound,
      numberOfLargeSteps,
      numberOfSmallSteps,
      bright: true,
    });

    result.push({
      period,
      lowerBound: period.sub(upperBound),
      upperBound: period.sub(lowerBound),
      numberOfLargeSteps,
      numberOfSmallSteps,
      bright: false,
    });
  }
  result.sort(
    (a, b) => a.period.compare(b.period) || a.lowerBound.compare(b.lowerBound)
  );
  return result;
}
