export default [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        chrome: "readonly",
        console: "readonly",
        document: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        Blob: "readonly",
        URL: "readonly",
        FileReader: "readonly",
        confirm: "readonly",
        alert: "readonly",
        escape: "readonly",
        encodeURIComponent: "readonly",
        decodeURIComponent: "readonly",
        isNaN: "readonly",
        isFinite: "readonly",
        parseInt: "readonly",
        parseFloat: "readonly",
        Array: "readonly",
        Object: "readonly",
        String: "readonly",
        Number: "readonly",
        Boolean: "readonly",
        Date: "readonly",
        JSON: "readonly",
        Math: "readonly",
        RegExp: "readonly",
        Error: "readonly",
        TypeError: "readonly",
        SyntaxError: "readonly"
      }
    },
    rules: {
      "eqeqeq": ["error", "always"],
      "semi": ["error", "always"],
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-console": "off",
      "no-undef": "off",
      "no-unreachable": "error",
      "no-duplicate-case": "error",
      "no-empty": "warn",
      "prefer-const": "warn",
      "no-var": "error"
    }
  }
];
