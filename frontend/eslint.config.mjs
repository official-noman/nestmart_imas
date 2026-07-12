import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Part of the React Compiler-readiness rule set. This app doesn't use
      // the Compiler, and the standard "fetch on mount" effect pattern
      // (useEffect(() => { fetchData() }, [])) used throughout the
      // dashboard hooks trips it even though the fetch is async and safe.
      // Downgraded to a warning instead of rewriting every data-fetching
      // hook to a different pattern purely to satisfy this rule.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
