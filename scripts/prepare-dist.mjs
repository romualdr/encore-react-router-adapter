// Generates dist/package.json for publishing.
//
// The committed root package.json keeps main/exports pointing at ./index.ts so
// `bun link` consumers get the raw TS source in dev. npm/bun do NOT apply
// publishConfig field overrides (that's a pnpm/yarn feature), so instead we
// publish ./dist as a self-contained package whose manifest points at the
// compiled output. The root manifest is never mutated.

import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");

if (!existsSync(join(dist, "index.js"))) {
  throw new Error("dist/index.js missing — run `bun run build` first");
}

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

// undefined values are dropped by JSON.stringify, so optional fields are safe.
const published = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  type: pkg.type,
  repository: pkg.repository,
  bugs: pkg.bugs,
  homepage: pkg.homepage,
  keywords: pkg.keywords,
  license: pkg.license,
  engines: pkg.engines,
  main: "./index.js",
  types: "./index.d.ts",
  exports: {
    ".": {
      types: "./index.d.ts",
      import: "./index.js",
    },
  },
  peerDependencies: pkg.peerDependencies,
  peerDependenciesMeta: pkg.peerDependenciesMeta,
  dependencies: pkg.dependencies,
};

writeFileSync(join(dist, "package.json"), JSON.stringify(published, null, 2) + "\n");
for (const file of ["README.md", "LICENSE"]) {
  copyFileSync(join(root, file), join(dist, file));
}

console.log(`prepared dist/ for publish: ${published.name}@${published.version}`);
