// Прокси к FRED API. Нужен по двум причинам: FRED не отдаёт CORS-заголовки
// (браузер не может обращаться к нему напрямую), а API-ключ лучше хранить на сервере.
//
// Обработчик написан на стандартных Request/Response, поэтому работает
// в dev-сервере Vite (см. vite.config.ts), в Cloudflare Workers (server/worker.ts)
// и в любой среде с Web Fetch API (Deno, Bun, Node 18+).

const FRED_BASE = 'https://api.stlouisfed.org/fred/'

/** Разрешённые методы FRED API — прокси не должен быть открытым ретранслятором */
const ALLOWED = new Set(['series', 'series/search', 'series/observations'])

export interface FredEnv {
  FRED_API_KEY?: string
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS } })
}

/**
 * Обрабатывает запрос вида /api/fred/<метод>?<параметры>.
 * Ключ берётся из окружения (FRED_API_KEY); если его нет — из параметра api_key запроса
 * (ключ, который пользователь ввёл в интерфейсе).
 */
export async function handleFred(url: URL, env: FredEnv, prefix = '/api/fred/'): Promise<Response> {
  const method = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length).replace(/\/+$/, '') : ''
  if (!ALLOWED.has(method)) return json(404, { error_code: 404, error_message: `Метод FRED «${method}» не поддерживается прокси.` })

  const params = new URLSearchParams(url.searchParams)
  params.set('file_type', 'json')
  const key = env.FRED_API_KEY || params.get('api_key')
  if (!key) return json(401, { error_code: 401, error_message: 'Не задан API-ключ FRED.' })
  params.set('api_key', key)

  let upstream: Response
  try {
    upstream = await fetch(`${FRED_BASE}${method}?${params}`)
  } catch {
    return json(502, { error_code: 502, error_message: 'FRED API недоступен.' })
  }
  const body = await upstream.text()
  return new Response(body, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600', ...CORS },
  })
}
