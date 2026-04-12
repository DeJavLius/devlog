// SSR 전용: /api/user/** → devlog-server /api/user/** 프록시
import type { APIRoute } from 'astro';

const API_URL = import.meta.env.API_URL ?? 'http://localhost:3000';

export const ALL: APIRoute = async ({ request, params }) => {
  const path = params.path ?? '';
  const url = new URL(request.url);
  const target = `${API_URL}/api/user/${path}${url.search}`;

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

  return new Response(upstream.body, {
    status: upstream.status,
    headers: new Headers(upstream.headers),
  });
};
