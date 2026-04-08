import { useState, useEffect, useCallback, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Search, X, ChevronDown, ChevronUp, Tag } from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  publishedAt: string
  score: number
}

interface SearchResponse {
  total: number
  page: number
  limit: number
  results: SearchResult[]
}

interface Filters {
  title: boolean
  body: boolean
  category: boolean
  tags: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SERVER_URL = (import.meta.env as any).PUBLIC_SERVER_URL as string | undefined ?? 'http://localhost:3000'

interface Props {
  open: boolean
  onClose: () => void
}

export default function SearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    title: true,
    body: true,
    category: true,
    tags: true,
  })
  const [mode, setMode] = useState<'or' | 'and'>('or')
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([])
        setTotal(0)
        return
      }

      setLoading(true)
      try {
        const params = new URLSearchParams({ q, mode })
        const res = await fetch(`${SERVER_URL}/api/search?${params}`)
        if (!res.ok) throw new Error('Search failed')
        const data: SearchResponse = await res.json()
        setResults(data.results)
        setTotal(data.total)
      } catch {
        setResults([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    },
    [mode],
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, doSearch])

  // 모달 열릴 때 input 포커스
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults([])
      setFilterOpen(false)
    }
  }, [open])

  const activeFilterLabels = Object.entries(filters)
    .filter(([, v]) => v)
    .map(([k]) =>
      k === 'title'
        ? '제목'
        : k === 'body'
          ? '내용'
          : k === 'category'
            ? '카테고리'
            : '태그',
    )

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="bg-background fixed left-1/2 top-[10%] z-50 w-full max-w-2xl -translate-x-1/2 rounded-xl border shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">검색</Dialog.Title>

          {/* 검색 입력 영역 */}
          <div className="border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Search className="text-muted-foreground h-4 w-4 shrink-0" />
              <input
                ref={inputRef}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="검색어를 입력하세요..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && onClose()}
              />

              {/* 활성 필터 칩 */}
              {activeFilterLabels.length < 4 && (
                <div className="hidden items-center gap-1 sm:flex">
                  {activeFilterLabels.map((label) => (
                    <span
                      key={label}
                      className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}

              {/* 필터 토글 */}
              <button
                className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
                onClick={() => setFilterOpen((p) => !p)}
                title="필터 설정"
                type="button"
              >
                {filterOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {/* 닫기 버튼 */}
              <Dialog.Close asChild>
                <button
                  className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* 필터 패널 */}
          {filterOpen && (
            <div className="border-b px-4 py-3">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {(
                  [
                    ['title', '제목'],
                    ['body', '내용'],
                    ['category', '카테고리'],
                    ['tags', '태그'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={filters[key]}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, [key]: e.target.checked }))
                      }
                      className="accent-primary"
                    />
                    <span>{label}</span>
                  </label>
                ))}
                <div className="ml-auto flex items-center gap-1 rounded-md border p-0.5 text-xs">
                  {(['or', 'and'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`rounded px-2 py-0.5 transition-colors ${
                        mode === m
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 결과 목록 */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="text-muted-foreground p-6 text-center text-sm">
                검색 중...
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="text-muted-foreground p-6 text-center text-sm">
                <Tag className="mx-auto mb-2 h-8 w-8 opacity-30" />
                검색 결과가 없습니다.
              </div>
            )}

            {!loading && results.length > 0 && (
              <>
                <div className="text-muted-foreground border-b px-4 py-2 text-xs">
                  {total}개 결과
                </div>
                <ul>
                  {results.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`/blog/${item.id}`}
                        className="hover:bg-muted flex flex-col gap-1 px-4 py-3 transition-colors"
                        onClick={onClose}
                      >
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {item.title}
                          </span>
                          <span className="bg-muted text-muted-foreground ml-auto shrink-0 rounded px-1.5 py-0.5 text-xs">
                            {item.category}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-muted-foreground line-clamp-1 text-xs">
                            {item.description}
                          </p>
                        )}
                        {item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 5).map((tag) => (
                              <span
                                key={tag}
                                className="text-muted-foreground text-[10px]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {!query && (
              <div className="text-muted-foreground p-6 text-center text-sm">
                제목, 내용, 카테고리, 태그를 검색합니다.
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
