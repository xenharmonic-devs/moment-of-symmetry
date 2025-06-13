/**
 * Base options for various MOS functions
 */
export interface BaseOptions {
  /** How many bright generators to go downwards. Also the number of small/minor intervals in the resulting scale. Default = 0. */
  down?: number;
  /** How many bright generators to go upwards. Also the number of large/major intervals in the resulting scale. Defaults to the maximum possible. */
  up?: number;
}

/**
 * Options for the modeInfo function
 */
export interface ModeInfoOptions extends BaseOptions {
  /** If true adds extra mode names in parenthesis such as Ionian (Major). */
  extraNames?: boolean;
}

/**
 * Options for the mos function
 */
export interface MosOptions extends BaseOptions {
  /** Size of the large step. Default = 2.*/
  sizeOfLargeStep?: number;
  /** Size of small step. Default = 1. */
  sizeOfSmallStep?: number;
}

/**
 * Options for the mosWithParent function
 */
export interface MosWithParentOptions extends MosOptions {
  /** How the main scale relates to the parent. Defaults to 'sharp'. */
  accidentals?: 'flat' | 'sharp';
}

/**
 * Options for the mosWithDaughter function
 */
export interface MosWithDaughterOptions extends MosOptions {
  /** How the daughter scale(s) relates to the main scale. Defaults to 'sharp'. */
  accidentals?: 'flat' | 'sharp' | 'both';
}

/**
 * Represents a MOS pattern with its properties
 */
export interface MosPattern {
  /** Number of large steps in the pattern */
  largeSteps: number;
  /** Number of small steps in the pattern */
  smallSteps: number;
  /** The pattern string (e.g. 'LLsLLLs') */
  pattern: string;
  /** The number of periods in the pattern */
  periods: number;
}

/**
 * Represents a MOS scale with its properties
 */
export interface MosScale extends MosPattern {
  /** The scale degrees in EDO steps */
  degrees: number[];
  /** Size of the large step */
  sizeOfLargeStep: number;
  /** Size of the small step */
  sizeOfSmallStep: number;
}

/**
 * Represents a MOS scale with parent relationship
 */
export interface MosScaleWithParent extends MosScale {
  /** Map of scale degrees to whether they belong to the parent scale */
  parentMap: Map<number, boolean>;
}

/**
 * Represents a MOS scale with daughter relationship
 */
export interface MosScaleWithDaughter extends MosScale {
  /** Map of scale degrees to their relationship with the parent scale */
  daughterMap: Map<number, 'parent' | 'sharp' | 'flat'>;
}

/**
 * Custom error types for MOS operations
 */
export class MosError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MosError';
  }
}

export class InvalidParametersError extends MosError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidParametersError';
  }
}

export class InvalidModeError extends MosError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidModeError';
  }
}

/**
 * Information about a MOS mode
 */
export interface ModeInfo {
  /** The pattern string (e.g. 'LLsLLLs') */
  pattern: string;
  /** The name of the mode */
  name: string;
  /** Optional TAMNAMS abbreviation */
  abbreviation?: string;
  /** Optional TAMNAMS prefix */
  prefix?: string;
  /** Optional TAMNAMS family prefix */
  familyPrefix?: string;
  /** Optional subset flag */
  subset?: boolean;
}
