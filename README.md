<div align="center">

## astro-erudite
- custom by DeJavLius for my blog

[![License]](LICENSE)

</div>

astro-erudite is an opinionated, unstyled static blogging template built with [Astro](https://astro.build/), [Tailwind](https://tailwindcss.com/), and [shadcn/ui](https://ui.shadcn.com/). Extraordinarily loosely based off the [Astro Micro](https://astro-micro.vercel.app/) theme by [trevortylerlee](https://github.com/trevortylerlee)

## Other Theme Examples

Below are some fantastic examples of websites based on this template. If you wish to add your site to this list, open a pull request!

| Site                                          | Author                                             | Description/Features                                                                         | Source                                                 |
| --------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [enscribe.dev](https://enscribe.dev)          | [@jktrn](https://github.com/jktrn)                 | Heavily modified bento-style homepage with client interactivity, with custom MDX components! | [→](https://github.com/jktrn/enscribe.dev)             |
| [emile.sh](https://emile.sh)                  | [@echoghi](https://github.com/echoghi)             | A minimalist personal blog using the [flexoki](https://stephango.com/flexoki) theme          | [→](https://github.com/echoghi/v5)                     |
| [decentparadox.me](https://decentparadox.me)  | [@decentparadox](https://github.com/decentparadox) | A heavily customized personal portfolio with a sci-fi theme!                                 | [→](https://github.com/decentparadox/decentparadox.me) |
| [flocto.github.io](https://flocto.github.io/) | [@flocto](https://github.com/flocto)               | A slightly modified personal blog                                                            | [→](https://github.com/flocto/flocto.github.io)        |
| [dumbprism.me](https://www.dumbprism.me/)     | [@dumbprism](https://github.com/dumbprism)         | A customized portfolio inspired by enscribe's bento grid style adding my gist of UI          | [→](https://github.com/dumbprism/dumbprism-portfolio)  |
| [hyuki.dev](https://hyuki.dev/)               | [@snow0406](https://github.com/snow0406)           | A minimalist blog with a blue color scheme, focusing on simplicity!                          | [→](https://github.com/Snow0406/hyuki.dev)             |
| [ldd.cc](https://ldd.cc/)                     | [@xJoyLu](https://github.com/xjoylu)               | The cream of the idlers.                                                                     | [→](https://ldd.cc/)                    |

## Technology Stack

This is a list of the various technologies used to build this blog:

| Category   | Technology Name                                                                            |
| ---------- | ------------------------------------------------------------------------------------------ |
| Framework  | [Astro](https://astro.build/)                                                              |
| Styling    | [Tailwind](https://tailwindcss.com)                                                        |
| Components | [shadcn/ui](https://ui.shadcn.com/)                                                        |
| Content    | [Obsidian](https://obsidian.md/)                                                                  |
| Codeblocks | [Expressive Code](https://expressive-code.com/), [Shiki](https://github.com/shikijs/shiki) |
| Deployment | [Netlify](https://www.netlify.com/)                                                        |

### Color Palette

Colors are defined in `src/styles/global.css` in [OKLCH format](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch), using the [shadcn/ui](https://ui.shadcn.com/) convention:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}

.dark {
  /* ... */
}
```

The author schema is defined as follows:

| Field      | Type (Zod)                                 | Requirements                                                                                                                                                             | Required |
| ---------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `name`     | `string`                                   | n/a                                                                                                                                                                      | Yes      |
| `pronouns` | `string`                                   | n/a                                                                                                                                                                      | Optional |
| `avatar`   | `string.url()` or `string.startsWith('/')` | Should be either a valid URL or a path starting with `/`. Preferably use [Gravatar](https://en.gravatar.com/site/implement/images/) with the `?size=256` size parameter. | Yes      |
| `bio`      | `string`                                   | n/a                                                                                                                                                                      | Optional |
| `mail`     | `string.email()`                           | Must be a valid email address.                                                                                                                                           | Optional |
| `website`  | `string.url()`                             | Must be a valid URL.                                                                                                                                                     | Optional |
| `twitter`  | `string.url()`                             | Must be a valid URL.                                                                                                                                                     | Optional |
| `github`   | `string.url()`                             | Must be a valid URL.                                                                                                                                                     | Optional |
| `linkedin` | `string.url()`                             | Must be a valid URL.                                                                                                                                                     | Optional |
| `discord`  | `string.url()`                             | Must be a valid URL.                                                                                                                                                     | Optional |

> [!TIP]
> You can add as many social media links as you want, as long as you adjust the schema! Make sure you also support the new field in the `src/components/SocialIcons.astro` component.

## License

This project is open source and available under the [MIT License](LICENSE).

---

Built with &hearts; by [enscribe](https://enscribe.dev)!

Edit by Me, by DeJavLius

[License]: https://img.shields.io/github/license/jktrn/astro-erudite?color=0a0a0a&logo=github&logoColor=fff&style=for-the-badge
