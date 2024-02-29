import {Fraction} from 'xen-dev-utils';

/** Information about a MOS pattern. */
export type MosInfo = {
  /** MOS pattern such as "5L 2s". */
  mosPattern: string;
  /** Number of large steps in the pattern. */
  numberOfLargeSteps: number;
  /** Number of small steps in the pattern. */
  numberOfSmallSteps: number;
  /** Size of the pattern. */
  size: number;
  /** TAMNAMS name of the pattern. */
  name?: string;
  /** True if the pattern is a subset of a larger MOS pattern. */
  subset?: boolean;
  /** Interval prefix. */
  prefix?: string;
  /** TAMNAMS name abbreviation. */
  abbreviation?: string;
};

/** Information about a MOS mode. */
export type ModeInfo = {
  /** Number of steps in a period. */
  period: number;
  /** Number of periods in an octave. */
  numberOfPeriods: number;
  /** UDP notation: U|D(P) where U = bright generators going up, D = bright generators going down, P = numberOfPeriods if not 1. */
  udp: string;
  /** Mode in step pattern format such as "LLsLLLs". */
  mode: string;
  /** Name of the mode. */
  modeName?: string;
};

/** Information about a MOS scale. */
export type MosScaleInfo = {
  /** MOS pattern such as "5L 2s". */
  mosPattern: string;
  /** Number of large steps in the pattern. */
  numberOfLargeSteps: number;
  /** Number of small steps in the pattern. */
  numberOfSmallSteps: number;
  /** Size of the large step in EDO steps. */
  sizeOfLargeStep: number;
  /** Size of the small step in EDO steps. */
  sizeOfSmallStep: number;
  /** Name of the step size ratio or the name of the hardness range it belongs to. */
  hardness: string;
  /** TAMNAMS name of the pattern. */
  name?: string;
  /** True if the pattern is a subset of a larger MOS pattern. */
  subset?: boolean;
  /** Interval prefix. */
  prefix?: string;
  /** TAMNAMS name abbreviation. */
  abbreviation?: string;
};

/** Information about a scale. */
export type ScaleInfo = {
  /** Steps of the scale L = large, M = medium, s = small */
  stepPattern: string;
  /** MOS pattern such as "5L 2s". */
  mosPattern?: string;
  /** TAMNAMS name of the pattern. */
  name?: string;
  /** True if the pattern is a subset of a larger MOS pattern. */
  subset?: boolean;
  /** Interval prefix. */
  prefix?: string;
  /** TAMNAMS name abbreviation. */
  abbreviation?: string;
  /** Name of the mode. */
  modeName?: string;
};

/** Information about a generator range. */
export type RangeInfo = {
  /** Size of the period as a fraction of the equave. */
  period: Fraction;
  /** Lower bound of the generator range as a fraction of the equave. */
  lowerBound: Fraction;
  /** Upper bound of the generator range as a fraction of the equave. */
  upperBound: Fraction;
  /** Number of large steps in the pattern. */
  numberOfLargeSteps: number;
  /** Number of small steps in the pattern. */
  numberOfSmallSteps: number;
  /** Indicate if the generators are bright inside this range. */
  bright: boolean;
};
