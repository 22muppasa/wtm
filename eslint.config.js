const { defineConfig, globalIgnores } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
module.exports = defineConfig([globalIgnores(['**/dist/**', '**/.expo/**', '**/node_modules/**']), expo, {
  ignores: ['**/dist/**', '**/.expo/**'],
  // Expo's current flat preset enables React Compiler diagnostics that are
  // advisory for this native demo (e.g. refs passed to gesture responders).
  rules: {
    'react-hooks/purity': 'off',
    'react-hooks/immutability': 'off',
    'react-hooks/refs': 'off',
    'react-hooks/use-memo': 'off',
    'react-hooks/preserve-manual-memoization': 'off',
    'react/no-unescaped-entities': 'off',
    '@typescript-eslint/array-type': 'off',
  },
}]);
