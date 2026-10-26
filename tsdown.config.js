import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
	clean: true,
	dts: true,
	sourcemap: true,
	target: "es2022",
	format: ["esm"],
	outDir: "dist",
	fixedExtension: false,
	hash: false,
});
