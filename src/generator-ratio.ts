import {Fraction, FractionSet, getSemiconvergents, mmod} from 'xen-dev-utils';
import {MosInfo, ScaleInfo} from './info';
import {modeName, tamnamsInfo} from './names';

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
    maxLength,
    true
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
): number;
export function toBrightGeneratorPerPeriod(
  generatorPerPeriod: Fraction,
  size: number
): Fraction;
export function toBrightGeneratorPerPeriod(
  generatorPerPeriod: number | Fraction,
  size: number
): number | Fraction {
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
      if (typeof generatorPerPeriod === 'number') {
        return mmod(generatorPerPeriod, 1);
      } else {
        return generator;
      }
    }
    if (cmp < 0) {
      if (typeof generatorPerPeriod === 'number') {
        return mmod(-generatorPerPeriod, 1);
      } else {
        return negativeGenerator;
      }
    }
  }

  // Ambiguous generator
  if (typeof generatorPerPeriod === 'number') {
    return mmod(generatorPerPeriod, 1);
  } else {
    return generator;
  }
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
      if (size * numberOfPeriods > maxSize!) {
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
      size *= numberOfPeriods;
      numberOfLargeSteps *= numberOfPeriods;
      numberOfSmallSteps *= numberOfPeriods;
      const mosPattern = `${numberOfLargeSteps}L ${numberOfSmallSteps}s`;
      const info = {
        size,
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
