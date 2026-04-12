# DevLog — 개인 기술 블로그

Astro 기반 개인 블로그. 현재 Netlify 서버리스 배포. 추후 Node.js 또는 Spring 백엔드 연동 예정.

## Quick Start

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:1234)
npm run build    # astro check + 빌드
npm run preview  # 빌드 결과 미리보기
npm run prettier # 코드 포맷 (.ts, .tsx, .css, .astro)
```

> **주의:** 기본 포트는 `1234` (Astro 기본값 4321이 아님)

## 아키텍처

| 항목 | 내용 |
|---|---|
| 프레임워크 | Astro 5.x (`output: 'server'` — SSR 기본) |
| UI | React + Tailwind v4 + shadcn/ui (Radix) |
| 배포 | Netlify (`@astrojs/netlify` adapter) |
| 콘텐츠 | Astro Content Collections (blog / authors / projects) |
| 아이콘 | astro-icon + `@iconify-json/lucide` |
| 코드 하이라이팅 | astro-expressive-code (github-light / github-dark 테마) |

**SSR / Static 혼용 규칙:**
- 기본값은 SSR. 정적 페이지는 `export const prerender = true` 선언
- `[...id].astro` 같은 동적 라우트는 `export const prerender = false`

## 프로젝트 구조

```
src/
├── components/       # UI 컴포넌트 (.astro, .tsx)
│   └── ui/           # shadcn/ui 기반 공통 컴포넌트
├── content/          # 콘텐츠 파일 (md / mdx)
│   ├── blog/         # 블로그 포스트
│   ├── authors/      # 저자 프로필
│   └── projects/     # 프로젝트 소개
├── layouts/          # 페이지 레이아웃
├── lib/
│   ├── data-utils.ts # 콘텐츠 조회 유틸 (getAllPosts, getTags 등)
│   └── utils.ts      # 범용 유틸
├── pages/            # 파일 기반 라우팅
├── consts.ts         # SITE, NAV_LINKS, SOCIAL_LINKS, THEME_COLORS
├── content.config.ts # Content Collection 스키마 정의
└── types.ts          # 전역 타입
```

## Content Collection 스키마

**blog** (`src/content/blog/**/*.{md,mdx}`)

```ts
{
  title: string
  description: string
  category: string
  serise?: string   // ⚠️ 오타 (series의 오기) — 스키마 변경 시 전체 포스트 마이그레이션 필요
  order?: number    // serise 내 순서
  date: Date
  image?: ImageMetadata
  tags?: string[]
  authors?: string[]
  draft?: boolean   // true면 빌드에서 제외
}
```

**authors** (`src/content/authors/**/*.{md,mdx}`)
```ts
{ name, pronouns?, avatar, bio?, mail?, website?, twitter?, github?, linkedin?, discord? }
```

**projects** (`src/content/projects/**/*.{md,mdx}`)
```ts
{ name, description, category?, tags, image, link, startDate?, endDate? }
```

## 주요 데이터 유틸 (`src/lib/data-utils.ts`)

| 함수 | 반환 | 설명 |
|---|---|---|
| `getAllPosts()` | `CollectionEntry<'blog'>[]` | draft 제외, 날짜 내림차순 |
| `getPostsByTag(tag)` | `CollectionEntry<'blog'>[]` | 태그 필터 |
| `getPostsByCategory(cat)` | `CollectionEntry<'blog'>[]` | 카테고리 필터 |
| `getSortedTags()` | `{ tag, count }[]` | count 내림차순 |
| `getSortedCategoriesByCount()` | `{ category, count }[]` | count 내림차순 |
| `getAdjacentPosts(id)` | `{ prev, next }` | 이전/다음 포스트 |
| `parseAuthors(ids)` | `{ id, name, avatar, isRegistered }[]` | 저자 메타 파싱 |

## 사이트 설정 (`src/consts.ts`)

```ts
SITE.href = 'https://link-devlog.netlify.app'
SITE.locale = 'ko-KR'
SITE.postsPerPage = 10
SITE.featuredPostCount = 5
```

테마: `light` / `dark` / `cream` / `royal-blue` / `pistachio`

## Gotchas

- **`serise` 오타**: Content Collection 스키마에 `serise` (series 오기)로 정의됨. 수정 시 전체 포스트 frontmatter 일괄 변경 필요
- **포트 1234**: `astro.config.mjs`에서 고정. 기본값(4321) 아님
- **patch-package**: `postinstall`에서 자동 실행됨. `node_modules`에 패치 적용 중
- **Redis 세션**: `astro.config.mjs`에 `session.driver: 'redis'`가 선언되어 있으나 현재 미사용 (서버리스). 백엔드 연동 시 활성화 예정

## 로드맵 (백엔드 연동)

현재는 Astro + Netlify 서버리스로만 운영. 추후 단계:

1. **현재**: Netlify Functions / Edge 활용 (현 상태)
2. **단기**: Astro API Routes 확장 (`src/pages/api/`) — 댓글, 조회수 등
3. **장기**: Node.js 또는 Spring 백엔드 서버 분리 → Astro는 프론트엔드 전담

백엔드 연동 시 참고:
- Astro `server endpoints`: `src/pages/api/*.ts` — `export const GET/POST`
- 현재 Redis 세션 설정은 해당 단계에 맞춰 활성화

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **devlog** (235 symbols, 372 relationships, 2 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/devlog/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/devlog/context` | Codebase overview, check index freshness |
| `gitnexus://repo/devlog/clusters` | All functional areas |
| `gitnexus://repo/devlog/processes` | All execution flows |
| `gitnexus://repo/devlog/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
