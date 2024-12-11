module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json', // Ensure this points to your actual tsconfig
  },
  extends: [
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:@typescript-eslint/recommended',
    'next/core-web-vitals',
    'plugin:prettier/recommended',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    '@typescript-eslint/lines-between-class-members': 'off',
    '@typescript-eslint/no-throw-literal': 'off',
    'lines-between-class-members': [
      'error',
      'always',
      { exceptAfterSingleLine: true },
    ],
    'no-throw-literal': 'error',
    'jsx-a11y/media-has-caption': 'off',
    'react/require-default-props': [
      'off',
      {
        ignoreFunctionalComponents: true,
      },
    ],
    'import/prefer-default-export': 'off',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/test/**', '**/*.test.js', '**/*.spec.js'], // Include dev dependencies for tests
        optionalDependencies: false, // Optional dependencies are allowed
        peerDependencies: false, // Peer dependencies are allowed
      },
    ],
    // Custom overrides if needed, for example:
    // 'react/jsx-props-no-spreading': 'off',
    // 'prettier/prettier': 'error',
  },

  ignorePatterns: ['.next/', 'node_modules/', 'dist/'],
};
