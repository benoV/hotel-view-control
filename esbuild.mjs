import * as esbuild from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";

const watch = process.argv.includes("--watch");
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await cp("src/manifest.json", "dist/manifest.json");
await cp("src/styles", "dist/styles", { recursive: true });
await cp("src/icons", "dist/icons", { recursive: true });
await cp("src/popup/popup.html", "dist/popup.html");

const options = {
  entryPoints: ["src/background/background.ts", "src/content/content.ts", "src/popup/popup.ts"],
  bundle: true,
  outdir: "dist",
  format: "iife",
  target: "chrome120",
  sourcemap: true,
  logLevel: "info"
};

if (watch) {
  const context = await esbuild.context(options);
  await context.watch();
  console.log("Watching source files…");
} else {
  await esbuild.build(options);
}
