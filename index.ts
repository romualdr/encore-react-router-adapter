import { createRequest, sendResponse } from '@mjackson/node-fetch-server'
import { appMeta } from 'encore.dev'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { finished } from 'node:stream/promises'
import { createRequestHandler } from 'react-router'
import { development, production } from './modes.js'
import type { ModeBuilder, ReactRouterOptions } from './types.js'
import { logger } from './utils.js'

export const reactRouter = (options: ReactRouterOptions = {}) => {
  const isDev =
    process.env.NODE_ENV === 'production'
      ? false
      : appMeta().environment.cloud === 'local'
  const mode = isDev ? 'development' : 'production'
  const log = logger(['react-router'])

  let build: ModeBuilder[0]
  let modeRequest: ModeBuilder[1]
  let handler: ReturnType<typeof createRequestHandler>

  const init = (async () => {
    const [_build, _modeRequest] = await (isDev
      ? development(options)
      : production(options))
    build = _build
    modeRequest = _modeRequest
    handler = createRequestHandler(build, mode)
    log.info(`Running on ${mode} mode`)
  })()

  return async (
    req: IncomingMessage,
    resp: ServerResponse<IncomingMessage>,
  ) => {
    await init
    if (await modeRequest(req, resp)) return

    const request = createRequest(req, resp)
    const loadContext = await options.getLoadContext?.(request)
    const response = await handler(request, loadContext)
    await sendResponse(resp, response)
    await finished(resp)
  }
}
