import { createSolidTransformPlugin } from "@opentui/solid/bun-plugin";
import { $ } from "bun";

const outdir = "./dist";

// Clean dist
await $`rm -rf ${outdir}`;

// Build JS with Solid JSX transform
const result = await Bun.build({
    entrypoints: ["./src/lib.tsx"],
    outdir,
    target: "bun",
    format: "esm",
    splitting: false,
    plugins: [createSolidTransformPlugin()],
    external: [
        // native/bun internals — never bundle these
        "bun:ffi",
        "bun",
        // opaque deps — consumers install these via our package.json dependencies
        "@opentui/core",
        "@opentui/core-*",
        "@opentui/solid",
        "opentui-spinner",
        "opentui-spinner/*",
        "solid-js",
        "solid-js/*",
    ],
});

if (!result.success) {
    console.error("Build failed:");
    for (const message of result.logs) {
        console.error(message);
    }
    process.exit(1);
}

console.log("JS build complete.");

// Generate .d.ts declarations via tsc
const tsc = await $`bunx tsc --project tsconfig.build.json`.quiet();
if (tsc.exitCode !== 0) {
    console.error("Declaration generation failed:");
    console.error(tsc.stderr.toString());
    process.exit(1);
}

console.log("Type declarations generated.");
console.log("Build complete → dist/");
