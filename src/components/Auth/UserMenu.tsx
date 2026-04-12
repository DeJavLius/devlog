import React from 'react';
import WithdrawModal from '@/components/Auth/WithdrawModal';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import type { SessionUser } from '@/components/Auth/hooks/useSession';

interface UserMenuProps {
  user: SessionUser;
  onLogout: () => void;
}

export default function UserMenu({ user, onLogout }: UserMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [withdrawOpen, setWithdrawOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const displayName =
    user.nickname || user.name || user.email?.split('@')[0] || '…';
  const truncated =
    displayName.length > 10 ? displayName.slice(0, 10) + '…' : displayName;

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
    await fetch(`${import.meta.env.PUBLIC_API_URL}/api/user/me`, {
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
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border bg-background p-4 shadow-lg">
            {/* 프로필 영역 */}
            <div className="flex items-center gap-3 mb-4">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="size-10 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                  {(user.name || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">
                  {user.email ?? '카카오 계정'}
                </p>
                <p className="truncate text-sm font-medium">
                  별명: {user.nickname || user.name || '…'}
                </p>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => setOpen(false)}
              >
                <a href="/mypage">내 정보</a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={handleLogout}
              >
                로그아웃
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs text-destructive hover:text-destructive"
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
