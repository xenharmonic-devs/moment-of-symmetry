import {describe, it, expect} from 'vitest';
import {
  mosScaleInfo,
  daughterMos,
  makeEdoMap,
  anyForEdo,
  allForEdo,
  generatorRanges,
} from '../index';

describe('MOS Scale Info', () => {
  it('provides correct scale info for 5L 2s', () => {
    const info = mosScaleInfo(5, 2);
    expect(info).toEqual({
      mosPattern: '5L 2s',
      numberOfLargeSteps: 5,
      numberOfSmallSteps: 2,
      sizeOfLargeStep: 2,
      sizeOfSmallStep: 1,
      period: 12,
      numberOfPeriods: 1,
      hardness: 'basic',
      edo: 12,
      brightGenerator: 7,
      darkGenerator: 5,
      periodMonzo: [5, 2],
      brightGeneratorMonzo: [3, 1],
      name: 'diatonic',
      familyPrefix: 'dia',
      prefix: 'dia',
      abbreviation: 'dia',
    });
  });

  it('handles multi-period scales', () => {
    const info = mosScaleInfo(4, 2, 3);
    expect(info).toEqual({
      mosPattern: '4L 2s',
      numberOfLargeSteps: 4,
      numberOfSmallSteps: 2,
      sizeOfLargeStep: 3,
      sizeOfSmallStep: 1,
      period: 7,
      numberOfPeriods: 2,
      hardness: 'hard',
      edo: 14,
      brightGenerator: 3,
      darkGenerator: 4,
      periodMonzo: [2, 1],
      brightGeneratorMonzo: [1, 0],
      name: 'citric',
      familyPrefix: 'citro',
      prefix: 'citro',
      abbreviation: 'cit',
    });
  });

  it('handles negative hardness', () => {
    const info = mosScaleInfo(5, 2, 2, -1);
    expect(info.hardness).toBe('trans-basic');
  });
});

describe('Daughter MOS', () => {
  it('finds daughter MOS for 5L 2s', () => {
    const daughter = daughterMos(5, 2, 2, 1);
    expect(daughter).toEqual({
      mosPattern: '5L 7s',
      numberOfLargeSteps: 5,
      numberOfSmallSteps: 7,
      sizeOfLargeStep: 1,
      sizeOfSmallStep: 1,
      period: 12,
      numberOfPeriods: 1,
      hardness: 'equalized',
      edo: 12,
      brightGenerator: 7,
      darkGenerator: 5,
      periodMonzo: [5, 7],
      brightGeneratorMonzo: [3, 4],
      name: 'p-chromatic',
      familyPrefix: 'pychro',
      prefix: 'pychro',
      abbreviation: 'pychro',
    });
  });

  it('handles multi-period daughter MOS', () => {
    const daughter = daughterMos(4, 2, 3, 1);
    expect(daughter).toEqual({
      mosPattern: '4L 6s',
      numberOfLargeSteps: 4,
      numberOfSmallSteps: 6,
      sizeOfLargeStep: 2,
      sizeOfSmallStep: 1,
      period: 7,
      numberOfPeriods: 2,
      hardness: 'basic',
      edo: 14,
      brightGenerator: 3,
      darkGenerator: 4,
      periodMonzo: [2, 3],
      brightGeneratorMonzo: [1, 1],
      name: 'lime',
      familyPrefix: 'lime',
      prefix: 'lime',
      abbreviation: 'lime',
    });
  });
});

describe('EDO Map Generation', () => {
  it('generates EDO map up to size 12', () => {
    const map = makeEdoMap(12);
    expect(map.size).toBe(88);
    expect(map.get(12)?.length).toBeGreaterThan(0);
  });

  it('includes common scales in 12EDO', () => {
    const map = makeEdoMap(12);
    const scales12 = map.get(12) || [];
    const diatonic = scales12.find(
      s => s.numberOfLargeSteps === 5 && s.numberOfSmallSteps === 2
    );
    expect(diatonic).toBeDefined();
    expect(diatonic?.mosPattern).toBe('5L 2s');
  });
});

describe('EDO Scale Generation', () => {
  it('finds a valid scale for 12EDO', () => {
    const scale = anyForEdo(12);
    expect(scale.edo).toBe(12);
    expect(scale.period).toBeLessThanOrEqual(12);
  });

  it('finds all valid scales for 12EDO', () => {
    const scales = allForEdo(12);
    expect(scales.length).toBeGreaterThan(0);
    expect(scales.every(s => s.edo === 12)).toBe(true);
  });

  it('respects size constraints in allForEdo', () => {
    const scales = allForEdo(12, 5, 7);
    expect(
      scales.every(
        s =>
          s.numberOfLargeSteps + s.numberOfSmallSteps >= 5 &&
          s.numberOfLargeSteps + s.numberOfSmallSteps <= 7
      )
    ).toBe(true);
  });

  it('respects hardness constraints in allForEdo', () => {
    const scales = allForEdo(12, 2, 12, 2);
    const allowedHardness = [
      'equalized',
      'supersoft',
      'soft',
      'semisoft',
      'basic',
      'semihard',
      'hard',
      'parasoft',
    ];
    const invalidScales = scales.filter(
      s => !allowedHardness.includes(s.hardness)
    );
    if (invalidScales.length > 0) {
      console.log(
        'Invalid scales:',
        invalidScales.map(s => ({
          pattern: s.mosPattern,
          hardness: s.hardness,
          largeStep: s.sizeOfLargeStep,
          smallStep: s.sizeOfSmallStep,
        }))
      );
    }
    expect(invalidScales.length).toBe(0);
  });
});

describe('Generator Ranges', () => {
  it('generates valid ranges for size 7', () => {
    const ranges = generatorRanges(7);
    const has52 = ranges.some(
      r => r.numberOfLargeSteps === 5 && r.numberOfSmallSteps === 2
    );
    const has43 = ranges.some(
      r => r.numberOfLargeSteps === 4 && r.numberOfSmallSteps === 3
    );
    expect(has52).toBe(true);
    expect(has43).toBe(true);
  });

  it('includes multi-period scales when requested', () => {
    const ranges = generatorRanges(6, true);
    const has42 = ranges.some(
      r => r.numberOfLargeSteps === 4 && r.numberOfSmallSteps === 2
    );
    expect(has42).toBe(true);
  });

  it('excludes multi-period scales by default', () => {
    const ranges = generatorRanges(6);
    const has42 = ranges.some(
      r => r.numberOfLargeSteps === 4 && r.numberOfSmallSteps === 2
    );
    expect(has42).toBe(false);
  });
});
