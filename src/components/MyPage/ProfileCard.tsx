// src/components/MyPage/ProfileCard.tsx
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Camera } from 'lucide-react';
import { useSession } from '@/components/Auth/hooks/useSession';
import { authClient } from '@/lib/auth-client';
import { ProviderIcon, PROVIDERS } from '@/components/Auth/ProviderIcon';
import { Button } from '@/components/ui/button';

interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  nickname: string | null;
  image: string | null;
  provider: string | null;
}

interface Account {
  providerId: string;
  accountId: string;
}

const API = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000';

function providerEmailLabel(provider: string | null): string {
  switch (provider) {
    case 'kakao':
      return '카카오 계정';
    case 'naver':
      return '네이버 계정';
    default:
      return 'SSO 계정';
  }
}

export default function ProfileCard() {
  const { user, loading: sessionLoading } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [nickname, setNickname] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    const res = await fetch(`${API}/api/user/me`, { credentials: 'include' });
    const data: UserProfile = await res.json();
    setProfile(data);
    setNickname(data.nickname ?? '');
  }, []);

  const fetchAccounts = useCallback(async () => {
    const result = await (authClient as any).listAccounts();
    if (result?.data) setAccounts(result.data as Account[]);
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) {
      alert('로그인이 필요한 페이지입니다.');
      window.location.href = '/';
      return;
    }
    void fetchProfile();
    void fetchAccounts();
  }, [sessionLoading, user, fetchProfile, fetchAccounts]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`${API}/api/user/me`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    });
    if (res.ok) {
      const updated: UserProfile = await res.json();
      setProfile(updated);
      setEditing(false);
    }
    setSaving(false);
  };

  const handleLink = async (providerId: string) => {
    setPending(providerId);
    await (authClient as any).linkSocial({
      provider: providerId,
      callbackURL: `${window.location.origin}/mypage`,
    });
    setPending(null);
  };

  const handleUnlink = async (providerId: string) => {
    setPending(providerId);
    await (authClient as any).unlinkAccount({ providerId });
    await fetchAccounts();
    setPending(null);
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('이미지 크기는 8MB 이하여야 합니다.');
      return;
    }
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch(`${API}/api/user/me/avatar`, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.message ?? '업로드에 실패했습니다.');
        return;
      }
      await fetchProfile();
    } finally {
      setUploading(false);
    }
  };

  if (sessionLoading || !user || !profile) {
    return (
      <div className="flex justify-center rounded-lg border p-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  const isPlaceholder =
    !profile.email || profile.email.endsWith('@placeholder.local');
  const displayEmail = isPlaceholder
    ? providerEmailLabel(profile.provider)
    : profile.email;

  const linkedIds = new Set(accounts.map((a) => a.providerId));
  const canUnlink = accounts.length > 1;
  const otherProviders = PROVIDERS.filter((p) => p.id !== profile.provider);

  return (
    <div className="space-y-8 rounded-lg border p-6">
      {/* 프로필 */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          {profile.image ? (
            <img
              src={profile.image}
              alt={profile.name}
              className="size-28 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-28 items-center justify-center rounded-full bg-muted text-3xl font-bold text-muted-foreground">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border bg-background text-foreground shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="프로필 이미지 변경"
          >
            {uploading ? (
              <span className="size-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />
            ) : (
              <Camera className="size-4" aria-hidden="true" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={handleAvatarChange}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <ProviderIcon provider={profile.provider} className="size-4 shrink-0" />
          <p className="text-sm text-muted-foreground">{displayEmail}</p>
        </div>
        <p className="font-semibold">{profile.nickname || profile.name}</p>
      </div>

      {/* 별명 */}
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-sm font-medium">별명</p>
          {editing ? (
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={30}
              className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="별명 입력 (최대 30자)"
            />
          ) : (
            <p className="truncate text-sm text-muted-foreground">
              {profile.nickname || '(설정 안 됨)'}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {editing ? (
            <>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? '저장 중…' : '저장'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                취소
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              변경
            </Button>
          )}
        </div>
      </div>

      {/* SSO */}
      {otherProviders.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium">SSO</h2>
          <ul className="space-y-3">
            {otherProviders.map(({ id, label }) => {
              const linked = linkedIds.has(id);
              const isPending = pending === id;
              return (
                <li key={id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ProviderIcon provider={id} className="size-5 shrink-0" />
                    <span className="text-sm font-medium">{label}</span>
                    <span
                      className={
                        linked
                          ? 'text-xs text-blue-600'
                          : 'text-xs text-muted-foreground'
                      }
                    >
                      {linked ? '연동 완료' : '미연동'}
                    </span>
                  </div>
                  {linked ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canUnlink || isPending}
                      onClick={() => handleUnlink(id)}
                      className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      title={
                        !canUnlink ? '최소 1개 계정은 유지해야 합니다' : undefined
                      }
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
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
