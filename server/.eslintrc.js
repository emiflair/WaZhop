module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'airbnb-base'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-console': 'off',
    'no-underscore-dangle': ['error', { allow: ['_id', '__v'] }],
    'consistent-return': 'off',
    'func-names': 'off',
    'object-shorthand': 'off',
    'no-process-exit': 'off',
    'no-param-reassign': 'off',
    'class-methods-use-this': 'off',
    'prefer-destructuring': 'warn',
    'no-unused-vars': ['warn', { argsIgnorePattern: 'req|res|next|val', varsIgnorePattern: '^_' }],
    'max-len': ['warn', { code: 120, ignoreComments: true }],
    'comma-dangle': ['error', 'only-multiline'],
    // Relax strict Airbnb rules for existing codebase
    'radix': 'warn',
    'no-empty': 'warn',
    'no-restricted-syntax': 'off',
    'no-await-in-loop': 'warn',
    'no-plusplus': 'off',
    'no-nested-ternary': 'warn',
    'global-require': 'warn',
    'no-lonely-if': 'warn',
    'no-shadow': 'warn',
    'import/no-unresolved': 'warn',
    'guard-for-in': 'warn',
    'no-use-before-define': 'warn',
    'semi-style': 'warn',
    'import/no-extraneous-dependencies': 'warn',
    'no-return-await': 'warn',
    'no-script-url': 'warn',
    'no-control-regex': 'warn'
  }
};
