import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Resume & cover-letter templates are a library of pure presentational
  // components rendered both in-app and by the standalone PDF microservice.
  // Two default rules are wrong for this context:
  //  - react-hooks/static-components: the local NumSec/MiniLabel/icon helpers are
  //    STATELESS render pieces (no state to reset), an accepted template pattern.
  //  - @next/next/no-img-element: photos MUST use plain <img> — the PDF service
  //    renders raw HTML and has no Next image optimizer; next/image would break
  //    the export. Real-bug rules (unused vars, etc.) stay on.
  {
    files: [
      "components/resume/templates/**/*.tsx",
      "components/cover-letter/templates/**/*.tsx",
    ],
    rules: {
      "react-hooks/static-components": "off",
      "@next/next/no-img-element": "off",
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
