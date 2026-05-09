import type { Route } from './+types/home'

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'encore-react-router-adapter example' },
    {
      name: 'description',
      content: 'Bare-bones React Router v7 app served by Encore.ts',
    },
  ]
}

export function loader({ context }: Route.LoaderArgs) {
  return { greeting: context.greeting }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>{loaderData.greeting}</h1>
      <p>
        This page was rendered server-side by{' '}
        <code>encore-react-router-adapter</code> running inside an Encore.ts service.
      </p>
      <p>
        Edit <code>app/src/routes/home.tsx</code> and reload — HMR is on in dev.
      </p>
    </main>
  )
}
