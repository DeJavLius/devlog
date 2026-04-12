import React from 'react';
import LoginModal from '@/components/Auth/LoginModal';
import UserMenu from '@/components/Auth/UserMenu';
import { useSession } from '@/components/Auth/hooks/useSession';

export default function LoginButton() {
  const { user, loading } = useSession();
  const [modalOpen, setModalOpen] = React.useState(false);

  // 세션 로딩 중엔 자리 유지용 placeholder
  if (loading) {
    return (
      <div className="h-6 w-14 animate-pulse rounded bg-muted" aria-hidden="true" />
    );
  }

  if (user) {
    return (
      <UserMenu
        user={user}
        onLogout={() => window.location.reload()}
      />
    );
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="text-sm font-medium text-foreground/60 hover:text-foreground/80 transition-colors"
      >
        로그인
      </button>
      <LoginModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
