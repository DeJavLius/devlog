# Comments & Reactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 블로그 포스트 페이지에 SSO 로그인 기반 댓글(대댓글 1-depth)과 이모지 반응 기능을 추가한다.

**Architecture:** `[...id].astro`는 `prerender=true`(정적 빌드)를 유지하고, PostReactions·PostComments를 `client:load` React island로 마운트한다. 백엔드(devlog-server, mlink-linux)에 Reaction 모듈을 추가하고, Comment 저장 시 HTML strip·depth 검증 보안 레이어를 추가한다.

**Tech Stack:** NestJS 11, Prisma 7, class-validator, React 18, Tailwind v4, better-auth, shadcn/ui (Button, Separator), Astro 5 (client:load)

**Remote:** devlog-server 소스 `/project/source/devlog-server/`, 도커 `/project/server/`  
모든 원격 파일 작업은 `mcp__ssh-manager__ssh_execute` 또는 `ssh_upload`/`ssh_download` 사용.

---

## File Map

### Backend (devlog-server) — mlink-linux

| 작업 | 파일 |
|------|------|
| Modify | `prisma/schema.prisma` — Reaction 모델 + User.reactions 추가 |
| Modify | `src/comments/dto/create-comment.dto.ts` — MaxLength 추가 |
| Modify | `src/comments/comments.service.ts` — HTML strip, depth 검증 |
| Create | `src/comments/comments.service.spec.ts` — 보안 로직 단위 테스트 |
| Create | `src/reactions/dto/reaction.dto.ts` — emoji 화이트리스트 DTO |
| Create | `src/reactions/reactions.service.ts` — findByPost, add, remove |
| Create | `src/reactions/reactions.service.spec.ts` — 서비스 단위 테스트 |
| Create | `src/reactions/reactions.controller.ts` — GET/POST/DELETE |
| Create | `src/reactions/reactions.module.ts` |
| Modify | `src/app.module.ts` — ReactionsModule 등록 |

### Frontend (devlog) — local

| 작업 | 파일 |
|------|------|
| Create | `src/lib/api.ts` — API_BASE 헬퍼 |
| Create | `src/components/PostReactions.tsx` |
| Create | `src/components/PostComments.tsx` |
| Modify | `src/pages/blog/[...id].astro` — 컴포넌트 삽입 |

---

## Task 1: Comments DTO & Service 보안 강화

**Files:**
- Modify: `/project/source/devlog-server/src/comments/dto/create-comment.dto.ts`
- Modify: `/project/source/devlog-server/src/comments/comments.service.ts`
- Create: `/project/source/devlog-server/src/comments/comments.service.spec.ts`

- [ ] **Step 1: DTO에 MaxLength 추가**

`/project/source/devlog-server/src/comments/dto/create-comment.dto.ts` 전체 교체:

```typescript
import { IsOptional, IsString, Length } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  postId: string;

  @IsString()
  @Length(1, 1000)
  content: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}
```

- [ ] **Step 2: CommentsService에 HTML strip + depth 검증 추가**

`/project/source/devlog-server/src/comments/comments.service.ts` 전체 교체:

```typescript
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  /** HTML 태그 제거 (XSS 방지) */
  private stripHtml(text: string): string {
    return text.replace(/<[^>]*>/g, '').trim();
  }

  async findByPost(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId, parentId: null },
      include: {
        user: { select: { id: true, name: true, image: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateCommentDto) {
    const content = this.stripHtml(dto.content);
    if (!content) throw new BadRequestException('내용을 입력해주세요.');

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { parentId: true },
      });
      if (!parent) throw new NotFoundException('부모 댓글을 찾을 수 없습니다.');
      if (parent.parentId !== null)
        throw new BadRequestException('대댓글에는 답글을 달 수 없습니다.');
    }

    return this.prisma.comment.create({
      data: { postId: dto.postId, content, userId, parentId: dto.parentId },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    if (comment.userId !== userId)
      throw new NotFoundException('권한이 없습니다.');
    return this.prisma.comment.delete({ where: { id } });
  }
}
```

- [ ] **Step 3: CommentsService 단위 테스트 작성**

파일 생성: `/project/source/devlog-server/src/comments/comments.service.spec.ts`

```typescript
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  comment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

describe('CommentsService', () => {
  let service: CommentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<CommentsService>(CommentsService);
    jest.clearAllMocks();
  });

  describe('create — HTML strip', () => {
    it('HTML 태그를 제거하고 저장한다', async () => {
      mockPrisma.comment.create.mockResolvedValue({ id: '1', content: 'hello' });
      await service.create('user1', {
        postId: 'post1',
        content: '<script>alert(1)</script>hello',
      });
      expect(mockPrisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ content: 'hello' }),
        }),
      );
    });

    it('태그만 있어 빈 문자열이 되면 BadRequestException을 던진다', async () => {
      await expect(
        service.create('user1', { postId: 'post1', content: '<b></b>' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('create — depth 검증', () => {
    it('대댓글(parentId 있는 댓글)에 답글을 달면 BadRequestException을 던진다', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({ parentId: 'grandparent' });
      await expect(
        service.create('user1', {
          postId: 'post1',
          content: '답글',
          parentId: 'reply-id',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('존재하지 않는 parentId면 NotFoundException을 던진다', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null);
      await expect(
        service.create('user1', {
          postId: 'post1',
          content: '답글',
          parentId: 'nonexistent',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('최상위 댓글에 답글은 허용된다', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({ parentId: null });
      mockPrisma.comment.create.mockResolvedValue({ id: '2', content: '답글' });
      await expect(
        service.create('user1', {
          postId: 'post1',
          content: '답글',
          parentId: 'top-comment-id',
        }),
      ).resolves.not.toThrow();
    });
  });
});
```

- [ ] **Step 4: 테스트 실행 (실패 확인)**

```bash
# mlink-linux에서 실행
cd /project/source/devlog-server && npx jest src/comments/comments.service.spec.ts --no-coverage
```

기존 service가 depth 검증이 없으므로 FAIL 예상.

- [ ] **Step 5: service 파일을 Step 2 내용으로 교체 후 테스트 통과 확인**

```bash
cd /project/source/devlog-server && npx jest src/comments/comments.service.spec.ts --no-coverage
```

Expected: 5 tests PASS

- [ ] **Step 6: 커밋**

```bash
cd /project/source/devlog-server && git add src/comments/ && git commit -m "feat: harden comments — HTML strip, depth guard, MaxLength 1000"
```

---

## Task 2: Prisma — Reaction 모델 추가 + 마이그레이션

> **주의:** DB 포트가 호스트에 노출되지 않으므로 `prisma migrate dev`를 소스 디렉토리에서 직접 실행할 수 없다.  
> 대신 SQL 마이그레이션 파일을 수동 생성 후 컨테이너에서 `migrate deploy`로 적용한다.

**Files:**
- Modify: `/project/source/devlog-server/prisma/schema.prisma`
- Create: `/project/source/devlog-server/prisma/migrations/<timestamp>_add_reactions/migration.sql`

- [ ] **Step 1: schema.prisma에 Reaction 모델 추가**

`User` 모델 `comments Comment[]` 줄 다음에 `reactions Reaction[]` 추가:

```prisma
  reactions Reaction[]
```

파일 맨 아래(Subscription 모델 다음)에 추가:

```prisma
// 이모지 반응
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

- [ ] **Step 2: 마이그레이션 디렉토리 및 SQL 파일 생성**

현재 타임스탬프 확인:
```bash
date +%Y%m%d%H%M%S
```

해당 타임스탬프로 디렉토리 생성 (예: `20260413120000`):
```bash
mkdir -p /project/source/devlog-server/prisma/migrations/20260413120000_add_reactions
```

파일 생성: `/project/source/devlog-server/prisma/migrations/20260413120000_add_reactions/migration.sql`

```sql
-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_postId_userId_emoji_key" ON "Reaction"("postId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "Reaction_postId_idx" ON "Reaction"("postId");

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 3: 커밋**

```bash
cd /project/source/devlog-server && git add prisma/ && git commit -m "feat: add Reaction model to Prisma schema + migration SQL"
```

- [ ] **Step 4: Docker 이미지 빌드 (마이그레이션 파일 포함)**

```bash
cd /project/server && docker compose up -d --build devlog-server
```

- [ ] **Step 5: 컨테이너에서 마이그레이션 적용**

```bash
cd /project/server && docker compose exec devlog-server npx prisma migrate deploy
```

Expected:
```
1 migration found in prisma/migrations
The following migration was applied:
  20260413120000_add_reactions
```

---

## Task 3: ReactionsService 구현 (TDD)

**Files:**
- Create: `/project/source/devlog-server/src/reactions/dto/reaction.dto.ts`
- Create: `/project/source/devlog-server/src/reactions/reactions.service.ts`
- Create: `/project/source/devlog-server/src/reactions/reactions.service.spec.ts`

- [ ] **Step 1: DTO 생성**

파일 생성: `/project/source/devlog-server/src/reactions/dto/reaction.dto.ts`

```typescript
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export const ALLOWED_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🚀'] as const;
export type AllowedEmoji = (typeof ALLOWED_EMOJIS)[number];

export class ReactionDto {
  @IsString()
  @IsNotEmpty()
  postId: string;

  @IsIn(ALLOWED_EMOJIS)
  emoji: string;
}
```

- [ ] **Step 2: 테스트 먼저 작성**

파일 생성: `/project/source/devlog-server/src/reactions/reactions.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ReactionsService } from './reactions.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  reaction: {
    groupBy: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ReactionsService', () => {
  let service: ReactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<ReactionsService>(ReactionsService);
    jest.clearAllMocks();
  });

  describe('findByPost', () => {
    it('이모지별 count와 reacted 여부를 반환한다', async () => {
      mockPrisma.reaction.groupBy.mockResolvedValue([
        { emoji: '👍', _count: { emoji: 3 } },
        { emoji: '❤️', _count: { emoji: 1 } },
      ]);
      mockPrisma.reaction.findMany.mockResolvedValue([{ emoji: '👍' }]);

      const result = await service.findByPost('post1', 'user1');

      expect(result).toEqual([
        { emoji: '👍', count: 3, reacted: true },
        { emoji: '❤️', count: 1, reacted: false },
      ]);
    });

    it('userId 없으면 reacted는 모두 false', async () => {
      mockPrisma.reaction.groupBy.mockResolvedValue([
        { emoji: '👍', _count: { emoji: 2 } },
      ]);

      const result = await service.findByPost('post1', undefined);

      expect(result).toEqual([{ emoji: '👍', count: 2, reacted: false }]);
      expect(mockPrisma.reaction.findMany).not.toHaveBeenCalled();
    });
  });

  describe('add', () => {
    it('반응을 추가하고 { action: "added" }를 반환한다', async () => {
      mockPrisma.reaction.create.mockResolvedValue({ id: '1' });

      const result = await service.add('user1', { postId: 'post1', emoji: '👍' });

      expect(mockPrisma.reaction.create).toHaveBeenCalledWith({
        data: { postId: 'post1', userId: 'user1', emoji: '👍' },
      });
      expect(result).toEqual({ action: 'added' });
    });
  });

  describe('remove', () => {
    it('반응을 삭제하고 { action: "removed" }를 반환한다', async () => {
      mockPrisma.reaction.delete.mockResolvedValue({ id: '1' });

      const result = await service.remove('user1', { postId: 'post1', emoji: '👍' });

      expect(mockPrisma.reaction.delete).toHaveBeenCalledWith({
        where: {
          postId_userId_emoji: { postId: 'post1', userId: 'user1', emoji: '👍' },
        },
      });
      expect(result).toEqual({ action: 'removed' });
    });
  });
});
```

- [ ] **Step 3: 테스트 실행 (FAIL 확인)**

```bash
cd /project/source/devlog-server && npx jest src/reactions/reactions.service.spec.ts --no-coverage
```

Expected: FAIL — `Cannot find module './reactions.service'`

- [ ] **Step 4: ReactionsService 구현**

파일 생성: `/project/source/devlog-server/src/reactions/reactions.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReactionDto } from './dto/reaction.dto';

@Injectable()
export class ReactionsService {
  constructor(private prisma: PrismaService) {}

  async findByPost(postId: string, userId?: string) {
    const grouped = await this.prisma.reaction.groupBy({
      by: ['emoji'],
      where: { postId },
      _count: { emoji: true },
    });

    const myEmojiSet = new Set<string>();
    if (userId) {
      const mine = await this.prisma.reaction.findMany({
        where: { postId, userId },
        select: { emoji: true },
      });
      mine.forEach((r) => myEmojiSet.add(r.emoji));
    }

    return grouped.map((r) => ({
      emoji: r.emoji,
      count: r._count.emoji,
      reacted: myEmojiSet.has(r.emoji),
    }));
  }

  async add(userId: string, dto: ReactionDto) {
    await this.prisma.reaction.create({
      data: { postId: dto.postId, userId, emoji: dto.emoji },
    });
    return { action: 'added' as const };
  }

  async remove(userId: string, dto: ReactionDto) {
    await this.prisma.reaction.delete({
      where: {
        postId_userId_emoji: {
          postId: dto.postId,
          userId,
          emoji: dto.emoji,
        },
      },
    });
    return { action: 'removed' as const };
  }
}
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
cd /project/source/devlog-server && npx jest src/reactions/reactions.service.spec.ts --no-coverage
```

Expected: 5 tests PASS

- [ ] **Step 6: 커밋**

```bash
cd /project/source/devlog-server && git add src/reactions/dto/ src/reactions/reactions.service.ts src/reactions/reactions.service.spec.ts && git commit -m "feat: add ReactionsService with emoji whitelist DTO"
```

---

## Task 4: ReactionsController + Module + AppModule 등록

**Files:**
- Create: `/project/source/devlog-server/src/reactions/reactions.controller.ts`
- Create: `/project/source/devlog-server/src/reactions/reactions.module.ts`
- Modify: `/project/source/devlog-server/src/app.module.ts`

- [ ] **Step 1: ReactionsController 생성**

파일 생성: `/project/source/devlog-server/src/reactions/reactions.controller.ts`

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { ReactionDto } from './dto/reaction.dto';

@Controller('reactions')
export class ReactionsController {
  constructor(private reactionsService: ReactionsService) {}

  @Get()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findByPost(@Query('postId') postId: string, @Req() req: any) {
    const userId: string | undefined = req.user?.id;
    return this.reactionsService.findByPost(postId, userId);
  }

  @Post()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  add(@Body() dto: ReactionDto, @Req() req: any) {
    const userId: string | undefined = req.user?.id;
    if (!userId) throw new UnauthorizedException('로그인이 필요합니다.');
    return this.reactionsService.add(userId, dto);
  }

  @Delete()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  remove(@Body() dto: ReactionDto, @Req() req: any) {
    const userId: string | undefined = req.user?.id;
    if (!userId) throw new UnauthorizedException('로그인이 필요합니다.');
    return this.reactionsService.remove(userId, dto);
  }
}
```

- [ ] **Step 2: ReactionsModule 생성**

파일 생성: `/project/source/devlog-server/src/reactions/reactions.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';

@Module({
  controllers: [ReactionsController],
  providers: [ReactionsService],
})
export class ReactionsModule {}
```

- [ ] **Step 3: AppModule에 ReactionsModule 등록**

`/project/source/devlog-server/src/app.module.ts` 전체 교체:

```typescript
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AuthMiddleware } from './auth/auth.middleware';
import { CommentsModule } from './comments/comments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReactionsModule } from './reactions/reactions.module';
import { SearchModule } from './search/search.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CommentsModule,
    ReactionsModule,
    SearchModule,
    UserModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*path');
  }
}
```

- [ ] **Step 4: 빌드 확인**

```bash
cd /project/source/devlog-server && npx tsc --noEmit -p tsconfig.build.json
```

Expected: 오류 없음

- [ ] **Step 5: 커밋**

```bash
cd /project/source/devlog-server && git add src/reactions/reactions.controller.ts src/reactions/reactions.module.ts src/app.module.ts && git commit -m "feat: add ReactionsModule (controller + module) and register in AppModule"
```

---

## Task 5: devlog-server 최종 배포 & Smoke Test

Task 4에서 ReactionsModule 등록 후 빌드·배포가 아직 안 된 경우에만 실행.  
(Task 2 Step 4에서 이미 빌드했다면 rebuild만 수행)

- [ ] **Step 1: Docker 이미지 빌드 & 재기동**

```bash
cd /project/server && docker compose up -d --build devlog-server
```

Expected: `devlog-server` 컨테이너 정상 기동.

- [ ] **Step 2: 엔드포인트 smoke test**

```bash
curl -s "http://localhost:3000/api/reactions?postId=test"
```

Expected: `[]`

```bash
curl -s "http://localhost:3000/api/comments?postId=test"
```

Expected: `[]`

---

## Task 6: 프론트엔드 — API 헬퍼

**Files:**
- Create: `src/lib/api.ts`

- [ ] **Step 1: API_BASE 헬퍼 생성**

파일 생성: `/Users/DEV/Personal/Project/Blog/devlog/src/lib/api.ts`

```typescript
// PUBLIC_API_URL = 'http://localhost:3000' 또는 'https://api.dejavlog.com'
// NestJS globalPrefix 'api'를 붙여서 사용
export const API_BASE =
  (import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000') + '/api';
```

- [ ] **Step 2: 커밋**

```bash
cd /Users/DEV/Personal/Project/Blog/devlog && git add src/lib/api.ts && git commit -m "feat: add API_BASE helper for devlog-server endpoints"
```

---

## Task 7: PostReactions 컴포넌트

**Files:**
- Create: `src/components/PostReactions.tsx`

- [ ] **Step 1: 컴포넌트 생성**

파일 생성: `/Users/DEV/Personal/Project/Blog/devlog/src/components/PostReactions.tsx`

```tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
      // 실패 시 서버 상태로 롤백
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
          <div className="absolute bottom-full left-0 mb-2 flex gap-1 rounded-xl border bg-popover p-2 shadow-md z-10">
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
```

- [ ] **Step 2: 커밋**

```bash
cd /Users/DEV/Personal/Project/Blog/devlog && git add src/components/PostReactions.tsx && git commit -m "feat: add PostReactions component (emoji reactions with optimistic update)"
```

---

## Task 8: PostComments 컴포넌트

**Files:**
- Create: `src/components/PostComments.tsx`

- [ ] **Step 1: 컴포넌트 생성**

파일 생성: `/Users/DEV/Personal/Project/Blog/devlog/src/components/PostComments.tsx`

```tsx
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
      {/* 댓글 본문 */}
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

      {/* 인라인 답글 입력창 */}
      {replyingTo === comment.id && (
        <ReplyInput
          submitting={submitting}
          onCancel={() => onReplyToggle(comment.id)}
          onSubmit={(content) => onReplySubmit(content, comment.id)}
        />
      )}

      {/* 대댓글 목록 */}
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

      {/* 댓글 목록 */}
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

      {/* 작성 폼 */}
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
```

- [ ] **Step 2: 커밋**

```bash
cd /Users/DEV/Personal/Project/Blog/devlog && git add src/components/PostComments.tsx && git commit -m "feat: add PostComments component (1-depth replies, auth-gated)"
```

---

## Task 9: [...id].astro 통합

**Files:**
- Modify: `src/pages/blog/[...id].astro`

- [ ] **Step 1: import 추가 및 컴포넌트 삽입**

`src/pages/blog/[...id].astro`의 frontmatter import 블록(`---`) 안에 추가:

```astro
import PostReactions from '@/components/PostReactions'
import PostComments from '@/components/PostComments'
```

기존 `<article>` 블록 다음, 두 번째 `<PostNavigation />` 바로 앞에 삽입:

```astro
    <div class="col-start-2 flex flex-col gap-y-10 mt-4">
      <PostReactions postId={currentPostId} client:load />
      <PostComments postId={currentPostId} client:load />
    </div>
```

변경 후 해당 영역 전체 구조 확인:

```astro
    <article class="prose col-start-2 max-w-none">
      <Content />
    </article>

    <div class="col-start-2 flex flex-col gap-y-10 mt-4">
      <PostReactions postId={currentPostId} client:load />
      <PostComments postId={currentPostId} client:load />
    </div>

    <PostNavigation prevPost={prev} nextPost={next} />
```

- [ ] **Step 2: 빌드 확인**

```bash
cd /Users/DEV/Personal/Project/Blog/devlog && npm run build 2>&1 | tail -20
```

Expected: 오류 없이 빌드 완료

- [ ] **Step 3: 커밋**

```bash
cd /Users/DEV/Personal/Project/Blog/devlog && git add src/pages/blog/[...id].astro && git commit -m "feat: integrate PostReactions and PostComments into blog post page"
```

---

## Task 10: 통합 검증

- [ ] **Step 1: 개발 서버 기동 (LOCAL devlog-server 필요)**

터미널 1 (mlink-linux SSH 또는 로컬):
```bash
cd /project/source/devlog-server && npm run start:dev
```

터미널 2:
```bash
cd /Users/DEV/Personal/Project/Blog/devlog && npm run dev
```

- [ ] **Step 2: 브라우저에서 포스트 페이지 확인**

`http://localhost:1234/blog/<임의 포스트 slug>` 접속

체크리스트:
- [ ] 반응 섹션 렌더링 확인 (😊+ 버튼 보임)
- [ ] 댓글 섹션 렌더링 확인 ("첫 댓글을 작성해보세요." 표시)
- [ ] 미로그인 상태에서 😊+ 클릭 → LoginModal 표시
- [ ] 미로그인 상태에서 댓글 폼 → "로그인하세요" + 로그인 버튼

- [ ] **Step 3: SSO 로그인 후 기능 검증**

SSO 로그인 후 체크리스트:
- [ ] 반응 추가 → 윗줄에 카운트 표시, 강조
- [ ] 반응 재클릭 → 제거 (카운트 감소, 0이면 사라짐)
- [ ] 댓글 작성 → 목록에 바로 표시
- [ ] 댓글 삭제 → 목록에서 제거 (본인 댓글만 삭제 버튼 보임)
- [ ] 답글 달기 클릭 → 인라인 입력창 표시
- [ ] 답글 작성 → 댓글 하위에 들여쓰기로 표시
- [ ] 답글에는 "답글 달기" 버튼 없음 확인

- [ ] **Step 4: 보안 검증**

```bash
# HTML inject 차단 확인 (로그인 상태에서 실행)
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -H "Cookie: <세션쿠키>" \
  -d '{"postId":"test","content":"<script>alert(1)</script>XSS"}'
```

Expected: content 필드에 `XSS`만 저장됨 (태그 제거)

```bash
# 허용되지 않은 이모지 차단 확인
curl -X POST http://localhost:3000/api/reactions \
  -H "Content-Type: application/json" \
  -H "Cookie: <세션쿠키>" \
  -d '{"postId":"test","emoji":"💩"}'
```

Expected: `400 Bad Request`
