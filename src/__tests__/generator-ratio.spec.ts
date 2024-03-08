import {describe, it, expect} from 'vitest';
import {arraysEqual, Fraction} from 'xen-dev-utils';
import {
  isBright,
  mosForms,
  mosPatterns,
  mosSizes,
  scaleInfo,
  toBrightGeneratorPerPeriod,
} from '../generator-ratio';

describe('Moment of Symmetry scale size calculator', () => {
  it('produces the correct pattern for pythagorean temperament', () => {
    expect(
      arraysEqual(
        mosSizes(Math.log(3) / Math.LN2, undefined, 6),
        [2, 3, 5, 7, 12, 17]
      )
    ).toBeTruthy();
  });
  it('produces the correct pattern for quarter-comma meantone', () => {
    expect(
      arraysEqual(
        mosSizes(Math.log(5) / 4 / Math.LN2, undefined, 7),
        [2, 3, 5, 7, 12, 19, 31]
      )
    ).toBeTruthy();
  });
  it('it includes 9 for barbados', () => {
    expect(mosSizes(248.621 / 1200)).toContain(9);
  });
  it('can handle exact ratios representable using floating point numbers', () => {
    expect(arraysEqual(mosSizes(3 / 16), [2, 3, 4, 5, 6, 11, 16])).toBeTruthy();
  });
  it('can handle exact ratios', () => {
    expect(
      arraysEqual(mosSizes(new Fraction(5 / 11)), [2, 3, 5, 7, 9, 11])
    ).toBeTruthy();
  });
});

describe('Moment of Symmetry scale form calculator', () => {
  it('produces the correct pattern for pythagorean temperament', () => {
    const forms = mosForms(Math.log(3) / Math.LN2, undefined, 9);
    expect(forms[0].equals('1/2')).toBeTruthy();
    expect(forms[1].equals('2/3')).toBeTruthy();
    expect(forms[2].equals('3/5')).toBeTruthy();
    expect(forms[3].equals('4/7')).toBeTruthy();
    expect(forms[4].equals('7/12')).toBeTruthy();
    expect(forms[5].equals('10/17')).toBeTruthy();
    expect(forms[6].equals('17/29')).toBeTruthy();
    expect(forms[7].equals('24/41')).toBeTruthy();
    expect(forms[8].equals('31/53')).toBeTruthy();
  });

  it('produces the correct pattern for quarter-comma meantone', () => {
    const forms = mosForms(Math.log(5) / 4 / Math.LN2, undefined, 8);
    expect(forms[0].equals('1/2')).toBeTruthy();
    expect(forms[1].equals('2/3')).toBeTruthy();
    expect(forms[2].equals('3/5')).toBeTruthy();
    expect(forms[3].equals('4/7')).toBeTruthy();
    expect(forms[4].equals('7/12')).toBeTruthy();
    expect(forms[5].equals('11/19')).toBeTruthy();
    expect(forms[6].equals('18/31')).toBeTruthy();
    expect(forms[7].equals('29/50')).toBeTruthy();
  });
});

describe('Moment of Symmetry scale pattern calculator', () => {
  it('knows 12EDO has a diatonic scale', () => {
    const patterns = mosPatterns(new Fraction(7, 12));
    expect(patterns).toHaveLength(4);
    expect(patterns[3].name).toBe('diatonic');
  });

  it('knows pythagorean temperament results in a p-chromatic scale', () => {
    const patterns = mosPatterns(Math.log(3) / Math.LN2, 1, undefined, 5);
    expect(patterns).toHaveLength(5);
    expect(patterns[4].name).toBe('p-chromatic');
  });

  it('knows quarter-comma meantone results in an m-chromatic scale', () => {
    const patterns = mosPatterns(Math.log(5) / 4 / Math.LN2, 1, undefined, 5);
    expect(patterns).toHaveLength(5);
    expect(patterns[4].name).toBe('m-chromatic');
  });

  it('knows blackwood corresponds to pentawood', () => {
    const numPeriods = 5;
    const patterns = mosPatterns(
      Math.log(5) / (Math.LN2 / numPeriods),
      numPeriods,
      undefined,
      1
    );
    expect(patterns).toHaveLength(1);
    expect(patterns[0].name).toBe('pentawood');
  });

  it('obeys size limits', () => {
    mosPatterns((Math.log(3) / Math.LN2) * 2, 2, 22).forEach(pattern => {
      expect(pattern.size).toBeLessThanOrEqual(22);
    });
  });
});

describe('Scale describer', () => {
  it('knows about mixolydian', () => {
    const info = scaleInfo(Math.log(3) / Math.LN2, 7, 2);
    expect(info.modeName).toBe('Mixolydian');
  });

  it('can calculate the step pattern of a non-MOS scales', () => {
    const info = scaleInfo(Math.log(3) / Math.LN2, 9, 2);
    expect(info.stepPattern).toBe('LLsMsLsMs');
  });

  it('can handle random arguments', () => {
    const size = Math.ceil(1 + Math.random() * 10);
    const down = Math.round(Math.random() * (size - 1));
    const numPeriods = Math.ceil(Math.random() * 3);
    scaleInfo(Math.random(), size * numPeriods, down * numPeriods, numPeriods);
  });
});

describe('Generator / period brightener', () => {
  it('knows that fourths are dark in diatonic', () => {
    const fourth = 5 / 12;
    const bright = toBrightGeneratorPerPeriod(fourth, 7);
    const fifth = 7 / 12;
    expect(bright).toBeCloseTo(fifth);
  });

  it('can handle exact ratios', () => {
    const dark = new Fraction(6, 11);
    const bright = toBrightGeneratorPerPeriod(dark, 7);
    expect(bright.equals(new Fraction(5, 11))).toBeTruthy();
  });
});

describe('Brightness detector', () => {
  it('knows that fifths are bright', () => {
    for (let g = (1200 * 4) / 7; g < 720; g += 1.17) {
      expect(isBright(g / 1200.0, 7)).toBe(true);
    }
  });
});
