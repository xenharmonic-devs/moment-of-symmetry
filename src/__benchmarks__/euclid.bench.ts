import {describe, bench} from 'vitest';
import {bjorklund, bresenham} from '../helpers';

function randSmallInt() {
  return Math.floor(Math.random() * 100) + 1;
}

describe('Euclidean pattern generation', () => {
  bench("Björklund's algorithm", () => {
    bjorklund(randSmallInt(), randSmallInt(), true, false);
  });

  bench('Bresenham line algorithm', () => {
    bresenham(randSmallInt(), randSmallInt(), true, false);
  });
});
