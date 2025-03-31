import type { IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: 'DevLog',
  locale: 'ko-KR',
  description:
    '블로그 테마: astro-erudite 기술: Astro, Tailwind, shadcn/ui. \n 경로: https://astro-erudite.vercel.app',
  href: 'https://link-devlog.netlify.app',
  featuredPostCount: 2,
  postsPerPage: 5,
}

export const NAV_LINKS: SocialLink[] = [
  {
    href: '/blog',
    label: '게시글',
  },
  {
    href: '/category',
    label: '카테고리',
  },
  {
    href: '/authors',
    label: 'DeJavLius',
  },
  {
    href: '/about',
    label: 'about',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://github.com/DeJavLius',
    label: 'GitHub',
  },
  // {
  //   href: 'https://twitter.com/enscry',
  //   label: 'Twitter',
  // },
  // {
  //   href: 'mailto:jason@enscribe.dev',
  //   label: 'Email',
  // },
  {
    href: '/rss.xml',
    label: 'RSS',
  },
]

export const ICON_MAP: IconMap = {
  Website: 'lucide:globe',
  GitHub: 'lucide:github',
  LinkedIn: 'lucide:linkedin',
  // Twitter: 'lucide:twitter',
  // Email: 'lucide:mail',
  RSS: 'lucide:rss',
}
