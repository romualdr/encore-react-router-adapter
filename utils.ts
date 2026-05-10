import type { Config as ReactRouterConfig } from '@react-router/dev/config'
import log from 'encore.dev/log'
import { existsSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import sirv from 'sirv'
import { type Logger, type ViteDevServer } from 'vite'
import { ReactRouterOptions } from './types'

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

export const readConfiguration = async (
  mode?: 'production',
): Promise<Partial<ReactRouterConfig & { path: string }>> => {
  const exts = ['js', 'mjs']
  let loader = async (p: string) => {
    return {
      path: p,
      ...((await import(pathToFileURL(p).href)).default ?? {}),
    }
  }

  if (mode !== 'production') {
    // we allow .ts file in development as vite can load .ts
    const { loadConfigFromFile } = await import('vite')
    exts.unshift(...['ts', 'mts'])
    loader = async (p: string) => {
      return {
        path: p,
        ...(((
          await loadConfigFromFile({ command: 'serve', mode: 'development' }, p)
        )?.config as Partial<ReactRouterConfig>) ?? {}),
      }
    }
  }

  for (const ext of exts) {
    const p = join(process.cwd(), `react-router.config.${ext}`)
    if (existsSync(p)) return loader(p)
  }
  return {}
}

export const getConfigurationIssues = async (options: ReactRouterOptions) => {
  const c = await readConfiguration()
  const warnings: string[] = []
  if (c.buildDirectory && !options.buildDirectory && c.path?.endsWith('ts'))
    warnings.push(
      ...[
        `react-router.config has buildDirectory="${c.buildDirectory}" but reactRouter()`,
        'was called without an explicit buildDirectory option. Production will not see',
        'this value (.ts configs are not read at runtime) and will fall back to "build".',
        `Pass { buildDirectory: "${c.buildDirectory}" } to reactRouter() or change your`,
        `file to .js or .mjs file to keep dev and prod in sync`,
      ],
    )
  return warnings
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
