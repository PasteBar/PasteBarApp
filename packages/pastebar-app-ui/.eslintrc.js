module.exports = {
  env: {
    browser: true,
    es6: true,
    jquery: false,
    node: false,
  },
  root: false,
  plugins: ['@typescript-eslint', 'eslint-plugin-react-compiler', 'prettier', 'sonarjs'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:sonarjs/recommended',
    'plugin:import/electron',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
  ],
  rules: {
    'react-compiler/react-compiler': 'error',
    '@typescript-eslint/no-var-requires': 0,
    'no-empty-function': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',
    '@typescript-eslint/ban-ts-comment': 0,
    '@typescript-eslint/no-unused-vars': ['warn'],
    '@typescript-eslint/no-empty-function': 0,
    'sonarjs/no-duplicate-string': 'off',
    'sonarjs/no-duplicated-branches': 'off',
    'sonarjs/no-nested-template-literals': 'off',
    'sonarjs/no-identical-functions': 'off',
    'cypress/no-unnecessary-waiting': 'off',
    'react/prop-types': 0,
    'sonarjs/cognitive-complexity': ['error', 200],
    camelcase: ['error', { ignoreDestructuring: true }],
    'computed-property-spacing': [2, 'never'],
    'no-extend-native': 2,
    'no-trailing-spaces': 1,
    'no-mixed-spaces-and-tabs': ['warn', 'smart-tabs'],
    'no-use-before-define': [2, 'nofunc'],
    'object-curly-spacing': [2, 'always'],
    quotes: [
      2,
      'single',
      {
        avoidEscape: true,
        allowTemplateLiterals: true,
      },
    ],
  },
  parserOptions: {
    parser: '@babel/eslint-parser',
    requireConfigFile: false,
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  settings: {
    'import/resolver': {
      typescript: {}, // this loads <rootdir>/tsconfig.json to eslint
    },
    react: {
      version: 'detect',
    },
  },
}
