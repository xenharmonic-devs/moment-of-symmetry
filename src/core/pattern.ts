import {gcd} from 'xen-dev-utils';
import {bjorklundStr} from './bjorklund';
import {
  BaseOptions,
  MosPattern,
  MosScale,
  InvalidParametersError,
} from '../types';

/**
 * Calculate the number of periods in a MOS pattern
 */
export function calculatePeriods(
  largeSteps: number,
  smallSteps: number
): number {
  return gcd(largeSteps, smallSteps);
}

/**
 * Calculate the period size of a MOS pattern
 */
export function calculatePeriodSize(
  largeSteps: number,
  smallSteps: number
): number {
  const periods = calculatePeriods(largeSteps, smallSteps);
  return (largeSteps + smallSteps) / periods;
}

/**
 * Get the number of bright generators to go down based on options
 */
export function getDown(
  options: BaseOptions,
  period: number,
  numPeriods: number
): number {
  let down = 0;
  if (options.up !== undefined) {
    down = period * numPeriods - numPeriods - options.up;
    if (options.down !== undefined && down !== options.down) {
      throw new InvalidParametersError(
        'Incompatible up and down with the scale size'
      );
    }
  } else if (options.down !== undefined) {
    down = options.down;
  }

  if (down < 0) {
    throw new InvalidParametersError('Down must not be negative');
  }
  if (down >= period * numPeriods) {
    throw new InvalidParametersError('Up must not be negative');
  }
  if (down % numPeriods !== 0) {
    throw new InvalidParametersError(
      'Up/down must be divisible by the number of periods'
    );
  }

  return down;
}

/**
 * Generate a MOS pattern string
 */
export function generatePattern(
  largeSteps: number,
  smallSteps: number,
  options?: BaseOptions
): string {
  if (!largeSteps) {
    return 's'.repeat(smallSteps);
  }
  if (!smallSteps) {
    return 'L'.repeat(largeSteps);
  }

  const brightest = bjorklundStr(largeSteps, smallSteps);
  const modes: string[] = [];
  let mode = brightest;

  while (true) {
    modes.push(mode);
    mode = mode.slice(1) + mode[0];
    if (mode === brightest) {
      break;
    }
  }

  // Lexicographic order corresponds to brightness
  modes.sort();

  const numPeriods = calculatePeriods(largeSteps, smallSteps);
  const period = calculatePeriodSize(largeSteps, smallSteps);
  const brightGeneratorsDown = getDown(options ?? {}, period, numPeriods);

  return modes[brightGeneratorsDown / numPeriods];
}

/**
 * Generate a MOS scale from a pattern
 */
export function generateScale(
  pattern: string,
  sizeOfLargeStep: number,
  sizeOfSmallStep: number
): number[] {
  let step = 0;
  const result: number[] = [];

  for (const character of pattern) {
    if (character === 'L') {
      step += sizeOfLargeStep;
    } else {
      step += sizeOfSmallStep;
    }
    result.push(step);
  }

  return result;
}

/**
 * Create a complete MOS pattern object
 */
export function createMosPattern(
  largeSteps: number,
  smallSteps: number,
  options?: BaseOptions
): MosPattern {
  const periods = calculatePeriods(largeSteps, smallSteps);
  const pattern = generatePattern(largeSteps, smallSteps, options);

  return {
    largeSteps,
    smallSteps,
    pattern,
    periods,
  };
}

/**
 * Create a complete MOS scale object
 */
export function createMosScale(
  largeSteps: number,
  smallSteps: number,
  options?: BaseOptions & {
    sizeOfLargeStep?: number;
    sizeOfSmallStep?: number;
  }
): MosScale {
  const mosPattern = createMosPattern(largeSteps, smallSteps, options);
  const sizeOfLargeStep = options?.sizeOfLargeStep ?? 2;
  const sizeOfSmallStep = options?.sizeOfSmallStep ?? 1;

  return {
    ...mosPattern,
    degrees: generateScale(
      mosPattern.pattern,
      sizeOfLargeStep,
      sizeOfSmallStep
    ),
    sizeOfLargeStep,
    sizeOfSmallStep,
  };
}
