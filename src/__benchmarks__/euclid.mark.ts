// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Benchmark = require('benchmark');
import {bjorklund, bresenham} from '../helpers';

function randSmallInt() {
  return Math.floor(Math.random() * 100) + 1;
}

function randSubsequences() {
  const result: boolean[][] = [];
  const l = randSmallInt();
  for (let i = 0; i < l; ++i) {
    result.push([true]);
  }
  const s = randSmallInt();
  for (let i = 0; i < s; ++i) {
    result.push([false]);
  }
  return result;
}

const euclidSuite = new Benchmark.Suite();
euclidSuite
  .add("Bjorklund's algorithm", () =>
    bjorklund(randSubsequences()).flat(Infinity)
  )
  .add('Bresenham line algorithm', () =>
    bresenham(randSmallInt(), randSmallInt(), true, false)
  )
  .on('cycle', (event: {target: any}) => {
    console.log(String(event.target));
  })
  .on('complete', () => {
    console.log('Fastest is ' + euclidSuite.filter('fastest').map('name'));
  })
  .run({async: true});
