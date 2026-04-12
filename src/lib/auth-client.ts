import { createAuthClient } from 'better-auth/client';

// 브라우저: API 서버 직접 호출 (CORS 허용 + crossSubDomainCookies 공유)
export const authClient = createAuthClient({
  baseURL: import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000',
});
