import React from 'react';
import WithdrawModal from '@/components/Auth/WithdrawModal';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import type { SessionUser } from '@/components/Auth/hooks/useSession';

interface UserMenuProps {
  user: SessionUser;
  onLogout: () => void;
}

const API = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000';

/* ── 프로바이더 아이콘 (14×14 인라인 SVG) ── */
const ProviderIcon = ({ provider }: { provider: string | null }) => {
  switch (provider) {
    case 'google':
      return (
        <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      );
    case 'github':
      return (
        <svg viewBox="0 0 24 24" className="size-3.5 shrink-0 fill-current" aria-hidden="true">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      );
    case 'kakao':
      return (
        <svg viewBox="0 0 24 24" className="size-3.5 shrink-0 fill-[#3C1E1E]" aria-hidden="true">
          <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.73 1.6 5.14 4.02 6.58L4.9 21l4.36-2.28c.88.17 1.8.28 2.74.28 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"/>
        </svg>
      );
    case 'naver':
      return (
        <svg viewBox="0 0 24 24" className="size-3.5 shrink-0 fill-[#03c75a]" aria-hidden="true">
          <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
        </svg>
      );
    default:
      return <div className="size-3.5 shrink-0 rounded-sm bg-muted" />;
  }
};

export default function UserMenu({ user, onLogout }: UserMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [withdrawOpen, setWithdrawOpen] = React.useState(false);
  const [provider, setProvider] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);

  const displayName =
    user.nickname || user.name || user.email?.split('@')[0] || '…';
  const truncated =
    displayName.length > 10 ? displayName.slice(0, 10) + '…' : displayName;

  // 프로바이더 정보 가져오기
  React.useEffect(() => {
    fetch(`${API}/api/user/me`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setProvider(d.provider ?? null))
      .catch(() => {});
  }, []);

  // 외부 클릭 닫기
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleLogout = async () => {
    await authClient.signOut();
    setOpen(false);
    onLogout();
  };

  const handleWithdraw = async () => {
    await fetch(`${API}/api/user/me`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await authClient.signOut();
    setWithdrawOpen(false);
    setOpen(false);
    onLogout();
  };

  return (
    <>
      <div className="relative" ref={ref}>
        {/* 헤더 트리거 버튼 */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-sm font-medium text-foreground/60 hover:text-foreground/80 transition-colors max-w-[8rem] truncate"
        >
          {truncated}
        </button>

        {/* 카드 팝업 */}
        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border bg-background p-4 shadow-lg">
            {/* 닫기 버튼 */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="닫기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* 프로필 영역 */}
            <div className="flex items-center gap-3 mb-4">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="size-12 rounded-full object-cover shrink-0 ring-2 ring-muted"
                />
              ) : (
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold ring-2 ring-muted">
                  {(user.name || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <ProviderIcon provider={provider} />
                  <p className="truncate text-xs text-muted-foreground">
                    {!user.email || user.email.endsWith('@placeholder.local')
                      ? (provider === 'kakao' ? '카카오 계정' : provider === 'naver' ? '네이버 계정' : 'SSO 계정')
                      : user.email}
                  </p>
                </div>
                <p className="truncate text-sm font-medium mt-0.5">
                  별명: {user.nickname || user.name || '…'}
                </p>
              </div>
            </div>

            {/* 액션 버튼 — 색상 구분 */}
            <div className="flex gap-2">
              <Button
                asChild
                size="sm"
                className="flex-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 border-red-200 border"
                onClick={() => setOpen(false)}
              >
                <a href="/mypage">내 정보</a>
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200 border"
                onClick={handleLogout}
              >
                로그아웃
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 border"
                onClick={() => { setOpen(false); setWithdrawOpen(true); }}
              >
                가입 탈퇴
              </Button>
            </div>
          </div>
        )}
      </div>

      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onConfirm={handleWithdraw}
      />
    </>
  );
}
