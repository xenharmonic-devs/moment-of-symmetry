const HARDNESS_RATIOS: [string, number, number][] = [
  ['equalized', 1, 1],
  ['supersoft', 4, 3],
  ['soft', 3, 2],
  ['semisoft', 5, 3],
  ['basic', 2, 1],
  ['semihard', 5, 2],
  ['hard', 3, 1],
  ['superhard', 4, 1],
  ['paucitonic', 1, 0],
];

const HARDNESS_RANGES: [string, number, number][] = [
  ['ultrasoft', 6, 8],
  ['parasoft', 8, 9],
  ['quasisoft', 9, 10],
  ['minisoft', 10, 12],
  ['minihard', 12, 15],
  ['quasihard', 15, 18],
  ['parahard', 18, 24],
  ['ultrahard', 24, Infinity],
];

/**
 * Get the TAMNAMS name for a step ratio L:s.
 * @param sizeOfLargeStep Size of the large step.
 * @param sizeOfSmallStep Size of the small step.
 * @returns Name of the step ratio or the name of the hardness range it belongs to.
 */
export function getHardness(sizeOfLargeStep: number, sizeOfSmallStep: number) {
  let l = sizeOfLargeStep;
  let s = sizeOfSmallStep;
  let prefix = '';
  // Non-standard
  if (l < 0) {
    prefix = 'quasi-' + prefix;
    l = -l;
  }
  // Non-standard
  if (s < 0) {
    prefix = 'pseudo-' + prefix;
    s = -s;
  }
  // Standard
  if (s > l) {
    prefix = 'anti-' + prefix;
    [l, s] = [s, l];
  }
  for (let i = 0; i < HARDNESS_RATIOS.length; ++i) {
    const [name, large, small] = HARDNESS_RATIOS[i];
    if (l * small === large * s) {
      return prefix + name;
    }
  }
  for (let i = 0; i < HARDNESS_RANGES.length; ++i) {
    const [name, low, high] = HARDNESS_RANGES[i];
    if (low * s < 6 * l && 6 * l < high * s) {
      return prefix + name;
    }
  }
  throw new Error('Unable to determine hardness');
}
