// Пример развёртывания прокси FRED как Cloudflare Worker.
//   npx wrangler deploy server/worker.ts --name econometr-fred
//   npx wrangler secret put FRED_API_KEY
// Затем соберите сайт с VITE_FRED_PROXY=https://econometr-fred.<account>.workers.dev/api/fred
import { handleFred, type FredEnv } from './fredProxy.ts'

export default {
  async fetch(request: Request, env: FredEnv): Promise<Response> {
    const url = new URL(request.url)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' } })
    }
    if (url.pathname.startsWith('/api/fred/')) return handleFred(url, env)
    return new Response('Not found', { status: 404 })
  },
}
