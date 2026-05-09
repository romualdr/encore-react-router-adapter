import type { AppLoadContext } from 'react-router'
import type { development, production } from './modes.js'

export type ReactRouterOptions = {
  getLoadContext?: (
    request: Request,
  ) => AppLoadContext | Promise<AppLoadContext>
}

export type ModeBuilder = Awaited<
  ReturnType<typeof development | typeof production>
>
