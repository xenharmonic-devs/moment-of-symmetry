const HARDNESS_RATIOS: [string, number, number][] = [
  ['equalized', 1, 1],
  ['supersoft', 4, 3],
  ['soft', 3, 2],
  ['semisoft', 5, 3],
  ['basic', 2, 1],
  ['semihard', 5, 2],
  ['hard', 3, 1],
  ['superhard', 4, 1],
  ['collapsed', 1, 0],
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
  // Non-standard
  if (!sizeOfLargeStep && !sizeOfSmallStep) {
    return 'stationary';
  }
  const sign = sizeOfLargeStep * sizeOfSmallStep;
  let l = Math.abs(sizeOfLargeStep);
  let s = Math.abs(sizeOfSmallStep);
  let prefix = '';
  // Standard
  if (s > l) {
    prefix = 'anti-' + prefix;
    [l, s] = [s, l];
  }
  // Non-standard
  if (sign < 0) {
    prefix = 'trans-' + prefix;
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
