import {describe, it, expect} from 'vitest';
import {tamnamsInfo, modeName} from '../names';

describe('MOS pattern namer', () => {
  it('knows about smitonic', () => {
    expect(tamnamsInfo('4L 3s')!.name).toBe('smitonic');
  });

  it('knows the abbreviation of malic', () => {
    expect(tamnamsInfo('2L 4s')!.abbreviation).toBe('mal');
  });

  it('knows about pine and its subset', () => {
    expect(tamnamsInfo('7L 1s')!.name).toBe('pine');
    expect(tamnamsInfo('1L 6s')!.name).toBe('onyx');
  });

  it('has a special names for diachromic', () => {
    expect(tamnamsInfo('7L 5s')!.name).toBe('mean-chromatic');
    expect(tamnamsInfo('5L 7s')!.name).toBe('pyth-chromatic');
  });

  it('has a special names for diaenharmic', () => {
    expect(tamnamsInfo('12L 7s')!.name).toBe('flat-enharmonic');
    expect(tamnamsInfo('7L 12s')!.name).toBe('mean-enharmonic');
    expect(tamnamsInfo('12L 5s')!.name).toBe('pyth-enharmonic');
    expect(tamnamsInfo('5L 12s')!.name).toBe('supy-enharmonic');
  });

  it('has consistent a naming scheme for *enharmics', () => {
    expect(12 * 2 + 7).toBe(5 * 5 + 3 * 2);
    expect(7 * 2 + 12).toBe(4 * 5 + 3 * 2);
    expect(12 * 2 + 5).toBe(5 * 5 + 2 * 2);
    expect(5 * 2 + 12).toBe(4 * 5 + 2);
  });

  it('has a consistent scheme for mechachromics', () => {
    expect(tamnamsInfo('5L 6s')!.name).toBe('mechapechromic');
    expect(tamnamsInfo('6L 5s')!.name).toBe('mechamechromic');

    expect(5 * 2 + 6).toBe(5 * 3 + 1);
    expect(6 * 2 + 5).toBe(5 * 3 + 2);
  });

  it('has a consistent scheme for asina-enharmics', () => {
    expect(tamnamsInfo('1L 11s')!.name).toBe('asinasenharmic');
    expect(tamnamsInfo('11L 1s')!.name).toBe('asinapenharmic');
    expect(tamnamsInfo('10L 11s')!.name).toBe('asinamenharmic');
    expect(tamnamsInfo('11L 10s')!.name).toBe('asinafenharmic');

    expect(1 * 2 + 11).toBe(1 * 4 + 9 * 1);
    expect(11 * 2 + 1).toBe(1 * 5 + 9 * 2);
    expect(10 * 2 + 11).toBe(1 * 4 + 9 * 3);
    expect(11 * 2 + 10).toBe(1 * 5 + 9 * 3);
  });

  it('has special names for the great-great-granddaughters of diatonic', () => {
    expect(tamnamsInfo('12L 29s')!.name).toBe('pythamystonic');
    expect(tamnamsInfo('12L 31s')!.name).toBe('fauxmuscovian');
    expect(tamnamsInfo('17L 22s')!.name).toBe('antifractalic');
    expect(tamnamsInfo('17L 29s')!.name).toBe('perotinic');
    expect(tamnamsInfo('19L 26s')!.name).toBe('veljentyttonic');
    expect(tamnamsInfo('19L 31s')!.name).toBe('fauxsaudi');
    expect(tamnamsInfo('22L 17s')!.name).toBe('fractalic');
    expect(tamnamsInfo('22L 5s')!.name).toBe('antireinatonic');
    expect(tamnamsInfo('26L 19s')!.name).toBe('veljenpoikanic');
    expect(tamnamsInfo('26L 7s')!.name).toBe('siskonpoikanic');
    expect(tamnamsInfo('29L 12s')!.name).toBe('antipythamystonic');
    expect(tamnamsInfo('29L 17s')!.name).toBe('martinic');
    expect(tamnamsInfo('31L 12s')!.name).toBe('fauxsiberian');
    expect(tamnamsInfo('31L 19s')!.name).toBe('fauxomani');
    expect(tamnamsInfo('5L 22s')!.name).toBe('reinatonic');
    expect(tamnamsInfo('7L 26s')!.name).toBe('siskontyttonic');
  });
});

describe('Mode namer', () => {
  it('knows dorian', () => {
    expect(modeName('LsLLLsL')).toBe('Dorian');
  });

  it('knows major', () => {
    expect(modeName('LLsLLLs', true)).toBe('Ionian (Major)');
  });

  it('knows kleeth', () => {
    expect(modeName('LssLsLs')).toBe('Kleeth');
  });

  it('knows karakalian', () => {
    expect(modeName('LLLLLsL')).toBe('Karakalian');
  });
});
