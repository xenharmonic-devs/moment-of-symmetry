import {MosScale, MosScaleWithParent, MosScaleWithDaughter} from '../types';
import {createMosScale} from '../core/pattern';

/**
 * Generate a MOS scale in a specific EDO
 */
export function mosInEdo(
  edo: number,
  largeSteps: number,
  smallSteps: number,
  options?: {
    sizeOfLargeStep?: number;
    sizeOfSmallStep?: number;
    down?: number;
    up?: number;
  }
): MosScale {
  if (edo <= 0) {
    throw new Error('EDO must be positive');
  }
  if (largeSteps < 0 || smallSteps < 0) {
    throw new Error('Number of steps must be non-negative');
  }

  const sizeOfLargeStep =
    options?.sizeOfLargeStep ?? Math.floor(edo / (largeSteps + smallSteps));
  const sizeOfSmallStep =
    options?.sizeOfSmallStep ?? Math.floor(edo / (largeSteps + smallSteps));

  return createMosScale(largeSteps, smallSteps, {
    ...options,
    sizeOfLargeStep,
    sizeOfSmallStep,
  });
}

/**
 * Generate a MOS scale in a specific EDO with parent relationship
 */
export function mosInEdoWithParent(
  edo: number,
  largeSteps: number,
  smallSteps: number,
  options?: {
    sizeOfLargeStep?: number;
    sizeOfSmallStep?: number;
    down?: number;
    up?: number;
    accidentals?: 'flat' | 'sharp';
  }
): MosScaleWithParent {
  const scale = mosInEdo(edo, largeSteps, smallSteps, options);
  const parentMap = new Map<number, boolean>();

  // TODO: Implement parent relationship logic
  // This is a placeholder implementation
  for (const degree of scale.degrees) {
    parentMap.set(degree, true);
  }

  return {
    ...scale,
    parentMap,
  };
}

/**
 * Generate a MOS scale in a specific EDO with daughter relationship
 */
export function mosInEdoWithDaughter(
  edo: number,
  largeSteps: number,
  smallSteps: number,
  options?: {
    sizeOfLargeStep?: number;
    sizeOfSmallStep?: number;
    down?: number;
    up?: number;
    accidentals?: 'flat' | 'sharp' | 'both';
  }
): MosScaleWithDaughter {
  const scale = mosInEdo(edo, largeSteps, smallSteps, options);
  const daughterMap = new Map<number, 'parent' | 'sharp' | 'flat'>();

  // TODO: Implement daughter relationship logic
  // This is a placeholder implementation
  for (const degree of scale.degrees) {
    daughterMap.set(degree, 'parent');
  }

  return {
    ...scale,
    daughterMap,
  };
}

/**
 * Find all valid MOS scales in a specific EDO
 */
export function findAllMosInEdo(
  edo: number,
  minSize = 2,
  maxSize?: number,
  maxHardness?: number
): MosScale[] {
  if (edo <= 0) {
    throw new Error('EDO must be positive');
  }
  if (minSize < 2) {
    throw new Error('Minimum size must be at least 2');
  }

  const result: MosScale[] = [];
  maxSize = maxSize ?? edo;

  for (let largeSteps = 1; largeSteps <= maxSize; largeSteps++) {
    for (let smallSteps = 1; smallSteps <= maxSize - largeSteps; smallSteps++) {
      if (largeSteps + smallSteps < minSize) {
        continue;
      }

      try {
        const scale = mosInEdo(edo, largeSteps, smallSteps);
        if (
          !maxHardness ||
          scale.sizeOfLargeStep / scale.sizeOfSmallStep <= maxHardness
        ) {
          result.push(scale);
        }
      } catch (error) {
        // Skip invalid scales
        continue;
      }
    }
  }

  return result;
}
