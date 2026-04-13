import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE } from '@/lib/api';
import { useSession } from '@/components/Auth/hooks/useSession';
import LoginModal from '@/components/Auth/LoginModal';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🚀'] as const;

interface ReactionItem {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface Props {
  postId: string;
}

export default function PostReactions({ postId }: Props) {
  const { user } = useSession();
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const fetchReactions = useCallback(() => {
    fetch(`${API_BASE}/reactions?postId=${encodeURIComponent(postId)}`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then(setReactions)
      .catch(() => {});
  }, [postId]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  // 피커 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    if (pickerOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  const handleReact = async (emoji: string) => {
    if (!user) {
      setLoginOpen(true);
      return;
    }
    setPickerOpen(false);

    const existing = reactions.find((r) => r.emoji === emoji);
    const method = existing?.reacted ? 'DELETE' : 'POST';

    // 낙관적 업데이트
    setReactions((prev) => {
      const idx = prev.findIndex((r) => r.emoji === emoji);
      if (method === 'DELETE') {
        if (idx < 0) return prev;
        const updated = [...prev];
        const newCount = updated[idx].count - 1;
        if (newCount <= 0) {
          return updated.filter((_, i) => i !== idx);
        }
        updated[idx] = { ...updated[idx], count: newCount, reacted: false };
        return updated;
      } else {
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            count: updated[idx].count + 1,
            reacted: true,
          };
          return updated;
        }
        return [...prev, { emoji, count: 1, reacted: true }];
      }
    });

    try {
      const res = await fetch(`${API_BASE}/reactions`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ postId, emoji }),
      });
      if (!res.ok) throw new Error('API error');
    } catch {
      fetchReactions();
    }
  };

  const shownReactions = reactions.filter((r) => r.count > 0);

  return (
    <div className="flex flex-col gap-2">
      {/* 윗줄: 기존 반응 카운트 */}
      {shownReactions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {shownReactions.map((r) => (
            <button
              key={r.emoji}
              onClick={() => handleReact(r.emoji)}
              className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors ${
                r.reacted
                  ? 'border-primary bg-primary/10 font-medium'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span>{r.emoji}</span>
              <span className="tabular-nums">{r.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* 아랫줄: 반응 추가 버튼 + 피커 */}
      <div ref={pickerRef} className="relative inline-block">
        <button
          onClick={() => setPickerOpen((p) => !p)}
          className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          aria-label="반응 추가"
        >
          <span>😊</span>
          <span>+</span>
        </button>

        {pickerOpen && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-1 rounded-xl border bg-popover p-2 shadow-md z-10">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="rounded-lg p-1.5 text-xl transition-colors hover:bg-accent"
                aria-label={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {loginOpen && (
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      )}
    </div>
  );
}
