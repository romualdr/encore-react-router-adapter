import { reactRouter } from 'encore-react-router-adapter'
import { api } from 'encore.dev/api'
import configuration from '../react-router.config'

const getLoadContext = () => ({
  greeting: 'Hello from Encore.ts',
})

declare module 'react-router' {
  interface AppLoadContext extends Awaited<ReturnType<typeof getLoadContext>> {}
}

export const app = api.raw(
  { expose: true, path: '/!path', method: '*' },
  reactRouter({ getLoadContext, buildDirectory: configuration.buildDirectory }),
)
