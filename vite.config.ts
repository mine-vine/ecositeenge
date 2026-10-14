import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { handleFred } from './server/fredProxy.ts'

/** Подключает прокси FRED (/api/fred/*) к dev- и preview-серверу Vite */
function fredProxy(): Plugin {
  let apiKey: string | undefined
  const middleware = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/fred/')) return next()
    const response = await handleFred(new URL(req.url, 'http://localhost'), { FRED_API_KEY: apiKey })
    res.statusCode = response.status
    response.headers.forEach((value, key) => res.setHeader(key, value))
    res.end(await response.text())
  }
  return {
    name: 'fred-proxy',
    configResolved(config) {
      // FRED_API_KEY без префикса VITE_ — не попадает в клиентский бандл
      apiKey = loadEnv(config.mode, process.cwd(), '').FRED_API_KEY
    },
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), fredProxy()],
})
