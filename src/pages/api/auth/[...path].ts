// SSR 전용: /api/auth/** → devlog-server /api/auth/** 프록시
// better-auth 세션 확인 등 서버사이드 인증 요청에 활용
import type { APIRoute } from 'astro';

const API_URL = import.meta.env.API_URL ?? 'http://localhost:3000';

export const ALL: APIRoute = async ({ request, params }) => {
  const path = params.path ?? '';
  const url = new URL(request.url);
  const target = `${API_URL}/api/auth/${path}${url.search}`;

  const headers = new Headers(request.headers);

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body:
      request.method !== 'GET' && request.method !== 'HEAD'
        ? request.body
        : undefined,
    // @ts-expect-error Node.js fetch duplex
    duplex: 'half',
  });

  const responseHeaders = new Headers(upstream.headers);

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
};
