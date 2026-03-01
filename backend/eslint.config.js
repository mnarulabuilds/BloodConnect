const {
    defineConfig,
} = require("eslint/config");

const globals = require("globals");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    languageOptions: {
        globals: {
            ...globals.node,
            ...globals.jest,
        },

        ecmaVersion: "latest",
        parserOptions: {},
    },

    extends: compat.extends("eslint:recommended", "prettier"),

    rules: {
        "no-unused-vars": ["warn", {
            argsIgnorePattern: "^(next|req|res)$",
        }],

        "no-console": "warn",
    },
}]);
