export default {
  entry: ["src/index.ts"],
  clean: true,
  splitting: false,
  dts: true,
  sourcemap: true,
	target: "es2022",
  format: ["cjs", "esm", "iife"],
  outDir: "dist",
};

