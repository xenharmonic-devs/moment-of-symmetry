# moment-of-symmetry
Moment of Symmetry (MOS) musical scale generation and analysis for Javascript

MOS scales consist of two intervals that are distributed as evenly as possible

## Installation ##
```bash
npm i
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

mos(3, 4);  // [1, 2, 4, 5, 7, 8, 10]
```

Generate a diatonic (5L 2s) scale as a subset of 31edo. The large step is 5 edo-steps while the small step is 3 edo-steps.
```typescript
mos(5, 2, 5, 3);  // [3, 8, 13, 16, 21, 26, 31]
```

Generate the whole chromatic scale in 12edo with a diatonic scale marked by `true` values.
```typescript
mosWithDaughter(5, 2);
/*
  Map(12) {
    1 => true,
    2 => false,
    3 => true,
    4 => false,
    5 => true,
    6 => true,
    7 => false,
    8 => true,
    9 => false,
    10 => true,
    11 => false,
    12 => true
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
