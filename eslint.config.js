import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);

export default [
  ...require('gts'),
  {
    ignores: [
      'dist/**',
      'docs/**',
      'src/__tests__/**',
      'src/__benchmarks__/**',
      '**/*.js',
    ],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
    },
  },
];
