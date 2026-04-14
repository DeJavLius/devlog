import React from 'react';
import WithdrawModal from '@/components/Auth/WithdrawModal';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import type { SessionUser } from '@/components/Auth/hooks/useSession';
import { ProviderIcon } from '@/components/Auth/ProviderIcon';

interface UserMenuProps {
  user: SessionUser;
  onLogout: () => void;
}

const API = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000';

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
          className="text-foreground/60 hover:text-foreground/80 max-w-[8rem] truncate text-sm font-medium transition-colors"
        >
          {truncated}
        </button>

        {/* 카드 팝업 */}
        {open && (
          <div className="bg-background absolute top-full right-0 z-50 mt-2 w-64 rounded-xl border p-4 shadow-lg">
            {/* 닫기 버튼 */}
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground absolute top-2 right-2 p-1 transition-colors"
              aria-label="닫기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* 프로필 영역 */}
            <div className="mb-4 flex items-center gap-3">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="ring-muted size-12 shrink-0 rounded-full object-cover ring-2"
                />
              ) : (
                <div className="bg-muted ring-muted flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-2">
                  {(user.name || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <ProviderIcon provider={provider} />
                  <p className="text-muted-foreground truncate text-xs">
                    {!user.email || user.email.endsWith('@placeholder.local')
                      ? provider === 'kakao'
                        ? '카카오 계정'
                        : provider === 'naver'
                          ? '네이버 계정'
                          : 'SSO 계정'
                      : user.email}
                  </p>
                </div>
                <p className="mt-0.5 truncate text-sm font-medium">
                  별명: {user.nickname || user.name || '…'}
                </p>
              </div>
            </div>

            {/* 액션 버튼 — 색상 구분 */}
            <div className="flex gap-2">
              <Button
                asChild
                size="sm"
                className="flex-1 border bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
                onClick={() => setOpen(false)}
              >
                <a href="/mypage">내 정보</a>
              </Button>
              <Button
                size="sm"
                className="flex-1 border border-yellow-200 bg-yellow-100 text-xs text-yellow-800 hover:bg-yellow-200"
                onClick={handleLogout}
              >
                로그아웃
              </Button>
              <Button
                size="sm"
                className="flex-1 border border-red-200 bg-red-100 text-xs text-red-700 hover:bg-red-200"
                onClick={() => {
                  setOpen(false)
                  setWithdrawOpen(true)
                }}
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
  )
}
