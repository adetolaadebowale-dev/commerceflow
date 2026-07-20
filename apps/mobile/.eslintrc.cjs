module.exports = {
  root: true,
  extends: [require.resolve("@commerceflow/config/eslint/base")],
  ignorePatterns: [
    "node_modules/",
    ".expo/",
    "android/",
    "ios/",
    "dist/",
    "*.config.js",
    "babel.config.js",
    "metro.config.js",
    "tailwind.config.js",
    "vitest.config.ts",
  ],
};
