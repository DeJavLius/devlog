export type Site = {
  title: string
  description: string
  href: string
  locale: string
  featuredPostCount: number
  postsPerPage: number
}

export type SocialLink = {
  href: string
  label: string
}

export type IconMap = {
  [key: string]: string
}

export type Color = {
  [key: string]: string
}

export type Content = {
  path: 'src/content'
  type: 'blog' | 'projects' | 'authors'
}

export type AllContent = {
  fullPath: `${Content['path']}/${Content['type']}`;
}
