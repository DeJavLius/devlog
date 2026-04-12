import React from 'react';
import { useSession } from '@/components/Auth/hooks/useSession';
import { Button } from '@/components/ui/button';

interface Comment {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  nickname: string | null;
  image: string | null;
}

const API = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000';

export default function MyPageClient() {
  const { user, loading: sessionLoading } = useSession();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [comments, setComments] = React.useState<Comment[]>([]);
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
    fetch(`${API}/api/user/me/comments`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data: Comment[]) => setComments(data));
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

  if (sessionLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  const isPlaceholder = !profile.email || profile.email.endsWith('@placeholder.local');
  const displayEmail = isPlaceholder ? 'SSO 계정' : profile.email;

  return (
    <section className="mx-auto max-w-lg space-y-8 py-8">
      {/* 프로필 카드 */}
      <div className="flex flex-col items-center gap-4 rounded-lg border p-6">
        {profile.image ? (
          <img
            src={profile.image}
            alt={profile.name}
            className="size-20 rounded-full object-cover"
          />
        ) : (
          <div className="bg-muted text-muted-foreground flex size-20 items-center justify-center rounded-full text-2xl font-bold">
            {profile.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {displayEmail}
          </p>
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                취소
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {profile.nickname || '(설정 안 됨)'}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(true)}
              >
                변경
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 내 댓글 목록 */}
      <div>
        <h2 className="mb-4 text-base font-semibold">내 댓글 ({comments.length})</h2>
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">작성한 댓글이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-md border p-3 text-sm">
                <a
                  href={`/blog/${c.postId}`}
                  className="mb-1 block font-medium hover:underline text-muted-foreground"
                >
                  포스트: {c.postId}
                </a>
                <p className="line-clamp-2">{c.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
