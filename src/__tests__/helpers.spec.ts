import {describe, it, expect} from 'vitest';
import {bjorklund, modInv, bresenham, cumsum} from '../helpers';
import {gcd, mmod} from 'xen-dev-utils';

describe('Modular inverse', () => {
  it.each([2, 3, 4, 5, 6, 11, 79, 100])('Finds inverses mod %d', modulus => {
    for (let i = 1; i < modulus; ++i) {
      if (gcd(i, modulus) !== 1) {
        expect(() => modInv(i, modulus)).toThrow();
      } else {
        const inverse = modInv(i, modulus);
        expect(mmod(i * inverse, modulus)).toBe(1);
      }
    }
  });
});

describe("Björklund's algorithm", () => {
  it('distributes 3 beats evenly into a grid of 5', () => {
    const result = bjorklund(3, 5 - 3, true, false);
    expect(result).toEqual([true, true, false, true, false]);
  });
  it('distributes 2 beats evenly into a grid of 6', () => {
    const result = bjorklund(2, 6 - 2, true, false);
    expect(result).toEqual([true, false, false, true, false, false]);
  });
  it('produces the brightest modes', () => {
    for (let l = 1; l < 20; ++l) {
      for (let s = 1; s < 10; s++) {
        let basic = bjorklund(l, s, 2, 1);
        basic = cumsum(basic.concat(basic));
        basic.unshift(0);
        for (let i = 1; i < l + s; ++i) {
          const wide = basic[i] - basic[0];
          for (let j = 1; j < l + s; ++j) {
            const narrowOrEqual = basic[i + j] - basic[j];
            expect(wide).toBeGreaterThanOrEqual(narrowOrEqual);
          }
        }
      }
    }
  });
});

describe('Bresenham line algorithm', () => {
  it('distributes 3 beats evenly into a grid of 5', () => {
    const result = bresenham(3, 5 - 3, true, false);
    expect(result).toEqual([true, true, false, true, false]);
  });

  it('distributes 2 beats evenly into a grid of 6', () => {
    const result = bresenham(2, 6 - 2, true, false);
    expect(result).toEqual([true, false, false, true, false, false]);
  });

  it('produces the brightest modes', () => {
    for (let l = 1; l < 20; ++l) {
      for (let s = 1; s < 10; s++) {
        let basic = bresenham(l, s, 2, 1);
        basic = cumsum(basic.concat(basic));
        basic.unshift(0);
        for (let i = 1; i < l + s; ++i) {
          const wide = basic[i] - basic[0];
          for (let j = 1; j < l + s; ++j) {
            const narrowOrEqual = basic[i + j] - basic[j];
            expect(wide).toBeGreaterThanOrEqual(narrowOrEqual);
          }
        }
      }
    }
  });
});
