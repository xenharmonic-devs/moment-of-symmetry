import {describe, expect, it} from 'vitest';
import {generateNotation, nthNominal} from '../notation';
import {dot} from 'xen-dev-utils';

describe('Generalized Diamond-mos nominals', () => {
  it('has 17 standard nominals', () => {
    expect([...Array(17).keys()].map(nthNominal).join('')).toBe(
      'JKLMNOPQRSTUVWXYZ'
    );
  });
  it('has 289 two-character nominals', () => {
    for (let i = 0; i < 289; ++i) {
      expect(nthNominal(17 + i)).toHaveLength(2);
    }
  });
  it('has JJJ as the first three-character nominal', () => {
    expect(nthNominal(17 + 17 * 17)).toBe('JJJ');
  });
});

describe('Diamond-mos notation generator', () => {
  it('generates the config for diatonic major', () => {
    const notation = generateNotation('LLsLLLs');
    const basic = [2, 1];
    const {scale, degrees, equave, period, brightGenerator} = notation;
    expect(dot(basic, scale.get('J')!)).toBe(0);
    expect(dot(basic, scale.get('K')!)).toBe(2);
    expect(dot(basic, scale.get('L')!)).toBe(4);
    expect(dot(basic, scale.get('M')!)).toBe(5);
    expect(dot(basic, scale.get('N')!)).toBe(7);
    expect(dot(basic, scale.get('O')!)).toBe(9);
    expect(dot(basic, scale.get('P')!)).toBe(11);

    expect(degrees[0].perfect).toBe(true);
    expect(degrees[0].mid).toBeUndefined();
    expect(dot(basic, degrees[0].center)).toBe(0); // P1

    expect(degrees[1].perfect).toBe(false);
    expect(degrees[1].mid).toBeUndefined();
    expect(dot(basic, degrees[1].center) - 0.5).toBe(1); // m2
    expect(dot(basic, degrees[1].center) + 0.5).toBe(2); // M2

    expect(degrees[2].perfect).toBe(false);
    expect(degrees[2].mid).toBeUndefined();
    expect(dot(basic, degrees[2].center)).toBe(3.5); // n3

    expect(degrees[3].perfect).toBe(true);
    expect(dot(basic, degrees[3].mid!) + 0.5).toBe(6); // A4
    expect(dot(basic, degrees[3].center)).toBe(5); // P4

    expect(degrees[4].perfect).toBe(true);
    expect(dot(basic, degrees[4].mid!) - 0.5).toBe(6); // d5
    expect(dot(basic, degrees[4].center)).toBe(7); // P5

    expect(degrees[5].perfect).toBe(false);
    expect(degrees[5].mid).toBeUndefined();
    expect(dot(basic, degrees[5].center)).toBe(8.5); // n6

    expect(degrees[6].perfect).toBe(false);
    expect(degrees[6].mid).toBeUndefined();
    expect(dot(basic, degrees[6].center)).toBe(10.5); // n7

    expect(dot(basic, equave)).toBe(12); // P8
    expect(dot(basic, period)).toBe(12); // P8
    expect(dot(basic, brightGenerator)).toBe(7); // P5
  });

  it('generates the config for subaric 4|2(2)', () => {
    const {scale, degrees, equave, period, brightGenerator} =
      generateNotation('sLsssLss');
    expect(scale.get('J')).toEqual([0, 0]);
    expect(scale.get('K')).toEqual([0, 1]);
    expect(scale.get('L')).toEqual([1, 1]);
    expect(scale.get('M')).toEqual([1, 2]);
    expect(scale.get('N')).toEqual([1, 3]);
    expect(scale.get('O')).toEqual([1, 4]);
    expect(scale.get('P')).toEqual([2, 4]);
    expect(scale.get('Q')).toEqual([2, 5]);

    expect(degrees).toEqual([
      {center: [0, 0], perfect: true, mid: undefined},
      {center: [0, 1], perfect: true, mid: [0.5, 0.5]},
      {center: [0.5, 1.5], perfect: false, mid: undefined},
      {center: [1, 2], perfect: true, mid: [0.5, 2.5]},
    ]);

    const basic = [2, 1];
    expect(dot(basic, degrees[0].center)).toBe(0); // P0subars
    expect(dot(basic, degrees[1].center)).toBe(1); // P1subars
    expect(dot(basic, degrees[2].center)).toBe(2.5); // n2subars
    expect(dot(basic, degrees[3].center)).toBe(4); // P3subars

    expect(equave).toEqual([2, 6]);
    expect(period).toEqual([1, 3]);
    expect(brightGenerator).toEqual([1, 2]);
  });

  it('generates a broken config given "LLLss"', () => {
    const {scale, degrees} = generateNotation('LLLss');

    // As specified
    expect(scale.get('J')).toEqual([0, 0]);
    expect(scale.get('K')).toEqual([1, 0]);
    expect(scale.get('L')).toEqual([2, 0]);
    expect(scale.get('M')).toEqual([3, 0]);
    expect(scale.get('N')).toEqual([3, 1]);

    // For the actual 3L 2s
    expect(degrees).toEqual([
      {center: [0, 0], perfect: true, mid: undefined},
      {center: [0.5, 0.5], perfect: false, mid: undefined},
      {center: [1, 1], perfect: true, mid: [1.5, 0.5]},
      {center: [2, 1], perfect: true, mid: [1.5, 1.5]},
      {center: [2.5, 1.5], perfect: false, mid: undefined},
    ]);
  });

  it('makes the exception for nL ns i.e. not fully perfect', () => {
    const {scale, degrees} = generateNotation('LsLsLs');
    expect(scale.get('J')).toEqual([0, 0]);
    expect(scale.get('K')).toEqual([1, 0]);
    expect(scale.get('L')).toEqual([1, 1]);
    expect(scale.get('M')).toEqual([2, 1]);
    expect(scale.get('N')).toEqual([2, 2]);
    expect(scale.get('O')).toEqual([3, 2]);

    expect(degrees).toEqual([
      {center: [0, 0], perfect: true, mid: undefined},
      {center: [0.5, 0.5], perfect: false, mid: undefined},
    ]);

    const basic = [2, 1];
    expect(dot(basic, degrees[0].center)).toBe(0); // P0trwds

    expect(dot(basic, degrees[1].center) - 0.5).toBe(1); // m1trwds
    expect(dot(basic, degrees[1].center) + 0.5).toBe(2); // M1trwds
  });

  it('accepts up to nominal Z', () => {
    const {scale} = generateNotation('LsLsLsLsLsLsLsLsL');
    expect(scale.has('J')).toBe(true);
    expect(scale.has('K')).toBe(true);
    expect(scale.has('L')).toBe(true);
    expect(scale.has('M')).toBe(true);
    expect(scale.has('N')).toBe(true);
    expect(scale.has('O')).toBe(true);
    expect(scale.has('P')).toBe(true);
    expect(scale.has('Q')).toBe(true);
    expect(scale.has('R')).toBe(true);
    expect(scale.has('S')).toBe(true);
    expect(scale.has('T')).toBe(true);
    expect(scale.has('U')).toBe(true);
    expect(scale.has('V')).toBe(true);
    expect(scale.has('W')).toBe(true);
    expect(scale.has('X')).toBe(true);
    expect(scale.has('Y')).toBe(true);
    expect(scale.has('Z')).toBe(true);
  });

  it('accepts above nominal Z', () => {
    const {scale} = generateNotation('LsLsLsLsLsLsLsLsLs');
    expect(scale.has('J')).toBe(true);
    expect(scale.has('Z')).toBe(true);
    expect(scale.has('JJ')).toBe(true);
    expect(scale.has('JK')).toBe(false);
    expect(scale.has('KJ')).toBe(false);
  });

  it('it rejects all L', () => {
    expect(() => generateNotation('LLLL')).toThrow();
  });

  it('it rejects all s', () => {
    expect(() => generateNotation('ss')).toThrow();
  });

  it('it rejects foreign steps', () => {
    expect(() => generateNotation('LMsL')).toThrow();
  });
});
