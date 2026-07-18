module.exports = {
  root: true,
  extends: [
    require.resolve("@commerceflow/config/eslint/base"),
    "next/core-web-vitals",
  ],
  ignorePatterns: [
    "dist/",
    ".next/",
    "node_modules/",
    "coverage/",
    "next-env.d.ts",
  ],
};
