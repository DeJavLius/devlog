import React, { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '@/lib/api';
import { useSession } from '@/components/Auth/hooks/useSession';
import { Button } from '@/components/ui/button';
import LoginModal from '@/components/Auth/LoginModal';

interface CommentUser {
  id: string;
  name: string;
  image: string | null;
}

interface ReplyData {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
}

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
  replies: ReplyData[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function Avatar({ user }: { user: CommentUser }) {
  return user.image ? (
    <img
      src={user.image}
      alt={user.name}
      className="size-7 rounded-full object-cover shrink-0"
    />
  ) : (
    <div className="size-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
      {user.name[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

interface ReplyInputProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

function ReplyInput({ onSubmit, onCancel, submitting }: ReplyInputProps) {
  const [value, setValue] = useState('');
  return (
    <div className="ml-9 mt-2 flex flex-col gap-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={1000}
        placeholder="답글을 작성하세요..."
        className="w-full rounded-lg border bg-background p-2.5 text-sm resize-none min-h-[64px] focus:outline-none focus:ring-1 focus:ring-ring"
        autoFocus
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{value.length}/1000</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} type="button">
            취소
          </Button>
          <Button
            size="sm"
            disabled={!value.trim() || submitting}
            onClick={() => onSubmit(value)}
            type="button"
          >
            {submitting ? '작성 중...' : '답글 작성'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: CommentData;
  currentUserId: string | undefined;
  replyingTo: string | null;
  submitting: boolean;
  onDelete: (id: string) => void;
  onReplyToggle: (id: string) => void;
  onReplySubmit: (content: string, parentId: string) => Promise<void>;
}

function CommentItem({
  comment,
  currentUserId,
  replyingTo,
  submitting,
  onDelete,
  onReplyToggle,
  onReplySubmit,
}: CommentItemProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2.5">
        <Avatar user={comment.user} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium">{comment.user.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>
          <div className="mt-1.5 flex gap-3">
            <button
              onClick={() => onReplyToggle(comment.id)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              답글 달기
            </button>
            {currentUserId === comment.user.id && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-destructive/70 hover:text-destructive transition-colors"
              >
                삭제
              </button>
            )}
          </div>
        </div>
      </div>

      {replyingTo === comment.id && (
        <ReplyInput
          submitting={submitting}
          onCancel={() => onReplyToggle(comment.id)}
          onSubmit={(content) => onReplySubmit(content, comment.id)}
        />
      )}

      {comment.replies.length > 0 && (
        <div className="ml-9 flex flex-col gap-3 mt-2 border-l-2 border-border pl-3">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex gap-2.5">
              <Avatar user={reply.user} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium">{reply.user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(reply.createdAt)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {reply.content}
                </p>
                {currentUserId === reply.user.id && (
                  <button
                    onClick={() => onDelete(reply.id)}
                    className="mt-1.5 text-xs text-destructive/70 hover:text-destructive transition-colors"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  postId: string;
}

export default function PostComments({ postId }: Props) {
  const { user, loading: sessionLoading } = useSession();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const fetchComments = useCallback(() => {
    fetch(`${API_BASE}/comments?postId=${encodeURIComponent(postId)}`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then(setComments)
      .catch(() => {});
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const submitComment = async (text: string, parentId?: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ postId, content: text, parentId }),
      });
      if (!res.ok) throw new Error('API error');
      await fetchComments();
      if (parentId) {
        setReplyingTo(null);
      } else {
        setContent('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (id: string) => {
    await fetch(`${API_BASE}/comments/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    fetchComments();
  };

  const toggleReply = (id: string) => {
    setReplyingTo((prev) => (prev === id ? null : id));
  };

  const totalCount = comments.reduce(
    (acc, c) => acc + 1 + c.replies.length,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold">
        댓글 <span className="text-muted-foreground">{totalCount}</span>
      </h2>

      {comments.length > 0 ? (
        <div className="flex flex-col gap-5 divide-y divide-border">
          {comments.map((comment) => (
            <div key={comment.id} className="pt-5 first:pt-0">
              <CommentItem
                comment={comment}
                currentUserId={user?.id}
                replyingTo={replyingTo}
                submitting={submitting}
                onDelete={deleteComment}
                onReplyToggle={toggleReply}
                onReplySubmit={submitComment}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          첫 댓글을 작성해보세요.
        </p>
      )}

      {!sessionLoading && (
        <>
          {user ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitComment(content);
              }}
              className="flex flex-col gap-2"
            >
              <div className="flex gap-2.5 items-start">
                <Avatar user={user as CommentUser} />
                <div className="flex-1">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={1000}
                    placeholder="댓글을 작성하세요..."
                    className="w-full rounded-lg border bg-background p-3 text-sm resize-none min-h-[80px] focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-muted-foreground">
                      {content.length}/1000
                    </span>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!content.trim() || submitting}
                    >
                      {submitting ? '작성 중...' : '댓글 작성'}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                댓글을 작성하려면 로그인하세요
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLoginOpen(true)}
              >
                로그인
              </Button>
            </div>
          )}
        </>
      )}

      {loginOpen && (
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      )}
    </div>
  );
}
