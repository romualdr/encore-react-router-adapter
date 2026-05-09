import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import type { ServerBuild } from 'react-router'
import { loadConfigFromFile } from 'vite'
import { logger, readConfiguration, serveStatic, serveVite } from './utils.js'

const log = logger(['react-router'])

export const development = async () => {
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
export const production = async () => {
  const config = await readConfiguration()
  const buildDir = join(process.cwd(), config.buildDirectory ?? 'build')
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
