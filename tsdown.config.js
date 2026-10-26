import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
	clean: true,
	dts: true,
	sourcemap: true,
	target: "es2022",
	format: ["cjs", "esm", "iife"],
	outDir: "dist",
	fixedExtension: false,
	hash: false,
	globalName: "enviconf",
	// keep the file name tsup used for the IIFE bundle
	outputOptions: (options, format) =>
		format === "iife" ? { ...options, entryFileNames: "[name].global.js" } : options,
});
