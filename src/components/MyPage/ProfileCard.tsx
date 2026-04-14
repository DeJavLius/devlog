// src/components/MyPage/ProfileCard.tsx
import React from 'react';
import { useSession } from '@/components/Auth/hooks/useSession';
import { ProviderIcon } from '@/components/Auth/ProviderIcon';
import { Button } from '@/components/ui/button';

interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  nickname: string | null;
  image: string | null;
  provider: string | null;
}

const API = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000';

export default function ProfileCard() {
  const { user, loading } = useSession();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [nickname, setNickname] = React.useState('');
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    fetch(`${API}/api/user/me`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data: UserProfile) => {
        setProfile(data);
        setNickname(data.nickname ?? '');
      });
  }, [user]);

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

  if (loading || !profile) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  const isPlaceholder = !profile.email || profile.email.endsWith('@placeholder.local');
  const displayEmail = isPlaceholder
    ? profile.provider === 'kakao'
      ? '카카오 계정'
      : profile.provider === 'naver'
        ? '네이버 계정'
        : 'SSO 계정'
    : profile.email;

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border p-6">
      {profile.image ? (
        <img
          src={profile.image}
          alt={profile.name}
          className="size-20 rounded-full object-cover"
        />
      ) : (
        <div className="flex size-20 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground">
          {profile.name.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5">
          <ProviderIcon provider={profile.provider} />
          <p className="text-sm text-muted-foreground">{displayEmail}</p>
        </div>
        <p className="mt-1 font-semibold">{profile.name}</p>
      </div>

      {/* 별명 편집 */}
      <div className="w-full">
        <label className="mb-1 block text-sm font-medium">별명</label>
        {editing ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={30}
              className="flex-1 rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="별명 입력 (최대 30자)"
            />
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? '저장 중…' : '저장'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
              취소
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {profile.nickname || '(설정 안 됨)'}
            </span>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              변경
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
