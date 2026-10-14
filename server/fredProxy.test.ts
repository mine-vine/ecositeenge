import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleFred } from './fredProxy.ts'

afterEach(() => vi.unstubAllGlobals())

describe('прокси FRED', () => {
  it('отклоняет неизвестные методы', async () => {
    const r = await handleFred(new URL('http://x/api/fred/category'), { FRED_API_KEY: 'k' })
    expect(r.status).toBe(404)
  })
  it('без ключа — 401', async () => {
    const r = await handleFred(new URL('http://x/api/fred/series?series_id=GDP'), {})
    expect(r.status).toBe(401)
  })
  it('подставляет серверный ключ и file_type=json', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"seriess":[]}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const r = await handleFred(new URL('http://x/api/fred/series/observations?series_id=GDP&api_key=user'), { FRED_API_KEY: 'server' })
    expect(r.status).toBe(200)
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe('*')
    const called = new URL(fetchMock.mock.calls[0][0] as string)
    expect(called.origin + called.pathname).toBe('https://api.stlouisfed.org/fred/series/observations')
    expect(called.searchParams.get('api_key')).toBe('server')
    expect(called.searchParams.get('file_type')).toBe('json')
  })
  it('без серверного ключа использует ключ пользователя', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'))
    vi.stubGlobal('fetch', fetchMock)
    await handleFred(new URL('http://x/api/fred/series?series_id=GDP&api_key=user'), {})
    expect(new URL(fetchMock.mock.calls[0][0] as string).searchParams.get('api_key')).toBe('user')
  })
})
