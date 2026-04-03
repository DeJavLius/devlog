import type { IconMap, SocialLink, Site, Color } from '@/types'

export const SITE: Site = {
  title: 'DevLog',
  locale: 'ko-KR',
  description: '개발 기록과 기술 정리를 담은 블로그',
  href: 'https://link-devlog.netlify.app',
  featuredPostCount: 5,
  postsPerPage: 10,
}

export const NAV_LINKS: SocialLink[] = [
  {
    href: '/blog',
    label: '게시글',
  },
  {
    href: '/classification',
    label: '분류',
  },
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
    label: 'light',
  },
  {
    label: 'dark',
  },
  {
    label: 'cream',
  },
  {
    label: 'royal-blue',
  },
  {
    label: 'pistachio',
  },
]
