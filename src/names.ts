/** TAMNAMS information about a MOS pattern. */
export type TamnamsInfo = {
  /** TAMNAMS name of the MOS pattern. */
  name: string;
  /** Interval prefix. */
  prefix?: string;
  /** TAMNAMS name abbreviation. */
  abbreviation?: string;
  /** Family tree prefix. */
  familyPrefix?: string;
};

const TAMNAMS_MOS_NAMES: {
  [key: string]: TamnamsInfo;
} = require('./tamnams.json');

const MODE_NAMES: {
  [key: string]: string;
} = require('./modes.json');

function isPrefixed(countL: number, countS: number) {
  if (countL + countS <= 10) {
    return true;
  }
  if (countL === countS && countL <= 10) {
    return true;
  }

  if (countL < countS) {
    [countL, countS] = [countS, countL];
  }

  if (
    (countL === 7 && countS === 5) || // mellow / pychro
    (countL === 12 && countS === 5) || // pyen / supen
    (countL === 12 && countS === 7) || // flaen / meen
    (countL === 13 && countS === 1) || // tro / antro
    (countL === 15 && countS === 2) || // alisa / lisa
    (countL === 19 && countS === 3) // kai / zheli
  ) {
    return true;
  }

  return false;
}

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
  let numberOfLargeSteps;
  let pattern: string;
  if (typeof patternOrLarge === 'string') {
    pattern = patternOrLarge;
    numberOfLargeSteps = parseInt(pattern.split('L')[0]);
    numberOfSmallSteps = parseInt(pattern.split('L')[1].slice(1, -1));
  } else {
    pattern = `${patternOrLarge}L ${numberOfSmallSteps}s`;
    numberOfLargeSteps = patternOrLarge;
  }
  if (numberOfLargeSteps < 1 || numberOfSmallSteps! < 1) {
    return undefined;
  }
  if (pattern in TAMNAMS_MOS_NAMES) {
    const result = TAMNAMS_MOS_NAMES[pattern];
    if (!('abbreviation' in result) && 'prefix' in result) {
      result.abbreviation = result.prefix;
    }
    if (!('familyPrefix' in result) && 'prefix' in result) {
      result.familyPrefix = result.prefix;
    }
    return result;
  }

  if (numberOfLargeSteps === numberOfSmallSteps) {
    return {name: `${numberOfLargeSteps}-wood`};
  }

  const parentCountL = Math.min(numberOfLargeSteps, numberOfSmallSteps!);
  const parentCountS = Math.abs(numberOfLargeSteps - numberOfSmallSteps!);
  if (isPrefixed(parentCountL, parentCountS)) {
    const parentInfo = tamnamsInfo(parentCountL, parentCountS);
    if (parentInfo?.familyPrefix) {
      if (numberOfLargeSteps > numberOfSmallSteps!) {
        return {name: parentInfo.familyPrefix + 'mechromic'};
      } else {
        return {name: parentInfo.familyPrefix + 'pechromic'};
      }
    }
  }

  const grandparentCountL = Math.min(parentCountL, parentCountS);
  const grandparentCountS = Math.abs(parentCountL - parentCountS);
  if (isPrefixed(grandparentCountL, grandparentCountS)) {
    const grandparentInfo = tamnamsInfo(grandparentCountL, grandparentCountS);
    if (grandparentInfo?.familyPrefix) {
      const prefix = grandparentInfo.familyPrefix;
      if (parentCountL > parentCountS) {
        if (numberOfLargeSteps > numberOfSmallSteps!) {
          return {name: prefix + 'fenharmic'};
        } else {
          return {name: prefix + 'menharmic'};
        }
      } else {
        if (numberOfLargeSteps > numberOfSmallSteps!) {
          return {name: prefix + 'penharmic'};
        } else {
          return {name: prefix + 'senharmic'};
        }
      }
    }
  }

  const greatGrandparentCountL = Math.min(grandparentCountL, grandparentCountS);
  const greatGrandparentCountS = Math.abs(
    grandparentCountL - grandparentCountS
  );
  if (isPrefixed(greatGrandparentCountL, greatGrandparentCountS)) {
    const greatGrandparentInfo = tamnamsInfo(
      greatGrandparentCountL,
      greatGrandparentCountS
    );
    if (greatGrandparentInfo?.familyPrefix) {
      const name = greatGrandparentInfo.familyPrefix + 'tonic';
      if (grandparentCountL > grandparentCountS) {
        if (parentCountL > parentCountS) {
          if (numberOfLargeSteps > numberOfSmallSteps!) {
            return {name: 'quso-' + name};
          } else {
            return {name: 'miso-' + name};
          }
        } else {
          if (numberOfLargeSteps > numberOfSmallSteps!) {
            return {name: 'paso-' + name};
          } else {
            return {name: 'uso-' + name};
          }
        }
      } else {
        if (parentCountL > parentCountS) {
          if (numberOfLargeSteps > numberOfSmallSteps!) {
            return {name: 'quha-' + name};
          } else {
            return {name: 'miha-' + name};
          }
        } else {
          if (numberOfLargeSteps > numberOfSmallSteps!) {
            return {name: 'paha-' + name};
          } else {
            return {name: 'uha-' + name};
          }
        }
      }
    }
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
