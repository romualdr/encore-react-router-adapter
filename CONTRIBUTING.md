# Contributing

Thanks for your interest in `encore-react-router-adapter`. This document covers everything you need to file a useful issue, open a pull request, and (for maintainers) cut a release.

## Table of Contents

- [Reporting issues](#reporting-issues)
- [Submitting changes](#submitting-changes)
- [Development setup](#development-setup)
- [Project layout](#project-layout)
- [Code style](#code-style)
- [Build, typecheck, verify](#build-typecheck-verify)
- [Releasing](#releasing)

## Reporting issues

Before opening an issue, please:

- Check existing issues to avoid duplicates.
- Make sure the problem reproduces against the latest published version.
- Include a minimal repro: an `encore.app` snippet, the relevant `react-router.config.ts`, the version of `encore.dev` / `react-router` / `vite`, and the exact steps and output. Stack traces are gold.

Bug reports without enough context to reproduce are unlikely to get a fix.

## Submitting changes

1. Fork the repo and create a feature branch off `main`.
2. Keep PRs focused — one logical change per PR. Refactors that aren't needed for the fix go in a separate PR.
3. Run the full verification suite locally before pushing:

   ```bash
   npm run typecheck
   npm run build
   npm pack --dry-run
   ```

4. Make sure the GitHub Actions [`CI`](.github/workflows/ci.yml) workflow is green on your PR.
5. Update the `README.md` if you change the public API or runtime behaviour.

## Development setup

Requirements:

- Node.js ≥ 20
- npm (any recent version)

```bash
git clone <your-fork>
cd encore-react-router-adapter
npm install --no-package-lock
npm run build
```

There are no tests yet — manual verification against a real Encore.ts app is the current QA path. PRs adding a test harness are welcome.

## Project layout

```
.
├── index.ts        # public entry — exports `reactRouter()`
├── modes.ts        # `development()` / `production()` mode bootstraps
├── utils.ts        # logger factory, config loader, static + Vite middleware adapters
├── types.ts        # shared types (`ReactRouterOptions`, `ModeBuilder`)
├── tsconfig.json   # build config (ESM, declaration + source maps to ./dist)
├── package.json
└── .github/workflows/
    ├── ci.yml      # build + typecheck on push / PR
    └── publish.yml # npm trusted publishing on release
```

The compiled output lands in `dist/` and is what gets shipped to npm via the `files` field in `package.json`.

## Code style

Follow the patterns already in the codebase. The library is intentionally small; consistency matters more than novelty.

**Module system & runtime**

- ESM only (`"type": "module"`).
- Target Node.js ≥ 20.
- Use the `node:` prefix for built-in imports: `import { join } from 'node:path'`.
- Use the global `fetch` and `Request`/`Response` types — do not pull in `node-fetch` or similar.
- Internal relative imports must use the `.js` extension even in `.ts` sources (e.g. `import { logger } from './utils.js'`). The `tsc` build preserves these so the emitted ESM resolves correctly under Node. Without the extension, `node` rejects the import at runtime.

**TypeScript**

- `strict: true`. Avoid `any`. Prefer the built-in utility types (`Record`, `Partial`, `Pick`, `Awaited`, etc.) over `as any` casts.
- Separate type-only imports: `import type { ServerBuild } from 'react-router'`.
- Define shared types in `types.ts`. Keep module-local types inline.

**Style**

- Arrow functions for module-level definitions: `export const reactRouter = (...) => { ... }`.
- `async`/`await`, not raw `.then()` chains. Wrap callback-style APIs (e.g. `vite.middlewares`) in `new Promise(...)` only at the boundary, as in [utils.ts](./utils.ts).
- Prefer `const`. Reserve `let` for genuinely reassigned bindings.
- No JSDoc or block comments. Add a single-line comment only when the _why_ is non-obvious (a workaround, an invariant, a constraint that isn't visible from the code).
- Naming: `camelCase` for values, `PascalCase` for types, `SCREAMING_SNAKE_CASE` only for true constants/env vars.

**Logging**

Use the `logger()` factory from [utils.ts](./utils.ts) — never call `console.*` directly:

```ts
const log = logger(["react-router"]);
log.info("something happened");
log.error(err, "something broke");
```

This routes through `encore.dev/log` so output is structured and shows up in Encore traces.

**Errors**

- Throw at boundaries (handler entry points, config loading) and let the rest of the stack let exceptions propagate.
- Do not add `try/catch` around code that can't actually fail or that has nothing meaningful to do with the error.

**Public API stability**

Anything exported from [index.ts](./index.ts) and [types.ts](./types.ts) is part of the public API. Renames or behaviour changes there require a minor (pre-1.0) or major (post-1.0) version bump and a note in the release.

## Build, typecheck, verify

```bash
npm run typecheck   # tsc --noEmit
npm run build       # tsc -> dist/
npm run clean       # rm -rf dist
npm pack --dry-run  # show the exact files that would be published
```

The compiled output must be reproducible from sources alone — never edit files in `dist/` by hand.

## Releasing

Maintainers only. The package is published to npm via GitHub Actions using [npm trusted publishing (OIDC)](https://docs.npmjs.com/trusted-publishers/) — no `NPM_TOKEN` secret is stored in the repo, and provenance attestations are generated automatically.

**Cutting a release:**

```bash
# 1. bump the version in package.json, commit
npm version patch    # or minor / major
git push && git push --tags

# 2. publish a GitHub release for the new tag
gh release create v$(node -p "require('./package.json').version") --generate-notes
```

The [`Publish to npm`](.github/workflows/publish.yml) workflow runs on the published release, verifies the tag matches `package.json`, builds, and publishes with provenance. A manual `workflow_dispatch` run is also available for re-publishing under a different `dist-tag` (e.g. `next`).
