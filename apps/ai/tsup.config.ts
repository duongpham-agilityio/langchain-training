import { defineConfig } from "tsup";

export default defineConfig({
  // The contracts package ships TypeScript source (no build step), so it must be
  // inlined; `dependencies` are otherwise left external by tsup.
  noExternal: ["@training/contracts"],
});
