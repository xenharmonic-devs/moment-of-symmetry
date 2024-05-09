import {describe, expect, it} from 'vitest';
import {generateNotation} from '../notation';
import {dot} from 'xen-dev-utils';

describe('Diamond mos notation generator', () => {
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
      {center: [1, 2], perfect: true, mid: [0.5, 2.5]},
      {center: [1, 4], perfect: true, mid: [1.5, 3.5]},
      {center: [1.5, 4.5], perfect: false, mid: undefined},
    ]);

    expect(equave).toEqual([2, 6]);
    expect(period).toEqual([1, 3]);
    expect(brightGenerator).toEqual([1, 2]);
  });
});
