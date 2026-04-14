// src/components/MyPage/MyComments.tsx
import React from 'react';
import { useSession } from '@/components/Auth/hooks/useSession';

interface Comment {
  id: string;
  postId: string;
  postTitle: string;
  content: string;
  createdAt: string;
}

const API = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000';

export default function MyComments() {
  const { user, loading } = useSession();
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [fetched, setFetched] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    fetch(`${API}/api/user/me/comments`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data: Comment[]) => {
        setComments(data);
        setFetched(true);
      });
  }, [user]);

  if (loading || !fetched) {
    return (
      <div className="flex justify-center py-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-base font-semibold">내 댓글 ({comments.length})</h2>
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 작성한 댓글이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-md border p-3 text-sm">
              <a
                href={`/blog/${c.postId}`}
                className="mb-1 block font-medium hover:underline"
              >
                {c.postTitle}
              </a>
              <p className="line-clamp-2 text-muted-foreground">{c.content}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(c.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
