export const prerender = false

import type { APIRoute } from 'astro'

// 서버 사이드: Docker 내부 네트워크 또는 환경변수로 지정
const DEVLOG_SERVER_URL =
  import.meta.env.DEVLOG_SERVER_URL ?? 'http://devlog-server:3000'

export const GET: APIRoute = async ({ url }) => {
  const params = url.searchParams.toString()

  try {
    const res = await fetch(`${DEVLOG_SERVER_URL}/api/search?${params}`)

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Search failed' }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
