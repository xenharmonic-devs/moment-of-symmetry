import Fraction from 'fraction.js';
import {getHardness} from './hardness';
import {tamnamsInfo, modeName} from './names';
import {arraysEqual, gcd, mmod, getSemiconvergents} from './utils';

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
  numberOfPeriods: number,
  maxSize?: number,
  maxLength?: number
) {
  if (maxLength !== undefined) {
    maxLength += 1;
  }
  const forms = mosForms(generatorPerPeriod, undefined, maxLength);
  const result: MosInfo[] = [];
  let size: number | undefined;
  forms.forEach(form => {
    if (size !== undefined) {
      if (size > maxSize!) {
        return;
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
      const pattern = `${numberOfLargeSteps}L ${numberOfSmallSteps}s`;
      const info = {
        numberOfLargeSteps,
        numberOfSmallSteps,
        mosPattern: pattern,
      };
      Object.assign(info, tamnamsInfo(pattern));
      result.push(info);
    }
    size = form.d;
  });

  return result;
}

/** Information about a MOS scale as a subset of an EDO */
export type EdoInfo = {
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
  /** TAMNAMS name of the MOS pattern. */
  name?: string;
  /** True if the pattern is a subset of a larger MOS pattern. */
  subset?: boolean;
  /** Interval prefix. */
  prefix?: string;
  /** TAMNAMS name abbreviation. */
  abbreviation?: string;
};

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
export function makeEdoMap(maxSize = 12): Map<number, EdoInfo[]> {
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
export function anyForEdo(edo: number): EdoInfo {
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
