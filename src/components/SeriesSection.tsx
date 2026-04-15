import { useMemo, useState } from 'react';
import { ListOrdered, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SeriesItem {
  series: string;
  count: number;
  firstPostId: string;
}

interface Props {
  items: SeriesItem[];
  pageSize?: number;
}

export default function SeriesSection({ items, pageSize = 5 }: Props) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const clamped = Math.min(page, totalPages);

  const sliced = useMemo(() => {
    const start = (clamped - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, clamped, pageSize]);

  return (
    <section className="flex flex-col gap-y-4">
      <h2 className="text-2xl font-medium">시리즈</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 시리즈가 없습니다.</p>
      ) : (
        <>
          <ul className="flex flex-col divide-y rounded-lg border">
            {sliced.map(({ series, count }) => (
              <li key={series}>
                <a
                  href={`/series/${encodeURIComponent(series)}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-secondary/50"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <ListOrdered
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="truncate font-medium">{series}</span>
                  </span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {count}편
                  </span>
                </a>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav
              aria-label="시리즈 페이지네이션"
              className="flex items-center justify-center gap-1"
            >
              <Button
                variant="ghost"
                size="sm"
                disabled={clamped === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="이전 페이지"
              >
                <ChevronLeft className="size-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === clamped ? 'outline' : 'ghost'}
                  size="sm"
                  onClick={() => setPage(p)}
                  className={cn('min-w-9', p === clamped && 'font-semibold')}
                  aria-current={p === clamped ? 'page' : undefined}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                disabled={clamped === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="다음 페이지"
              >
                <ChevronRight className="size-4" />
              </Button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
