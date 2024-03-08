# moment-of-symmetry
Moment of Symmetry (MOS) musical scale generation and analysis for Javascript

MOS scales consist of two intervals that are distributed as evenly as possible

## Installation ##
```bash
npm i moment-of-symmetry
```

## Documentation ##
Documentation is hosted at the project [Github pages](https://xenharmonic-devs.github.io/moment-of-symmetry).

To generate documentation locally run:
```bash
npm run doc
```

## Examples ##
Generate a musical scale with 3 large steps and 4 small steps (3L 4s). The result is an array of degrees of 10edo.
```typescript
import {mos} from 'moment-of-symmetry';

mos(3, 4);  // [2, 3,  5, 6, 8, 9, 10]
```

Generate a diatonic (5L 2s) scale as a subset of 31edo. The large step is 5 edo-steps while the small step is 3 edo-steps.
```typescript
mos(5, 2, {sizeOfLargeStep: 5, sizeOfSmallStep: 3, down: 1});  // [5, 10, 13, 18, 23, 28, 31]
```

Generate the whole chromatic scale in 12edo with a diatonic scale marked by `'parent'` values.
```typescript
mosWithDaughter(5, 2);
/*
  Map(12) {
    1 => 'both',
    2 => 'parent',
    3 => 'both',
    4 => 'parent',
    5 => 'both',
    6 => 'parent',
    7 => 'parent',
    8 => 'both',
    9 => 'parent',
    10 => 'both',
    11 => 'parent',
    12 => 'parent'
  }
*/
```

Generate the whole chromatic scale in 17edo.
```typescript
mosWithDaughter(5, 2, {sizeOfLargeStep: 3, accidentals: 'both'});
/*
  Map(17) {
    1 => 'flat',
    2 => 'sharp',
    3 => 'parent',
    4 => 'flat',
    5 => 'sharp',
    6 => 'parent',
    7 => 'flat',
    8 => 'sharp',
    9 => 'parent',
    10 => 'parent',
    11 => 'flat',
    12 => 'sharp',
    13 => 'parent',
    14 => 'flat',
    15 => 'sharp',
    16 => 'parent',
    17 => 'parent'
}
*/
```

Get information about the modes of smitonic (4L 3s).
```typescript
mosModes(4, 3);
/*
  [
    {
      period: 7,
      numberOfPeriods: 1,
      udp: '0|6',
      mode: 'sLsLsLL',
      modeName: 'Dagothic'
    },
    {
      period: 7,
      numberOfPeriods: 1,
      udp: '1|5',
      mode: 'sLsLLsL',
      modeName: 'Almalexian'
    },
    ...
  ]
*/
```

Get an array of the MOS patterns of the Pythagorean temperament.
```typescript
mosPatterns(Math.log2(3/2));
/*
  [
    ...,
    {
      size: 7,
      numberOfLargeSteps: 5,
      numberOfSmallSteps: 2,
      mosPattern: '5L 2s',
      name: 'diatonic'
    },
    {
      size: 12,
      numberOfLargeSteps: 5,
      numberOfSmallSteps: 7,
      mosPattern: '5L 7s',
      name: 'p-chromatic',
      prefix: 'pychro',
      abbreviation: 'pychro',
      familyPrefix: 'pychro'
    },
  ...
  ]
*/
```
