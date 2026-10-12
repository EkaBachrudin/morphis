import tseslint from 'typescript-eslint';
import css from '@eslint/css';

const tsFiles = ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'];

export default [
  {
    ignores: [
      '**/dist/**',
      'downloads/**',
      '**/node_modules/**',
      'storybook-static/**',
      'custom-elements.json',
    ],
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: config.files ?? tsFiles,
  })),
  {
    files: tsFiles,
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.css'],
    plugins: { css },
    language: 'css/css',
    languageOptions: { tolerant: true },
    rules: {
      'css/no-empty-blocks': 'error',
      'css/no-duplicate-imports': 'error',
      'css/no-duplicate-keyframe-selectors': 'error',
      'css/no-invalid-properties': 'error',
      // Tailwind memakai at-rule kustom (@reference, @apply, @theme,
      // @custom-variant, @layer, …) yang tidak dikenali parser CSS standar.
      'css/no-invalid-at-rules': 'off',
      'css/no-invalid-at-rule-placement': 'off',
    },
  },
];
