import { useMemo, useState } from 'react';
import { ListOrdered, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
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
  maxItems?: number;
}

export default function SeriesSection({
  items,
  pageSize = 5,
  maxItems = 20,
}: Props) {
  const capped = useMemo(() => items.slice(0, maxItems), [items, maxItems]);
  const hasOverflow = items.length > maxItems;

  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(capped.length / pageSize));
  const clamped = Math.min(page, totalPages);

  const sliced = useMemo(() => {
    const start = (clamped - 1) * pageSize;
    return capped.slice(start, start + pageSize);
  }, [capped, clamped, pageSize]);

  return (
    <section className="rounded-xl border bg-secondary/30 p-6">
      <header className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-2xl font-medium">시리즈</h2>
        <a
          href="/series"
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          모두 보기
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          아직 시리즈가 없습니다.
        </p>
      ) : (
        <>
          <ul className="flex flex-col divide-y rounded-lg border bg-background">
            {sliced.map(({ series, count }) => (
              <li key={series}>
                <a
                  href={`/series/${encodeURIComponent(series)}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-secondary/50"
                >
                  <span className="flex min-w-0 items-center gap-2">
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
              className="mt-4 flex items-center justify-center gap-1"
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

          {hasOverflow && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              상위 {maxItems}개만 표시합니다.{' '}
              <a
                href="/series"
                className="font-medium text-foreground underline underline-offset-2 hover:no-underline"
              >
                전체 시리즈 보기
              </a>
            </p>
          )}
        </>
      )}
    </section>
  );
}
