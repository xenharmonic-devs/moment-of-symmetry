import Fraction from 'fraction.js';
import {getHardness} from './hardness';
import {tamnamsInfo} from './names';
import {arraysEqual, gcd, mmod, getSemiConvergents} from './utils';

export * from './utils';
export * from './hardness';
export * from './names';

/* Distribute subsequences as evenly as possible using Björklund's algorithm */
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

/* Produce an array of booleans that is mixed as evenly as possible */
export function euclid(numberOfTrue: number, numberOfFalse: number) {
  const subsequences = [];
  for (let i = 0; i < numberOfTrue; ++i) {
    subsequences.push([true]);
  }
  for (let i = 0; i < numberOfFalse; ++i) {
    subsequences.push([false]);
  }
  return bjorklund(subsequences).reduce((a, b) => a.concat(b), []);
}

const BRIGTH_GENERATORS: {[key: string]: number[]} = {
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

function mosGeneratorMonzo(l: number, s: number) {
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
  const current = [0, 0];
  const euclidScale = [current];
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

export function mos(
  numberOfLargeSteps: number,
  numberOfSmallSteps: number,
  sizeOfLargeStep = 2,
  sizeOfSmallStep = 1,
  brightGeneratorsUp = 0
) {
  const numPeriods = gcd(numberOfLargeSteps, numberOfSmallSteps);
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
  const convergents = getSemiConvergents(
    generatorPerPeriod,
    maxSize,
    maxLength
  );
  // Get rid of the first two
  convergents.shift();
  convergents.shift();
  return convergents;
}

export function mosSizes(
  generatorPerPeriod: number | Fraction,
  maxSize?: number,
  maxLength?: number
) {
  return mosForms(generatorPerPeriod, maxSize, maxLength).map(
    convergent => convergent.d
  );
}

export type EdoInfo = {
  pattern: string;
  numberOfLargeSteps: number;
  numberOfSmallSteps: number;
  sizeOfLargeStep: number;
  sizeOfSmallStep: number;
  hardness: string;
  name?: string;
  subset?: boolean;
  prefix?: string;
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
        const pattern = `${numberOfLargeSteps}L ${numberOfSmallSteps}s`;
        const edo =
          numberOfLargeSteps * sizeOfLargeStep +
          numberOfSmallSteps * sizeOfSmallStep;
        const info = {
          pattern,
          numberOfLargeSteps,
          numberOfSmallSteps,
          sizeOfLargeStep,
          sizeOfSmallStep,
          hardness,
        };
        Object.assign(info, tamnamsInfo(pattern));
        const infos = result.get(edo) || [];
        infos.push(info);
        result.set(edo, infos);
      }
    }
  });
  return result;
}
