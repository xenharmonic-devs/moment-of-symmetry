import Benchmark = require('benchmark');
import {bjorklund, bresenham} from '../helpers';

function randSmallInt() {
  return Math.floor(Math.random() * 100) + 1;
}

const euclidSuite = new Benchmark.Suite();
euclidSuite
  .add("Bjorklund's algorithm", () =>
    bjorklund(randSmallInt(), randSmallInt(), true, false)
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
