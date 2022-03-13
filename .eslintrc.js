module.exports = {
  'env': {
    'node': true,
    'es6': true
  },
  'parserOptions': {
    'ecmaVersion': 2020,
    'sourceType': 'module',
    'ecmaFeatures': {
      'modules': true
    }
  },
  'extends': [
    'eslint:recommended',
    'google'
  ],
  'rules': {
    'space-infix-ops': ['error', { 'int32Hint': false }],
    'quotes': ['warn', 'single', { allowTemplateLiterals: true }],
    'quote-props': ['warn', 'consistent'],
    'eqeqeq': ['warn', 'always'],
    'indent': ['error', 2, { 'SwitchCase': 1 }],
    'object-curly-spacing': ['warn', 'always'],
    'max-len': ['off'],
    'curly': [2, 'all'],
    'no-var': 1,
    'semi': 2,
    'comma-style': 1,
    'comma-dangle': ['error', 'only-multiline'],
    'prefer-const': ['error', { 'destructuring': 'all', 'ignoreReadBeforeAssign': true }],
    'require-jsdoc': ['off'],
    'space-before-function-paren': ['error', {
      'anonymous': 'always',
      'named': 'never',
      'asyncArrow': 'always'
    }],
    'no-unsafe-optional-chaining': ['off']
  }
};
