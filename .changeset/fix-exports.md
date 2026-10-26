---
"@labdigital/enviconf": patch
---

Fix the package entry points: `main` now points to the CommonJS build in `dist/` and the `exports` map includes the type declarations for both `import` and `require`.
