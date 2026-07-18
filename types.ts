import type { createRequestHandler } from 'react-router'
import type { development, production } from './modes.js'

// React Router's server load-context type is `AppLoadContext` on v7 but
// `RouterContextProvider` on v8 (middleware is always enabled). Derive it from
// `createRequestHandler` so this option tracks whichever major is installed,
// rather than importing a name that only exists in one of them.
type LoadContext = NonNullable<
  Parameters<ReturnType<typeof createRequestHandler>>[1]
>

export type ReactRouterOptions = {
  // Output dir of the React Router production build, relative to cwd.
  // Falls back to react-router.config.{js,mjs}.buildDirectory at runtime,
  // then to "build". `.ts` configs are not read in production — pass this
  // option explicitly when your config lives in a .ts file.
  buildDirectory?: string
  getLoadContext?: (request: Request) => LoadContext | Promise<LoadContext>
}

export type ModeBuilder = Awaited<
  ReturnType<typeof development | typeof production>
>
