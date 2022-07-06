/** TAMNAMS information about a MOS pattern. */
export type TamnamsInfo = {
  /** TAMNAMS name of the MOS pattern. */
  name: string;
  /** True if the pattern is a subset of a larger MOS pattern. */
  subset: boolean;
  /** Interval prefix. */
  prefix?: string;
  /** TAMNAMS name abbreviation. */
  abbreviation?: string;
};

const TAMNAMS_MOS_NAMES: {
  [key: string]: TamnamsInfo;
} = require('./tamnams.json');

const MODE_NAMES: {
  [key: string]: string;
} = require('./modes.json');

/**
 * Retreive TAMNAMS information about a MOS pattern.
 * @param {string} mosPattern MOS pattern such as "5L 2s".
 * @returns {TamnamsInfo} Information about the MOS pattern.
 */
export function tamnamsInfo(mosPattern: string): TamnamsInfo | undefined;
/**
 * Retreive TAMNAMS information about a MOS pattern.
 * @param numberOfLargeSteps Number of large steps in the MOS pattern.
 * @param numberOfSmallSteps Number of small steps in the MOS pattern.
 * @returns {TamnamsInfo} Information about the MOS pattern.
 */
export function tamnamsInfo(
  numberOfLargeSteps: number,
  numberOfSmallSteps: number
): TamnamsInfo | undefined;
export function tamnamsInfo(
  patternOrLarge: string | number,
  numberOfSmallSteps?: number
): TamnamsInfo | undefined {
  let pattern: string;
  if (typeof patternOrLarge === 'string') {
    pattern = patternOrLarge;
  } else {
    pattern = `${patternOrLarge}L ${numberOfSmallSteps}s`;
  }
  if (pattern in TAMNAMS_MOS_NAMES) {
    const result = TAMNAMS_MOS_NAMES[pattern];
    if (!('abbreviation' in result) && 'prefix' in result) {
      result.abbreviation = result.prefix;
    }
    result.subset = false;
    return result;
  }
  if (pattern.startsWith('1L')) {
    const countS = parseInt(pattern.slice(3, -1));
    const superMos = `${countS + 1}L 1s`;
    const result = Object.assign({}, tamnamsInfo(superMos));
    result.subset = true;
    return result;
  }
  return undefined;
}

/**
 * Retrieve the name for a MOS mode.
 * @param mode Mode in step pattern format such as "LLsLLLs".
 * @param extra If true adds extra mode names in parenthesis such as Ionian (Major).
 * @returns Name of the mode.
 */
export function modeName(mode: string, extra = false): string | undefined {
  let name = MODE_NAMES[mode];
  if (extra) {
    if (mode === 'LLsLLLs') {
      name = name + ' (Major)';
    } else if (mode === 'LsLLsLL') {
      name = name + ' (Minor)';
    }
  }
  return name;
}
