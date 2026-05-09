import type { Config as ReactRouterConfig } from '@react-router/dev/config'
import log from 'encore.dev/log'
import { existsSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import sirv from 'sirv'
import type { Logger, ViteDevServer } from 'vite'

export const logger = (namespace: string[]) => {
  const name = namespace.join('.')
  const warned = new Set<string>()
  const _logger: Logger & {
    sublogger: (namespace: string) => ReturnType<typeof logger>
  } = {
    hasWarned: false,
    info: (msg) => log.info(`[${name}] ${msg}`),
    warn: (msg) => {
      _logger.hasWarned = true
      log.warn(`[${name}] ${msg}`)
    },
    warnOnce: (msg) => {
      if (warned.has(msg)) return
      warned.add(msg)
      _logger.hasWarned = true
      log.warn(`[${name}] ${msg}`)
    },
    error: (msg, opts) => {
      if (opts?.error) log.error(opts.error, `[${name}] ${msg}`)
      else log.error(`[${name}] ${msg}`)
    },
    clearScreen: () => {},
    hasErrorLogged: () => false,
    sublogger: (name) => {
      return logger([...namespace, name])
    },
  }
  return _logger
}

export const readConfiguration = async (): Promise<
  Partial<ReactRouterConfig>
> => {
  for (const ext of ['js', 'mjs']) {
    const p = join(process.cwd(), `react-router.config.${ext}`)
    if (existsSync(p))
      return (await import(pathToFileURL(p).href)).default ?? {}
  }
  return {}
}

export const serveStatic = (dir: string) => {
  const handler = sirv(dir, { etag: true, gzip: true, brotli: true })
  return (req: IncomingMessage, resp: ServerResponse): Promise<boolean> =>
    new Promise((resolve, reject) => {
      const onFinish = () => resolve(true)
      resp.once('finish', onFinish)
      resp.once('error', reject)
      handler(req, resp, () => {
        resp.off('finish', onFinish)
        resolve(false)
      })
    })
}

export const serveVite =
  (vite: ViteDevServer) =>
  (req: IncomingMessage, resp: ServerResponse): Promise<boolean> =>
    new Promise((resolve, reject) => {
      const onFinish = () => resolve(true)
      resp.once('finish', onFinish)
      vite.middlewares(req, resp, (err?: unknown) => {
        resp.off('finish', onFinish)
        err && log.error(err)
        if (err) reject(err instanceof Error ? err : new Error(String(err)))
        else resolve(false)
      })
    })
