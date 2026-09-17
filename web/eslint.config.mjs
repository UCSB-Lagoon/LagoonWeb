import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

/**
 * `next lint` was removed in Next 15.5, so CI runs the ESLint CLI directly
 * (`npm run lint` → `eslint .`). eslint-config-next 15.5 still ships only
 * eslintrc-style configs, so FlatCompat translates them into flat config.
 * Drop FlatCompat once eslint-config-next exports a flat config of its own.
 */
const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const eslintConfig = [
  {
    // Build output and test artefacts — everything else in web/ is linted,
    // including scripts/, e2e/ and public/lagoon-cta.js.
    ignores: [
      ".next/**",
      "out/**",
      "next-env.d.ts",
      "playwright-report/**",
      "blob-report/**",
      "test-results/**",
      "playwright/.cache/**",
      ".lighthouseci/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
