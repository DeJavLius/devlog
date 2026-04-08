import { useState, useEffect, useCallback, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react'

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

type FieldKey = 'title' | 'body' | 'category' | 'tags'

const FIELD_LABELS: Record<FieldKey, string> = {
  title: '제목',
  body: '내용',
  category: '카테고리',
  tags: '태그',
}

const FIELD_ORDER: FieldKey[] = ['title', 'body', 'category', 'tags']

interface Props {
  open: boolean
  onClose: () => void
}

export default function SearchModal({ open, onClose }: Props) {
  const [filterOpen, setFilterOpen] = useState(false)
  // 초기값 전부 해제
  const [checks, setChecks] = useState<Record<FieldKey, boolean>>({
    title: false,
    body: false,
    category: false,
    tags: false,
  })
  const [keywords, setKeywords] = useState<Record<FieldKey, string>>({
    title: '',
    body: '',
    category: '',
    tags: '',
  })
  const [mode, setMode] = useState<'or' | 'and'>('or')
  const [results, setResults] = useState<SearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeFields = FIELD_ORDER.filter((k) => checks[k])
  const hasKeywords = activeFields.some((k) => keywords[k].trim())

  const doSearch = useCallback(async () => {
    if (!hasKeywords) {
      setResults([])
      setTotal(0)
      setError('')
      return
    }

    const params = new URLSearchParams({ mode })
    activeFields.forEach((k) => {
      if (keywords[k].trim()) params.set(k, keywords[k].trim())
    })

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/search?${params}`)
      const data: SearchResponse & { error?: string } = await res.json()
      if (!res.ok) {
        setError(data.error ?? '검색 중 오류가 발생했습니다.')
        setResults([])
        setTotal(0)
      } else {
        setResults(data.results)
        setTotal(data.total)
      }
    } catch {
      setError('검색 서버에 연결할 수 없습니다.')
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [activeFields, keywords, mode, hasKeywords])

  // 키워드·모드 변경 시 debounce 검색
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(doSearch, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [doSearch])

  // 모달 닫힐 때 초기화
  useEffect(() => {
    if (!open) {
      setFilterOpen(false)
      setChecks({ title: false, body: false, category: false, tags: false })
      setKeywords({ title: '', body: '', category: '', tags: '' })
      setResults([])
      setError('')
    }
  }, [open])

  const toggleCheck = (key: FieldKey) => {
    setChecks((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      // 체크 해제 시 해당 키워드 초기화
      if (!next[key]) setKeywords((k) => ({ ...k, [key]: '' }))
      return next
    })
  }

  const activeChips = activeFields.filter((k) => keywords[k].trim())

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="bg-background fixed left-1/2 top-[10%] z-50 w-full max-w-2xl -translate-x-1/2 rounded-xl border shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">검색</Dialog.Title>

          {/* 헤더바 */}
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Search className="text-muted-foreground h-4 w-4 shrink-0" />

            {/* 활성 칩 or 안내 문구 */}
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
              {activeChips.length > 0 ? (
                activeChips.map((k) => (
                  <span
                    key={k}
                    className="bg-primary/10 text-primary flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                  >
                    {FIELD_LABELS[k]}
                    <button
                      type="button"
                      onClick={() => toggleCheck(k)}
                      className="hover:text-primary/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">
                  {activeFields.length > 0
                    ? '키워드를 입력하세요...'
                    : '▼ 버튼으로 검색 필드를 선택하세요'}
                </span>
              )}
            </div>

            {/* 필터 토글 */}
            <button
              className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
              onClick={() => setFilterOpen((p) => !p)}
              title="필터 설정"
              type="button"
            >
              {filterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {/* 닫기 */}
            <Dialog.Close asChild>
              <button
                className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* 필터 패널 */}
          {filterOpen && (
            <div className="border-b px-4 py-3">
              {/* 체크박스 행 */}
              <div className="mb-3 flex flex-wrap items-center gap-4 text-sm">
                {FIELD_ORDER.map((key) => (
                  <label key={key} className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={checks[key]}
                      onChange={() => toggleCheck(key)}
                      className="accent-primary"
                    />
                    <span>{FIELD_LABELS[key]}</span>
                  </label>
                ))}
                {/* OR / AND 토글 */}
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

              {/* 체크된 필드별 입력박스 */}
              {activeFields.length > 0 && (
                <div className="flex flex-col gap-3">
                  {activeFields.map((key) => (
                    <div key={key}>
                      <label className="text-muted-foreground mb-1 block text-xs font-medium">
                        {FIELD_LABELS[key]}
                      </label>
                      <input
                        autoFocus={activeFields[0] === key}
                        className="border-input bg-background focus:ring-primary w-full rounded-md border px-3 py-1.5 text-sm outline-none focus:ring-1"
                        placeholder={`${FIELD_LABELS[key]} 검색어...`}
                        value={keywords[key]}
                        onChange={(e) =>
                          setKeywords((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === 'Escape' && onClose()}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 결과 영역 */}
          <div className="max-h-[55vh] overflow-y-auto">
            {loading && (
              <div className="text-muted-foreground p-6 text-center text-sm">검색 중...</div>
            )}

            {!loading && error && (
              <div className="text-destructive p-6 text-center text-sm">{error}</div>
            )}

            {!loading && !error && hasKeywords && results.length === 0 && (
              <div className="text-muted-foreground p-6 text-center text-sm">
                검색 결과가 없습니다.
              </div>
            )}

            {!loading && !error && results.length > 0 && (
              <>
                <div className="text-muted-foreground border-b px-4 py-2 text-xs">
                  {total}개 결과 · {mode.toUpperCase()} 모드
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
                          <span className="truncate text-sm font-medium">{item.title}</span>
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
                              <span key={tag} className="text-muted-foreground text-[10px]">
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

            {!loading && !error && !hasKeywords && (
              <div className="text-muted-foreground p-6 text-center text-sm">
                {activeFields.length === 0
                  ? '▼ 버튼을 눌러 검색할 필드를 선택하세요.'
                  : '선택한 필드에 키워드를 입력하면 검색이 시작됩니다.'}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
