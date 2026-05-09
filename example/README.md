# encore-react-router-adapter · example

A bare-bones React Router v7 app served by an Encore.ts service via [`encore-react-router-adapter`](../).

## Quick start

```bash
npx degit romualdr/encore-react-router-adapter/example my-app
cd my-app
npm pkg set dependencies.encore-react-router-adapter="^0.1.0"
npm install
encore run
```

> The example is wired to the local copy of the library (`"encore-react-router-adapter": "file:.."`) so it can run inside the lib's CI without a published version. The first command above swaps it back to a real semver — adjust the version to whatever's currently on npm.

Once `encore run` is up, open the printed URL — the index route is rendered server-side and a `getLoadContext` value is plumbed through to the loader.

## What's in here

```
example/
├── encore.app                 # Encore project descriptor
├── react-router.config.ts     # appDirectory + buildDirectory + ssr
├── vite.config.ts             # @react-router/dev/vite plugin
├── tsconfig.json
├── package.json
└── app/
    ├── encore.service.ts      # Encore service
    ├── app.ts                 # api.raw mount of reactRouter()
    └── src/
        ├── root.tsx           # RR root layout + ErrorBoundary
        ├── routes.ts          # route config
        └── routes/
            └── home.tsx       # single index route, reads loader context
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | `react-router dev` — Vite dev server (HMR), used alongside `encore run` |
| `npm run build` | `react-router build` — produces `app/.build/{server,client}` for prod |
| `npm run typecheck` | `react-router typegen && tsc --noEmit` |
| `encore run` | Boot the Encore service; auto-detects dev vs prod |
