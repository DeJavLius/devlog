import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import WithdrawModal from '@/components/Auth/WithdrawModal';
import { authClient } from '@/lib/auth-client';
import type { SessionUser } from '@/components/Auth/hooks/useSession';

interface UserMenuProps {
  user: SessionUser;
  onLogout: () => void;
}

export default function UserMenu({ user, onLogout }: UserMenuProps) {
  const [withdrawOpen, setWithdrawOpen] = React.useState(false);

  const displayName =
    user.nickname || user.name || user.email?.split('@')[0] || '사용자';
  const truncated =
    displayName.length > 10 ? displayName.slice(0, 10) + '…' : displayName;

  const handleLogout = async () => {
    await authClient.signOut();
    onLogout();
  };

  const handleWithdraw = async () => {
    await fetch(`${import.meta.env.PUBLIC_API_URL}/api/user/me`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await authClient.signOut();
    setWithdrawOpen(false);
    onLogout();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="text-sm font-medium hover:text-foreground/80 transition-colors max-w-[8rem] truncate">
            {truncated}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem asChild>
            <a href="/mypage">내 정보</a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>로그아웃</DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setWithdrawOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            가입 탈퇴
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onConfirm={handleWithdraw}
      />
    </>
  );
}
