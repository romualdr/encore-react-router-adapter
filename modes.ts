import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import type { ServerBuild } from 'react-router'
import { loadConfigFromFile } from 'vite'
import type { ReactRouterOptions } from './types.js'
import {
  getConfigurationIssues,
  logger,
  readConfiguration,
  serveStatic,
  serveVite,
} from './utils.js'

const log = logger(['react-router'])

export const development = async (options: ReactRouterOptions = {}) => {
  const _vite = await import('vite')
  const _viteConfiguration = await loadConfigFromFile({
    command: 'serve',
    mode: 'development',
  })
  const vite = await _vite.createServer({
    ..._viteConfiguration?.config,
    customLogger: log.sublogger('vite'),
    server: {
      ...(_viteConfiguration?.config?.server ?? {}),
      middlewareMode: true,
    },
  })
  const warnings = await getConfigurationIssues(options)
  for (const warning of warnings) {
    log.warn(warning)
  }

  const build = () =>
    vite.ssrLoadModule(
      'virtual:react-router/server-build',
    ) as Promise<ServerBuild>
  const viteHandle = serveVite(vite)

  return [
    build,
    async (req: IncomingMessage, resp: ServerResponse<IncomingMessage>) =>
      viteHandle(req, resp),
  ] as const
}
export const production = async (options: ReactRouterOptions = {}) => {
  const buildDirectory =
    options.buildDirectory ??
    (await readConfiguration('production')).buildDirectory ??
    'build'
  const buildDir = join(process.cwd(), buildDirectory)
  const clientDir = join(buildDir, 'client')
  const serverBuildPath = join(buildDir, 'server', 'index.js')

  const _static = serveStatic(clientDir)
  const build = (await import(serverBuildPath)) as ServerBuild

  return [
    build,
    async (req: IncomingMessage, resp: ServerResponse<IncomingMessage>) =>
      _static(req, resp),
  ] as const
}
