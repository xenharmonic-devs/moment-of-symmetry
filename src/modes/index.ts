import {MosPattern, ModeInfo} from '../types';
import {tamnamsInfo, modeName} from '../names';

/**
 * Get information about a mode
 * @param pattern The MOS pattern
 * @param options Optional configuration
 * @returns Information about the mode
 */
export function getModeInfo(
  pattern: MosPattern,
  options?: {extraNames?: boolean}
): ModeInfo {
  const info = tamnamsInfo(pattern.pattern) ?? {};
  const name =
    modeName(pattern.pattern, options?.extraNames) ?? pattern.pattern;

  return {
    pattern: pattern.pattern,
    name,
    ...info,
  };
}

/**
 * Get all modes for a given pattern
 * @param pattern The MOS pattern
 * @param options Optional configuration
 * @returns Array of mode information
 */
export function getAllModes(
  pattern: MosPattern,
  options?: {extraNames?: boolean}
): ModeInfo[] {
  const modes: ModeInfo[] = [];
  const patternStr = pattern.pattern;

  for (let i = 0; i < patternStr.length; i++) {
    const rotatedPattern = patternStr.slice(i) + patternStr.slice(0, i);
    const info = tamnamsInfo(rotatedPattern) ?? {};
    const name =
      modeName(rotatedPattern, options?.extraNames) ?? rotatedPattern;

    modes.push({
      pattern: rotatedPattern,
      name,
      ...info,
    });
  }

  return modes;
}

/**
 * Get the parent MOS pattern for a given pattern
 * @param pattern The MOS pattern to get the parent for
 * @returns The parent MOS pattern
 */
export function getParentPattern(pattern: MosPattern): MosPattern {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const periods = gcd(pattern.largeSteps, pattern.smallSteps);

  if (periods === 1) {
    throw new Error(
      'Pattern has no parent (it is already a single-period MOS)'
    );
  }

  const parentLargeSteps = pattern.largeSteps / periods;
  const parentSmallSteps = pattern.smallSteps / periods;

  return {
    pattern: 'L'.repeat(parentLargeSteps) + 's'.repeat(parentSmallSteps),
    largeSteps: parentLargeSteps,
    smallSteps: parentSmallSteps,
    periods: 1,
  };
}

/**
 * Get the daughter MOS pattern(s) for a given pattern
 * @param pattern The MOS pattern to get the daughter(s) for
 * @returns Array of daughter MOS patterns
 */
export function getDaughterPatterns(pattern: MosPattern): MosPattern[] {
  const daughters: MosPattern[] = [];

  // For each possible number of periods
  for (
    let periods = 2;
    periods <= Math.min(pattern.largeSteps, pattern.smallSteps);
    periods++
  ) {
    if (
      pattern.largeSteps % periods === 0 &&
      pattern.smallSteps % periods === 0
    ) {
      const daughterLargeSteps = pattern.largeSteps / periods;
      const daughterSmallSteps = pattern.smallSteps / periods;

      daughters.push({
        pattern:
          'L'.repeat(daughterLargeSteps) + 's'.repeat(daughterSmallSteps),
        largeSteps: daughterLargeSteps,
        smallSteps: daughterSmallSteps,
        periods: 1,
      });
    }
  }

  return daughters;
}
