import type { IconMap, SocialLink, Site, Color } from '@/types'

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
    href: '/tags',
    label: '태그',
  },
  // {
  //   href: '/authors',
  //   label: '작성자',
  // },
  {
    href: '/about',
    label: 'About',
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
  Twitter: 'lucide:twitter',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
}

export const THEME_COLORS: Color[] = [
  {
    label: 'root', color: '#000000'
  },
  {
    label: 'dark', color: '#000000'
  },
  {
    label: 'floral', color: '#000000'
  },
  {
    label: 'oldLace', color: '#000000'
  },
  {
    label: 'royalBlue', color: '#000000'
  },
  {
    label: 'forestGreen', color: '#000000'
  },
  {
    label: 'yellowGreen', color: '#000000'
  },
  {
    label: 'lightGray', color: '#000000'
  },
]
