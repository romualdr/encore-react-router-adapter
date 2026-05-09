# encore-react-router-adapter

Serve a [React Router v7](https://reactrouter.com/) app with Encore.dev

> [!WARNING]
> **Early work-in-progress — not production-tested.** The API surface, internals, and runtime behaviour can change at any time before `1.0`. This package has not yet been validated under real production load. Use it for prototypes, side projects, and feedback — pin the exact version, expect breaking changes between minors, and don't deploy it to anything you care about. Bug reports and PRs welcome (see [CONTRIBUTING.md](./CONTRIBUTING.md)).

- **Development**: Vite middleware mode with full HMR
- **Production**: Compiled SSR build served alongside static assets (gzip + brotli + etag via [`sirv`](https://github.com/lukeed/sirv))
- Mode is auto-selected based on `NODE_ENV` and Encore's environment metadata

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [How it works](#how-it-works)
- [Requirements](#requirements)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Scaffold a new app

The fastest way to start is to copy the bundled [`example/`](./example) — a working Encore.ts + React Router v7 app — into a new directory:

```bash
npx degit romualdr/encore-react-router-adapter/example my-app
cd my-app
npm pkg set dependencies.encore-react-router-adapter="^0.1.0"
npm install
encore run
```

### Add to an existing Encore.ts app

```bash
npm install encore-react-router-adapter
# peers
npm install encore.dev react-router react react-dom
# only required for dev / build
npm install -D vite @react-router/dev
```

## Usage

Mount the handler from a raw Encore endpoint:

```ts
// app/encore.service.ts
import { api } from 'encore.dev/api'
import { reactRouter } from 'encore-react-router-adapter'

const handler = reactRouter({
  // optional: provide a load context to React Router
  getLoadContext: async (request) => ({
    user: await getUserFromRequest(request),
  }),
})

// `/!path` is a fallback route — the leading `!` lets Encore route
// anything not claimed by another endpoint here (Encore disallows two
// endpoints on the same path). `method: '*'` catches every HTTP verb.
export const ssr = api.raw(
  { expose: true, path: '/!path', method: '*' },
  handler,
)
```

A typical project layout:

```
my-app/
├── app/                       # React Router app
│   ├── src/
│   │   ├── root.tsx
│   │   ├── routes.ts
│   │   └── routes/
│   ├── encore.service.ts      # mounts `reactRouter()` as a raw API
├── react-router.config.ts
├── vite.config.ts
└── package.json
```

In development, run `encore run` and `react-router dev` side by side; in production, run `react-router build` first so the compiled `build/server/index.js` and `build/client/` exist before the Encore container boots.

## Options

| Option           | Type                                                              | Description                                                                    |
| ---------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `getLoadContext` | `(request: Request) => AppLoadContext \| Promise<AppLoadContext>` | Build a per-request load context that React Router exposes to loaders/actions. |

## How it works

`reactRouter()` returns an async `(req, resp)` handler suitable for `api.raw`. On first call it lazily resolves the runtime mode:

- **dev** — boots a Vite dev server in middleware mode, loads the React Router server build via `virtual:react-router/server-build`, and passes unmatched requests through Vite's middleware (handles HMR, source assets, etc.).
- **prod** — reads the React Router config to find `buildDirectory`, imports the pre-built server bundle, and serves `build/client/` statically.

In both modes, requests that don't match a static or Vite asset fall through to `createRequestHandler` from `react-router`.

## Requirements

- Node.js ≥ 20
- `encore.dev` ≥ 1.57
- `react-router` ^7

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, code style, and the release process.

## License

MIT
