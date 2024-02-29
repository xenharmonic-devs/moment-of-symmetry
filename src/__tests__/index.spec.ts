import {describe, it, expect, test} from 'vitest';
import {arraysEqual} from 'xen-dev-utils';
import {
  mos,
  euclid,
  makeEdoMap,
  anyForEdo,
  modeInfo,
  mosModes,
  parentMos,
  daughterMos,
  mosWithParent,
  mosWithDaughter,
  allForEdo,
  brightGeneratorMonzo,
  generatorRanges,
} from '../index';

describe('Bright generator calculator', () => {
  it('gives the perfect fifth for 5L 2s', () => {
    const [numLarge, numSmall] = brightGeneratorMonzo(5, 2);
    expect(numLarge).toBe(3);
    expect(numSmall).toBe(1);
    expect(2 * numLarge + 1 * numSmall).toBe(7);
  });
});

describe('Moment of Symmetry step generator', () => {
  it('produces a pentatonic scale for 2L 3s', () => {
    expect(mos(2, 3)).toEqual([2, 3, 5, 6, 7]);
  });
  it('supports UDP modes with 2L 4s', () => {
    // Observe how the numbers in the array keep getting bigger and "brighter"
    expect(mos(2, 4, {up: 0})).toEqual([1, 2, 4, 5, 6, 8]);
    expect(mos(2, 4, {up: 2})).toEqual([1, 3, 4, 5, 7, 8]);
    expect(mos(2, 4, {up: 4})).toEqual([2, 3, 4, 6, 7, 8]);
  });
  it('throws for UDP mode 6|-2 with 2L 4s', () => {
    expect(() => mos(2, 4, {up: 6})).toThrow();
  });
  it('produces the lydian scale for 5L 2s', () => {
    expect(mos(5, 2)).toEqual([2, 4, 6, 7, 9, 11, 12]);
  });
  it('produces the sothic mode for semihard smitonic scale in 26edo', () => {
    expect(
      arraysEqual(
        mos(4, 3, {sizeOfLargeStep: 5, sizeOfSmallStep: 2}),
        [5, 7, 12, 14, 19, 21, 26]
      )
    );
  });
});

describe('Moment of Symmetry step generator with parent MOS', () => {
  it('produces the major scale as the parent of 12EDO 7L 5s (sharps)', () => {
    const map = mosWithParent(7, 5, {
      sizeOfLargeStep: 1,
      sizeOfSmallStep: 1,
      down: 5,
    });
    expect(map.size).toBe(12);
    const colors = [...map.keys()].map(step =>
      map.get(step) ? 'white' : 'black'
    );
    colors.unshift(colors.pop()!);
    expect(colors).toEqual([
      'white',
      'black',
      'white',
      'black',
      'white',
      'white',
      'black',
      'white',
      'black',
      'white',
      'black',
      'white',
    ]);
  });
  it('produces the major scale as the parent of 29EDO 5L 7s (flats)', () => {
    const map = mosWithParent(5, 7, {
      sizeOfLargeStep: 3,
      sizeOfSmallStep: 2,
      down: 6,
      accidentals: 'flat',
    });
    expect(map.size).toBe(12);
    const colors = [...map.keys()].map(step =>
      map.get(step) ? 'white' : 'black'
    );
    colors.unshift(colors.pop()!);
    expect(colors).toEqual([
      'white',
      'black',
      'white',
      'black',
      'white',
      'white',
      'black',
      'white',
      'black',
      'white',
      'black',
      'white',
    ]);
  });
  it('works with multiple periods per equave', () => {
    const map = mosWithParent(4, 2, {sizeOfLargeStep: 3});
    expect(map).toEqual(
      new Map([
        [3, true],
        [6, false],
        [7, true],
        [10, true],
        [13, false],
        [14, true],
      ])
    );
  });
});

describe('Moment of Symmetry step generator with daughter MOS', () => {
  it('produces the chromatic scale as the daughter of 12EDO major scale (sharps)', () => {
    const map = mosWithDaughter(5, 2, {down: 1});
    expect(map.size).toBe(12);
    const colors = [...map.keys()].map(step =>
      map.get(step) === 'parent' ? 'white' : 'black'
    );
    colors.unshift(colors.pop()!);
    expect(colors).toEqual([
      'white',
      'black',
      'white',
      'black',
      'white',
      'white',
      'black',
      'white',
      'black',
      'white',
      'black',
      'white',
    ]);
  });

  it('produces the m-chromatic scale as the daughter of 31EDO major scale (flats)', () => {
    const map = mosWithDaughter(5, 2, {
      sizeOfLargeStep: 5,
      sizeOfSmallStep: 3,
      down: 1,
      accidentals: 'flat',
    });
    expect(map.size).toBe(12);
    const colors = [...map.keys()].map(step =>
      map.get(step) === 'parent' ? 'white' : 'black'
    );
    colors.unshift(colors.pop()!);
    expect(colors).toEqual([
      'white',
      'black',
      'white',
      'black',
      'white',
      'white',
      'black',
      'white',
      'black',
      'white',
      'black',
      'white',
    ]);
  });

  it('produces the pentatonic scale as the non-parent for 17EDO major scale with both flats and sharps', () => {
    const sharps = mosWithDaughter(5, 2, {sizeOfLargeStep: 3, down: 1});
    const flats = mosWithDaughter(5, 2, {
      sizeOfLargeStep: 3,
      down: 1,
      accidentals: 'flat',
    });

    const diatonicSharps = [...sharps.keys()].filter(
      key => sharps.get(key) === 'parent'
    );
    const diatonicFlats = [...flats.keys()].filter(
      key => flats.get(key) === 'parent'
    );
    const diatonic = [3, 6, 7, 10, 13, 16, 17];
    expect(arraysEqual(diatonicSharps, diatonic)).toBeTruthy();
    expect(arraysEqual(diatonicFlats, diatonic)).toBeTruthy();

    const pentatonicSharps = [...sharps.keys()].filter(
      key => sharps.get(key) === 'sharp'
    );
    const pentatonicFlats = [...flats.keys()].filter(
      key => flats.get(key) === 'flat'
    );
    const pentatonic = [0, 3, 7, 10, 13];
    expect(
      arraysEqual(
        pentatonicSharps.map(key => key - pentatonicSharps[0]),
        pentatonic
      )
    ).toBeTruthy();
    expect(
      arraysEqual(
        pentatonicFlats.map(key => key - pentatonicFlats[0]),
        pentatonic
      )
    ).toBeTruthy();
  });
});

const MOS_PATTERNS = {
  '1L 4s': 'ssLss',
  '2L 3s': 'sLsLs',
  '3L 2s': 'LsLsL',
  '4L 1s': 'LLsLL',
  '1L 5s': 'Lsssss',
  '2L 4s': 'sLssLs',
  '3L 3s': 'LsLsLs',
  '4L 2s': 'LsLLsL',
  '5L 1s': 'LLLLLs',
  '1L 6s': 'sssLsss',
  '2L 5s': 'sLsssLs',
  '3L 4s': 'sLsLsLs',
  '4L 3s': 'LsLsLsL',
  '5L 2s': 'LLsLLLs',
  '6L 1s': 'LLLsLLL',
  '1L 7s': 'Lsssssss',
  '2L 6s': 'LsssLsss',
  '3L 5s': 'sLssLsLs',
  '4L 4s': 'LsLsLsLs',
  '5L 3s': 'LsLLsLsL',
  '6L 2s': 'LLLsLLLs',
  '7L 1s': 'LLLLLLLs',
  '1L 8s': 'ssssLssss',
  '2L 7s': 'ssLsssLss',
  '3L 6s': 'sLssLssLs',
  '4L 5s': 'LsLsLsLss',
  '5L 4s': 'LsLsLsLsL',
  '6L 3s': 'LsLLsLLsL',
  '7L 2s': 'LLsLLLsLL',
  '8L 1s': 'LLLLsLLLL',
  '1L 9s': 'Lsssssssss',
  '2L 8s': 'ssLssssLss',
  '3L 7s': 'LssLssLsss',
  '4L 6s': 'sLsLssLsLs',
  '5L 5s': 'LsLsLsLsLs',
  '6L 4s': 'LsLsLLsLsL',
  '7L 3s': 'LLLsLLsLLs',
  '8L 2s': 'LLsLLLLsLL',
  '9L 1s': 'LLLLLLLLLs',
  '1L 10s': 'sssssLsssss',
  '2L 9s': 'ssLsssssLss',
  '3L 8s': 'sLsssLsssLs',
  '4L 7s': 'LssLsLssLss',
  '5L 6s': 'sLsLsLsLsLs',
  '6L 5s': 'LsLsLsLsLsL',
  '7L 4s': 'LsLLsLsLLsL',
  '8L 3s': 'LsLLLsLLLsL',
  '9L 2s': 'LLsLLLLLsLL',
  '10L 1s': 'LLLLLsLLLLL',
  '1L 11s': 'Lsssssssssss',
  '2L 10s': 'LsssssLsssss',
  '3L 9s': 'LsssLsssLsss',
  '4L 8s': 'sLssLssLssLs',
  '5L 7s': 'LsLsLssLsLss',
  '6L 6s': 'LsLsLsLsLsLs',
  '7L 5s': 'LLsLsLLsLsLs',
  '8L 4s': 'LsLLsLLsLLsL',
  '9L 3s': 'LLLsLLLsLLLs',
  '10L 2s': 'LLLLLsLLLLLs',
  '11L 1s': 'LLLLLLLLLLLs',
};

describe('Euclidean pattern generator', () => {
  test.each(Object.entries(MOS_PATTERNS))(
    'Matches with MOS %s',
    (key, acceptedPattern) => {
      const l = parseInt(key.split('L')[0]);
      const s = parseInt(key.split(' ')[1].slice(0, -1));
      let pattern = euclid(l, s)
        .map(i => (i ? 'L' : 's'))
        .join('');
      let passed = false;
      for (let i = 0; i < pattern.length; ++i) {
        if (pattern === acceptedPattern) {
          passed = true;
          break;
        }
        pattern = pattern.slice(-1) + pattern.slice(0, -1);
      }
      expect(passed).toBeTruthy();
    }
  );
});

describe('EDO mapper', () => {
  it('Produces a comprehensive list of supported MOS patterns for 31EDO', () => {
    const map = makeEdoMap();
    const supportedMosses: string[] = [];
    map.get(31)!.forEach(info => {
      if (info.name) {
        supportedMosses.push(info.name);
      }
    });
    supportedMosses.sort();
    expect(supportedMosses.join(', ')).toBe(
      'antidiatonic, antipentic, antisinatonic, antisubneutralic, archeotonic, balzano, checkertonic, diatonic, dicoid, gramitonic, m-chro antisinatonic, m-chro balzano, m-chromatic, manual, mosh, oneirotonic, onyx, p-chro checkertonic, p-chro machinoid, pentic, pine'
    );
  });
});

describe('MOS finder for EDO', () => {
  it('Can find something reasonable for every EDO under 1000', () => {
    for (let edo = 2; edo < 1000; ++edo) {
      const info = anyForEdo(edo);
      expect(info.sizeOfLargeStep).toBeLessThanOrEqual(
        3 * info.sizeOfSmallStep
      );
      expect(2 * info.sizeOfSmallStep).toBeLessThanOrEqual(
        3 * info.sizeOfSmallStep
      );
    }
  });
});

describe('Exhaustive MOS finder for EDO', () => {
  it('Can find everything supported by 12EDO', () => {
    const scales = allForEdo(12);
    expect(scales).toHaveLength(21);
  });

  it('Can find everything reasonable supported by 31EDO', () => {
    const scales = allForEdo(31, 5, 12, 4.5);
    expect(scales).toHaveLength(29);
    for (const scale of scales) {
      const size = scale.numberOfLargeSteps + scale.numberOfSmallSteps;
      expect(size).toBeGreaterThanOrEqual(5);
      expect(size).toBeLessThanOrEqual(12);
      expect(scale.sizeOfLargeStep / scale.sizeOfSmallStep).toBeLessThanOrEqual(
        4.5
      );
    }
  });

  it('It throws an error when arguments are out of range', () => {
    expect(() => allForEdo(9, 1, 10)).toThrow();
  });

  it('includes 4L 3s for 53EDO', () => {
    const scales = allForEdo(53, 5, 12);
    expect(4 * 11 + 3 * 3).toBe(53);
    expect(scales.map(s => s.mosPattern)).toContain('4L 3s');
  });
});

describe('MOS mode describer', () => {
  it('knows about the modes of lemon', () => {
    const infos = mosModes(4, 2);
    expect(infos).toHaveLength(3);
    expect(infos[0]).toMatchObject({
      numberOfPeriods: 2,
      period: 3,
      mode: 'sLLsLL',
      udp: '0|4(2)',
    });
  });

  it('knows about phrygian', () => {
    const info = modeInfo(5, 2, {down: 5});
    expect(info).toMatchObject({
      numberOfPeriods: 1,
      period: 7,
      mode: 'sLLLsLL',
      udp: '1|5',
      modeName: 'Phrygian',
    });
  });

  it('knows about tonic in augmented', () => {
    const info = modeInfo(3, 3);
    expect(info).toMatchObject({
      numberOfPeriods: 3,
      period: 2,
      mode: 'LsLsLs',
      udp: '3|0(3)',
      modeName: 'Tonic',
    });
  });

  it('knows about minor', () => {
    const info = modeInfo(5, 2, {down: 4, extraNames: true});
    expect(info).toMatchObject({
      period: 7,
      numberOfPeriods: 1,
      udp: '2|4',
      mode: 'LsLLsLL',
      modeName: 'Aeolian (Minor)',
    });
  });
});

describe('Parent MOS finder', () => {
  it('knows that pentic is the parent of diatonic', () => {
    const info = parentMos('5L 2s');
    expect(info.name).toBe('pentic');
  });
  it('knows that malic is the parent of echinoid', () => {
    const info = parentMos('6L 2s');
    expect(info.name).toBe('malic');
  });
});

describe('Daughter MOS finder', () => {
  it('knows that the daughter of diatonic 19EDO is m-chromatic', () => {
    const info = daughterMos(5, 2, 3, 2);
    expect(info.name).toBe('m-chromatic');
    expect(info.hardness).toBe('basic');
  });

  it('is opinionated in calling the daughter of diatonic 12EDO p-chromatic', () => {
    const info = daughterMos(5, 2, 2, 1);
    expect(info.name).toBe('p-chromatic');
    expect(info.hardness).toBe('equalized');
  });
});

describe('Generator range calculator', () => {
  it('knows the ranges of tetratonic scales', () => {
    const ranges = generatorRanges(4, true);
    expect(ranges).toEqual([
      {
        period: {s: 1, n: 1, d: 2},
        lowerBound: {s: 0, n: 0, d: 1},
        upperBound: {s: 1, n: 1, d: 4},
        numberOfLargeSteps: 2,
        numberOfSmallSteps: 2,
        bright: false,
      },
      {
        period: {s: 1, n: 1, d: 2},
        lowerBound: {s: 1, n: 1, d: 4},
        upperBound: {s: 1, n: 1, d: 2},
        numberOfLargeSteps: 2,
        numberOfSmallSteps: 2,
        bright: true,
      },
      {
        period: {s: 1, n: 1, d: 1},
        lowerBound: {s: 0, n: 0, d: 1},
        upperBound: {s: 1, n: 1, d: 4},
        numberOfLargeSteps: 1,
        numberOfSmallSteps: 3,
        bright: false,
      },
      {
        period: {s: 1, n: 1, d: 1},
        lowerBound: {s: 1, n: 1, d: 4},
        upperBound: {s: 1, n: 1, d: 3},
        numberOfLargeSteps: 3,
        numberOfSmallSteps: 1,
        bright: true,
      },
      {
        period: {s: 1, n: 1, d: 1},
        lowerBound: {s: 1, n: 2, d: 3},
        upperBound: {s: 1, n: 3, d: 4},
        numberOfLargeSteps: 3,
        numberOfSmallSteps: 1,
        bright: false,
      },
      {
        period: {s: 1, n: 1, d: 1},
        lowerBound: {s: 1, n: 3, d: 4},
        upperBound: {s: 1, n: 1, d: 1},
        numberOfLargeSteps: 1,
        numberOfSmallSteps: 3,
        bright: true,
      },
    ]);
  });

  it('knows the ranges of pentatonic scales', () => {
    const ranges = generatorRanges(5);
    expect(ranges).toEqual([
      {
        period: {s: 1, n: 1, d: 1},
        lowerBound: {s: 0, n: 0, d: 1},
        upperBound: {s: 1, n: 1, d: 5},
        numberOfLargeSteps: 1,
        numberOfSmallSteps: 4,
        bright: false,
      },
      {
        period: {s: 1, n: 1, d: 1},
        lowerBound: {s: 1, n: 1, d: 5},
        upperBound: {s: 1, n: 1, d: 4},
        numberOfLargeSteps: 4,
        numberOfSmallSteps: 1,
        bright: true,
      },
      {
        period: {s: 1, n: 1, d: 1},
        lowerBound: {s: 1, n: 1, d: 3},
        upperBound: {s: 1, n: 2, d: 5},
        numberOfLargeSteps: 3,
        numberOfSmallSteps: 2,
        bright: false,
      },
      {
        period: {s: 1, n: 1, d: 1},
        lowerBound: {s: 1, n: 2, d: 5},
        upperBound: {s: 1, n: 1, d: 2},
        numberOfLargeSteps: 2,
        numberOfSmallSteps: 3,
        bright: true,
      },
      {
        period: {s: 1, n: 1, d: 1},
        lowerBound: {s: 1, n: 1, d: 2},
        upperBound: {s: 1, n: 3, d: 5},
        numberOfLargeSteps: 2,
        numberOfSmallSteps: 3,
        bright: false,
      },
      {
        period: {s: 1, n: 1, d: 1},
        lowerBound: {s: 1, n: 3, d: 5},
        upperBound: {s: 1, n: 2, d: 3},
        numberOfLargeSteps: 3,
        numberOfSmallSteps: 2,
        bright: true,
      },
      {
        period: {s: 1, n: 1, d: 1},
        lowerBound: {s: 1, n: 3, d: 4},
        upperBound: {s: 1, n: 4, d: 5},
        numberOfLargeSteps: 4,
        numberOfSmallSteps: 1,
        bright: false,
      },
      {
        period: {s: 1, n: 1, d: 1},
        lowerBound: {s: 1, n: 4, d: 5},
        upperBound: {s: 1, n: 1, d: 1},
        numberOfLargeSteps: 1,
        numberOfSmallSteps: 4,
        bright: true,
      },
    ]);
  });

  it('gives only four single-period hexatonic scales', () => {
    expect(generatorRanges(6)).toHaveLength(4);
  });

  it('gives all ten multi-period hexatonic scales when specified', () => {
    expect(generatorRanges(6, true)).toHaveLength(10);
  });

  it('gives all 12 heptatonic scales regardless', () => {
    expect(generatorRanges(7)).toHaveLength(12);
    expect(generatorRanges(7, true)).toHaveLength(12);
  });
});
