import {describe, it, expect} from 'vitest';
import {tamnamsInfo, modeName} from '../names';

describe('MOS pattern namer', () => {
  it('knows about smitonic', () => {
    expect(tamnamsInfo('4L 3s')!.name).toBe('smitonic');
  });

  it('knows the abbreviation of antilemon', () => {
    expect(tamnamsInfo('2L 4s')!.abbreviation).toBe('alem');
  });

  it('knows about pine and its subset', () => {
    expect(tamnamsInfo('7L 1s')!.subset).toBeFalsy();
    expect(tamnamsInfo('1L 6s')!.subset).toBeTruthy();
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
