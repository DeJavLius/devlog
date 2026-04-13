# Comments & Reactions Feature Design

Date: 2026-04-13  
Status: Approved

---

## Overview

Add comment and reaction functionality to individual blog post pages.
Both features require SSO login (Google / Naver / Kakao / GitHub via better-auth).

---

## Architecture

**Strategy: Full CSR (client-side rendering) islands**

- `[...id].astro` keeps `export const prerender = true` — static build pipeline unchanged
- `PostReactions` and `PostComments` are React components hydrated with `client:load`
- Session state resolved at runtime via `useSession()` hook (better-auth client, internally cached)
- All API calls go to `{PUBLIC_API_URL}/api/...` with credentials (session cookie)

```
[...id].astro (static)
  └─ <PostReactions postId={id} client:load />
  └─ <PostComments  postId={id} client:load />
```

---

## Backend — Security Validation

| Check | Comments | Reactions |
|-------|----------|-----------|
| Auth | `req.user` via AuthMiddleware (already wired) | Same middleware |
| Input length | `content`: 1–1000 chars (`@Length`) | N/A |
| Empty value | `@IsNotEmpty` | N/A |
| XSS prevention | Strip HTML tags before persist | N/A (enum only) |
| Emoji whitelist | N/A | `@IsIn(['👍','❤️','😂','😮','😢','🚀'])` — 400 on unknown |
| Reply depth | Verify `parentId` target has no `parentId` itself (DB check) | N/A |

---

## Backend — Reaction Module (new)

### Prisma Schema Addition

```prisma
model Reaction {
  id        String   @id @default(cuid())
  postId    String
  userId    String
  emoji     String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([postId, userId, emoji])
  @@index([postId])
}
```

Add `reactions Reaction[]` to `User` model.

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/reactions?postId=` | Optional | Returns `{ emoji, count, reacted }[]` |
| `POST` | `/api/reactions` | Required | Body: `{ postId, emoji }` — add reaction |
| `DELETE` | `/api/reactions` | Required | Body: `{ postId, emoji }` — remove reaction |

GET response shape:
```json
[
  { "emoji": "👍", "count": 3, "reacted": true },
  { "emoji": "❤️", "count": 1, "reacted": false }
]
```
Only emojis with `count > 0` are returned. `reacted` is `false` when unauthenticated.

### Module Structure

```
src/reactions/
├── reactions.module.ts
├── reactions.controller.ts
├── reactions.service.ts      # findByPost / toggle (create or delete)
└── dto/
    └── reaction.dto.ts       # postId: string, emoji: @IsIn([...])
```

---

## Backend — Comments Security Enhancement

Add to `CreateCommentDto`:
- `@Length(1, 1000)` on `content`
- `@IsOptional() @IsString()` on `parentId`

Add to `CommentsService.create()`:
- Strip HTML tags from `content` before persisting
- If `parentId` provided: verify parent comment exists and has no `parentId` (depth enforcement)

---

## Frontend — PostReactions Component

File: `src/components/PostReactions.tsx`

**Layout:**
```
Row 1 (existing reactions):  [ 👍 3 ] [ ❤️ 1 ]   ← count > 0 only, mine = highlighted
Row 2 (add reaction):        [ 😊 + ]              ← opens emoji picker popover
                               ↳ [ 👍 ][ ❤️ ][ 😂 ][ 😮 ][ 😢 ][ 🚀 ]
```

**Behavior:**
- Mount: `GET /api/reactions?postId={id}`
- Click existing emoji: toggle (POST or DELETE) with optimistic update + rollback on error
- Click 😊: open popover with 6 emoji buttons
- Click emoji in picker: POST reaction, close picker, update row 1
- Unauthenticated click → trigger LoginModal
- Loading state: skeleton placeholders

---

## Frontend — PostComments Component

File: `src/components/PostComments.tsx`

**Layout:**
```
[N개의 댓글]
  CommentItem
    avatar | name | date         [삭제] (own only)
    content
    [답글 달기]                   (top-level only)
      └─ inline ReplyInput (on click)
    ReplyItem (indented)
      avatar | name | date       [삭제] (own only)
      content
      (no 답글 button)

[댓글 작성]
  Logged in:  textarea (max 1000) + [작성] button
  Logged out: "댓글을 작성하려면 로그인하세요" → LoginModal trigger
```

**Behavior:**
- Mount: `GET /api/comments?postId={id}`
- Reply button: shows inline textarea below comment; submits with `parentId`
- Delete: `DELETE /api/comments/:id` — button visible only for own comments
- After submit: re-fetch comment list (or optimistic insert)
- Reply depth: 1-level only — ReplyItem has no 답글 button

---

## Frontend — Post Page Integration

File: `src/pages/blog/[...id].astro`

Insert after `<article>` block, before final `<PostNavigation>`:

```astro
import PostReactions from '@/components/PostReactions'
import PostComments from '@/components/PostComments'

<div class="col-start-2 flex flex-col gap-y-8 mt-6">
  <PostReactions postId={currentPostId} client:load />
  <PostComments  postId={currentPostId} client:load />
</div>
```

---

## Environment Variables

```env
# devlog (.env / Netlify env)
PUBLIC_API_URL=https://api.dejavlog.com   # production
# LOCAL: PUBLIC_API_URL=http://localhost:3000
```

---

## Implementation Order

1. **[devlog-server]** Add `Reaction` to Prisma schema + `User.reactions` relation
2. **[devlog-server]** Run migration
3. **[devlog-server]** Create ReactionsModule (dto / service / controller)
4. **[devlog-server]** Register ReactionsModule in AppModule + apply AuthMiddleware
5. **[devlog-server]** Harden CommentsDto (length, XSS strip, depth check)
6. **[devlog-server]** Build & deploy to mlink-linux
7. **[devlog]** Create `PostReactions.tsx`
8. **[devlog]** Create `PostComments.tsx`
9. **[devlog]** Integrate both into `[...id].astro`
10. **[devlog]** Test locally against devlog-server
