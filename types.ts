import type { AppLoadContext } from 'react-router'
import type { development, production } from './modes.js'

export type ReactRouterOptions = {
  // Output dir of the React Router production build, relative to cwd.
  // Falls back to react-router.config.{js,mjs}.buildDirectory at runtime,
  // then to "build". `.ts` configs are not read in production — pass this
  // option explicitly when your config lives in a .ts file.
  buildDirectory?: string
  getLoadContext?: (
    request: Request,
  ) => AppLoadContext | Promise<AppLoadContext>
}

export type ModeBuilder = Awaited<
  ReturnType<typeof development | typeof production>
>
