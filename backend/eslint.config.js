const js = require('@eslint/js');
const prettier = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
    js.configs.recommended,
    prettierConfig,
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: {
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                console: 'readonly',
                Buffer: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
            },
        },
        plugins: {
            prettier,
        },
        rules: {
            'prettier/prettier': 'error',
            'no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
            'no-console': [
                'warn',
                {
                    allow: ['warn', 'error', 'info'],
                },
            ],
            'no-undef': 'error',
            'no-var': 'error',
            'prefer-const': 'error',
            eqeqeq: ['error', 'always'],
            curly: ['error', 'all'],
            'no-multiple-empty-lines': [
                'error',
                {
                    max: 1,
                    maxEOF: 0,
                },
            ],
            'no-trailing-spaces': 'error',
            semi: ['error', 'always'],
            quotes: ['error', 'single', { avoidEscape: true }],
        },
    },
    {
        ignores: ['node_modules/**'],
    },
];
