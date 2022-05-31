export type TamnamsInfo = {
  name: string;
  subset: boolean;
  prefix?: string;
  abbreviation?: string;
};

const TAMNAMS_MOS_NAMES: {
  [key: string]: TamnamsInfo;
} = require('./tamnams.json');

const MODE_NAMES: {
  [key: string]: string;
} = require('./modes.json');

export function tamnamsInfo(pattern: string): TamnamsInfo | undefined {
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

export function modeName(pattern: string, extra = false): string | undefined {
  let name = MODE_NAMES[pattern];
  if (extra) {
    if (pattern === 'LLsLLLs') {
      name = name + ' (Major)';
    } else if (pattern === 'LsLLsLL') {
      name = name + ' (Minor)';
    }
  }
  return name;
}
