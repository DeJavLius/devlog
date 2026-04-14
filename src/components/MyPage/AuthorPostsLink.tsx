// src/components/MyPage/AuthorPostsLink.tsx
import { useSession } from '@/components/Auth/hooks/useSession';

interface Props {
  authorMap: Record<string, string>;
}

export default function AuthorPostsLink({ authorMap }: Props) {
  const { user, loading } = useSession();
  if (loading || !user?.email) return null;
  const authorId = authorMap[user.email];
  if (!authorId) return null;

  return (
    <a
      href={`/authors/${authorId}`}
      className="group has-[a:hover]:bg-secondary/50 flex items-center justify-between overflow-hidden rounded-xl border p-4 transition-colors duration-300 ease-in-out"
    >
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true">✏️</span>
        <span className="text-sm font-medium">내 작성글 보기</span>
      </div>
      <span
        aria-hidden="true"
        className="text-muted-foreground transition-transform duration-300 group-hover:translate-x-1"
      >
        →
      </span>
    </a>
  );
}
