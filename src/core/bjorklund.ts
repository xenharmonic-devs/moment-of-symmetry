/**
 * Implementation of Bjorklund's algorithm for generating even distributions
 */

/**
 * Generate an array of evenly distributed booleans using Bjorklund's algorithm
 * @param numberOfTrue Number of true elements
 * @param numberOfFalse Number of false elements
 * @param trueValue Value to use for true elements
 * @param falseValue Value to use for false elements
 * @returns Array of evenly distributed values
 */
export function bjorklund<T>(
  numberOfTrue: number,
  numberOfFalse: number,
  trueValue: T,
  falseValue: T
): T[] {
  if (numberOfTrue < 0 || numberOfFalse < 0) {
    throw new Error('Number of elements must be non-negative');
  }

  if (numberOfTrue === 0) {
    return Array(numberOfFalse).fill(falseValue);
  }
  if (numberOfFalse === 0) {
    return Array(numberOfTrue).fill(trueValue);
  }

  const groups: number[][] = [];
  const counts: number[] = [];
  let remaining = numberOfTrue + numberOfFalse;
  let groupSize = Math.ceil(remaining / numberOfTrue);

  while (remaining > 0) {
    const currentGroup = Math.min(groupSize, remaining);
    groups.push([currentGroup]);
    counts.push(1);
    remaining -= currentGroup;
  }

  while (true) {
    const newGroups: number[][] = [];
    const newCounts: number[] = [];
    let i = 0;

    while (i < groups.length) {
      if (i + 1 < groups.length && groups[i].length === groups[i + 1].length) {
        newGroups.push([...groups[i], ...groups[i + 1]]);
        newCounts.push(counts[i] + counts[i + 1]);
        i += 2;
      } else {
        newGroups.push(groups[i]);
        newCounts.push(counts[i]);
        i++;
      }
    }

    if (newGroups.length === groups.length) {
      break;
    }

    groups.length = 0;
    counts.length = 0;
    groups.push(...newGroups);
    counts.push(...newCounts);
  }

  const result: T[] = [];
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const count = counts[i];
    for (let j = 0; j < count; j++) {
      result.push(trueValue);
    }
    for (let j = count; j < group[0]; j++) {
      result.push(falseValue);
    }
  }

  return result;
}

/**
 * Generate a string of evenly distributed 'L' and 's' characters using Bjorklund's algorithm
 * @param numberOfLarge Number of large steps
 * @param numberOfSmall Number of small steps
 * @returns String of evenly distributed 'L' and 's' characters
 */
export function bjorklundStr(numberOfLarge: number, numberOfSmall: number): string {
  return bjorklund(numberOfLarge, numberOfSmall, 'L', 's').join('');
} 