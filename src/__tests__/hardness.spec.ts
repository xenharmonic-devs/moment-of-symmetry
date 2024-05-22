import {describe, it, expect} from 'vitest';
import {getHardness} from '../hardness';

describe('Hardness namer', () => {
  it('knows the simple step ratios', () => {
    expect(getHardness(1, 1)).toBe('equalized');
    expect(getHardness(4, 3)).toBe('supersoft');
    expect(getHardness(3, 2)).toBe('soft');
    expect(getHardness(5, 3)).toBe('semisoft');
    expect(getHardness(2, 1)).toBe('basic');
    expect(getHardness(5, 2)).toBe('semihard');
    expect(getHardness(3, 1)).toBe('hard');
    expect(getHardness(4, 1)).toBe('superhard');
    expect(getHardness(1, 0)).toBe('collapsed');
  });

  it('knows the intermediate ranges', () => {
    expect(getHardness(4.0, 3.1)).toBe('ultrasoft');
    expect(getHardness(4.1, 3.0)).toBe('parasoft');
    expect(getHardness(3.1, 2.0)).toBe('quasisoft');
    expect(getHardness(2.0, 1.1)).toBe('minisoft');
    expect(getHardness(2.1, 1.0)).toBe('minihard');
    expect(getHardness(3.0, 1.1)).toBe('quasihard');
    expect(getHardness(3.1, 1.0)).toBe('parahard');
    expect(getHardness(4.1, 1.0)).toBe('ultrahard');
  });

  it('has a non-standard name for 0:0', () => {
    expect(getHardness(0, 0)).toBe('stationary');
  });

  it('ignores scale direction', () => {
    expect(getHardness(-2, -1)).toBe('basic');
  });

  it('has a prefix for 0 < hardness < 1', () => {
    expect(getHardness(1, 2)).toBe('anti-basic');
  });

  it('has a prefix for -1 < hardness < 0', () => {
    expect(getHardness(-1, 2)).toBe('trans-anti-basic');
    expect(getHardness(1, -2)).toBe('trans-anti-basic');
  });

  it('has a prefix for hardness < -1', () => {
    expect(getHardness(-2, 1)).toBe('trans-basic');
    expect(getHardness(2, -1)).toBe('trans-basic');
  });
});
