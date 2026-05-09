import { renderToReadableStream } from 'react-dom/server'
import type { AppLoadContext, EntryContext } from 'react-router'
import { ServerRouter } from 'react-router'

export const streamTimeout = 5_000

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  entryContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  let status = responseStatusCode
  const stream = await renderToReadableStream(
    <ServerRouter context={entryContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error) {
        if (!request.signal.aborted) console.error(error)
        status = 500
      },
    },
  )

  responseHeaders.set('Content-Type', 'text/html')
  return new Response(stream, { headers: responseHeaders, status })
}
