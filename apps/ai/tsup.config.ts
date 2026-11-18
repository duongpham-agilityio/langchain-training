import { defineConfig } from "tsup";

export default defineConfig({
  // The contracts package ships TypeScript source (no build step), so it must be
  // inlined; `dependencies` are otherwise left external by tsup.
  // Vercel ships only the build output (no node_modules), so every dependency is inlined too.
  noExternal: [/.*/],
  // Some inlined CommonJS dependencies call `require`, which does not exist in an ESM file.
  banner: {
    js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
  },
  // `.mjs` so Node reads the output as ESM even when it is deployed without this
  // package.json (Vercel's function bundle has no `"type": "module"`).
  outExtension: () => ({ js: ".mjs" }),
});
