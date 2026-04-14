// src/components/MyPage/SSOLinkCard.tsx
import React from 'react';
import { authClient } from '@/lib/auth-client';
import { ProviderIcon, PROVIDERS } from '@/components/Auth/ProviderIcon';
import { Button } from '@/components/ui/button';
import { useSession } from '@/components/Auth/hooks/useSession';

interface Account {
  providerId: string;
  accountId: string;
}

export default function SSOLinkCard() {
  const { user } = useSession();
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pending, setPending] = React.useState<string | null>(null);

  const fetchAccounts = React.useCallback(async () => {
    const result = await (authClient as any).listAccounts();
    if (result?.data) setAccounts(result.data as Account[]);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (!user) return;
    fetchAccounts();
  }, [user, fetchAccounts]);

  const handleLink = async (providerId: string) => {
    setPending(providerId);
    await (authClient as any).linkSocial({
      provider: providerId,
      callbackURL: '/mypage',
    });
    setPending(null);
  };

  const handleUnlink = async (providerId: string) => {
    setPending(providerId);
    await (authClient as any).unlinkAccount({ providerId });
    await fetchAccounts();
    setPending(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  const linkedIds = new Set(accounts.map((a) => a.providerId));
  const canUnlink = accounts.length > 1;

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-base font-semibold">계정 연결</h2>
      <ul className="space-y-3">
        {PROVIDERS.map(({ id, label }) => {
          const linked = linkedIds.has(id);
          const isPending = pending === id;
          return (
            <li key={id} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ProviderIcon provider={id} className="size-5 shrink-0" />
                <span className="text-sm font-medium">{label}</span>
                {linked && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    연동 완료
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {linked ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!canUnlink || isPending}
                    onClick={() => handleUnlink(id)}
                    title={!canUnlink ? '최소 1개 계정은 유지해야 합니다' : undefined}
                  >
                    {isPending ? '처리 중…' : '해제'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => handleLink(id)}
                  >
                    {isPending ? '처리 중…' : '연동'}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
