import { getCollection, type CollectionEntry } from 'astro:content'

export async function getAllPosts(): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getCollection('blog')

  return posts
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
}

export async function getRecentPosts(
  count: number,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getAllPosts()
  return posts.slice(0, count)
}

function basename(id: string): string {
  return id.split('/').pop() ?? id
}

function resolvePostBySlug(
  slug: string | null | undefined,
  posts: CollectionEntry<'blog'>[],
): CollectionEntry<'blog'> | null {
  if (!slug) return null
  return (
    posts.find((p) => p.id === slug || basename(p.id) === slug) ?? null
  )
}

export async function getPostsBySeries(
  name: string,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getAllPosts()
  const inSeries = posts.filter((p) => p.data.series === name)

  const byId = new Map(inSeries.map((p) => [p.id, p]))
  const byBase = new Map(inSeries.map((p) => [basename(p.id), p]))
  const resolve = (slug: string | null | undefined) =>
    slug ? (byId.get(slug) ?? byBase.get(slug) ?? null) : null

  const head =
    inSeries.find((p) => !resolve(p.data.prev)) ?? inSeries[0] ?? null
  if (!head) return []

  const ordered: CollectionEntry<'blog'>[] = []
  const visited = new Set<string>()
  let cursor: CollectionEntry<'blog'> | null = head
  while (cursor && !visited.has(cursor.id)) {
    visited.add(cursor.id)
    ordered.push(cursor)
    cursor = resolve(cursor.data.next)
  }

  for (const p of inSeries) {
    if (!visited.has(p.id)) ordered.push(p)
  }
  return ordered
}

export async function getAllSeries(): Promise<
  { series: string; count: number; firstPostId: string }[]
> {
  const posts = await getAllPosts()
  const map = new Map<string, CollectionEntry<'blog'>[]>()
  for (const p of posts) {
    const s = p.data.series
    if (!s) continue
    if (!map.has(s)) map.set(s, [])
    map.get(s)!.push(p)
  }
  const result: { series: string; count: number; firstPostId: string }[] = []
  for (const [series, list] of map.entries()) {
    const ordered = await getPostsBySeries(series)
    result.push({
      series,
      count: list.length,
      firstPostId: ordered[0]?.id ?? list[0].id,
    })
  }
  return result.sort((a, b) => {
    const d = b.count - a.count
    return d !== 0 ? d : a.series.localeCompare(b.series)
  })
}

export async function getSeriesAdjacent(
  post: CollectionEntry<'blog'>,
): Promise<{
  prev: CollectionEntry<'blog'> | null
  next: CollectionEntry<'blog'> | null
}> {
  const posts = await getAllPosts()
  return {
    prev: resolvePostBySlug(post.data.prev, posts),
    next: resolvePostBySlug(post.data.next, posts),
  }
}

export async function getAdjacentPosts(currentId: string): Promise<{
  prev: CollectionEntry<'blog'> | null
  next: CollectionEntry<'blog'> | null
}> {
  const posts = await getAllPosts()
  const current = posts.find((p) => p.id === currentId)

  if (current?.data.series) {
    return getSeriesAdjacent(current)
  }

  const currentIndex = posts.findIndex((post) => post.id === currentId)
  if (currentIndex === -1) return { prev: null, next: null }

  return {
    next: currentIndex > 0 ? posts[currentIndex - 1] : null,
    prev: currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null,
  }
}

export async function getAllAuthors(): Promise<CollectionEntry<'authors'>[]> {
  return await getCollection('authors')
}

export async function getAllProjects(): Promise<CollectionEntry<'projects'>[]> {
  const projects = await getCollection('projects')
  return projects.sort((a, b) => {
    const dateA = a.data.startDate?.getTime() || 0
    const dateB = b.data.startDate?.getTime() || 0
    return dateB - dateA
  })
}

export async function getAllPureCategories(): Promise<Array<string>> {
  const posts = await getAllPosts()

  return posts.map((post) => post.data.category!)
}

export async function getAllCategories(): Promise<Map<string, number>> {
  const posts = await getAllPosts()

  return posts.reduce((acc, post) => {
    const category = post.data.category
    acc.set(category, (acc.get(category) || 0) + 1)
    return acc
  }, new Map<string, number>())
}

export async function getSortedCategoriesByCount(): Promise<
  { category: string; count: number }[]
> {
  const categoryCounts = await getAllCategories()

  return [...categoryCounts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => {
      const countDiff = b.count - a.count
      return countDiff !== 0 ? countDiff : a.category.localeCompare(b.category)
    })
}

export async function getAllTags(): Promise<Map<string, number>> {
  const posts = await getAllPosts()

  return posts.reduce((acc, post) => {
    post.data.tags?.forEach((tag) => {
      acc.set(tag, (acc.get(tag) || 0) + 1)
    })
    return acc
  }, new Map<string, number>())
}

export async function getSortedTags(): Promise<
  { tag: string; count: number }[]
> {
  const tagCounts = await getAllTags()

  return [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => {
      const countDiff = b.count - a.count
      return countDiff !== 0 ? countDiff : a.tag.localeCompare(b.tag)
    })
}

export function groupPostsByYear(
  posts: CollectionEntry<'blog'>[],
): Record<string, CollectionEntry<'blog'>[]> {
  return posts.reduce(
    (acc: Record<string, CollectionEntry<'blog'>[]>, post) => {
      const year = post.data.date.getFullYear().toString()
      ;(acc[year] ??= []).push(post)
      return acc
    },
    {},
  )
}

export async function parseAuthors(authorIds: string[] = []) {
  if (!authorIds.length) return []

  const allAuthors = await getAllAuthors()
  const authorMap = new Map(allAuthors.map((author) => [author.id, author]))

  return authorIds.map((id) => {
    const author = authorMap.get(id)

    return {
      id,
      name: author?.data?.name || id,
      avatar: author?.data?.avatar || '/static/logo.png',
      isRegistered: !!author,
    }
  })
}

export async function getPostsByAuthor(
  authorId: string,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.data.authors?.includes(authorId))
}

export async function getPostsByTag(
  tag: string,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.data.tags?.includes(tag))
}

export async function getPostsByCategory(
  category: string,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => category === post.data.category)
}
