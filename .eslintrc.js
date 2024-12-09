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
    // Custom overrides if needed, for example:
    // 'react/jsx-props-no-spreading': 'off',
    // 'prettier/prettier': 'error',
  },
  ignorePatterns: ['.next/', 'node_modules/', 'dist/'],
};
