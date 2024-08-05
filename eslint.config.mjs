import pluginJs from "@eslint/js";
import pluginJest from "eslint-plugin-jest";

export default [
  {
    ...pluginJs.configs.recommended,
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        module: "readonly",
        require: "readonly",
        __dirname: "readonly",
        Buffer: "readonly",
        setImmediate: "readonly",
        clearImmediate: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
      ecmaVersion: 2021,
      sourceType: "module",
    },
    plugins: {
      jest: pluginJest,
    },
    rules: {
      ...pluginJest.configs.recommended.rules,
    },
  },
];