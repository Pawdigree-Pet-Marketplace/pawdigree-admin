import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest, unwrapList } from '../services/api'
import { adminLogin } from '../services/adminAuthService'

describe('apiRequest', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('constructs the API URL, sends JSON and bearer auth, and parses a response', async () => {
    localStorage.setItem('access', 'test-token')
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    await expect(apiRequest('/categories/', { method: 'POST', body: JSON.stringify({ name: 'Dogs' }) })).resolves.toEqual({ ok: true })

    expect(fetch).toHaveBeenCalledOnce()
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toBe('https://pawdigree-bckd.onrender.com/api/categories/')
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer test-token')
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json')
  })

  it('supports accessToken and paths without a leading slash', async () => {
    localStorage.setItem('accessToken', 'fallback-token')
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }))

    await apiRequest('categories/')

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toBe('https://pawdigree-bckd.onrender.com/api/categories/')
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer fallback-token')
  })

  it('normalizes a configured API URL that already includes the /api prefix', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/api///')
    vi.resetModules()
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }))

    const { apiRequest: configuredApiRequest } = await import('../services/api')
    await configuredApiRequest('/categories/')

    expect(String(vi.mocked(fetch).mock.calls[0][0])).toBe('https://api.example.test/api/categories/')
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('sends the admin login request to the Django auth route through the shared helper', async () => {
    localStorage.setItem('access', 'stale-refresh-or-invalid-token')
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ access: 'access-token', refresh: 'refresh-token' }), { status: 200 }))

    await expect(adminLogin(' admin@example.test ', 'password')).resolves.toEqual({ access: 'access-token', refresh: 'refresh-token' })

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toBe('https://pawdigree-bckd.onrender.com/api/auth/login/admin/')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({ email: 'admin@example.test', password: 'password' })
    expect(new Headers(init?.headers).has('Authorization')).toBe(false)
  })

  it('returns undefined for 204 and extracts server error messages', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }))
    await expect(apiRequest('/categories/1/')).resolves.toBeUndefined()

    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ detail: 'Not allowed' }), { status: 403 }))
    await expect(apiRequest('/categories/')).rejects.toMatchObject({ name: 'ApiError', message: 'Not allowed', status: 403 })
  })

  it('wraps network failures and unwraps common list payloads', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('offline'))
    await expect(apiRequest('/categories/')).rejects.toEqual(expect.objectContaining({ name: 'ApiError', status: 0 }))
    expect(unwrapList({ results: [1, 2] })).toEqual([1, 2])
    expect(unwrapList('invalid')).toEqual([])
    expect(new ApiError('bad', 400).status).toBe(400)
  })
})
