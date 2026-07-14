console.log("[startup][index.js] 1/3 entry file evaluating");

try {
  console.log("[startup][index.js] 2/3 requiring expo-router/entry");
  require("expo-router/entry");
  console.log("[startup][index.js] 3/3 expo-router/entry required successfully");
} catch (error) {
  console.error("[startup][index.js] FAILED requiring expo-router/entry", error);
  throw error;
}
