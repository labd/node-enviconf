---
"@labdigital/enviconf": minor
---

Publish as ESM-only. The CommonJS (`dist/index.cjs`) and IIFE (`dist/index.global.js`) builds are removed; the package now ships `dist/index.js` + `dist/index.d.ts` and `exports` has `types` and `default` conditions. This also fixes the package entry points: `main` pointed to a non-existent `index.js` in the package root and the type declarations were missing from `exports`. CommonJS consumers on Node.js >= 22.12 can still `require()` the package.
