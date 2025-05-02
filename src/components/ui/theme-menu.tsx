import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { THEME_COLORS } from '@/consts'
import { Palette } from 'lucide-react'

const ThemeMenu = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleViewTransitionStart = () => {
      setIsOpen(false)
    }

    document.addEventListener('astro:before-swap', handleViewTransitionStart)

    return () => {
      document.removeEventListener(
        'astro:before-swap',
        handleViewTransitionStart,
      )
    }
  }, [])

  const handleClick = (color: string) => {
    const $docElement = document.documentElement
    const themeArray = $docElement.classList.values()

    $docElement.classList.add('disable-transitions')
    themeArray.forEach((element) => {
      if (element !== color) {
        $docElement.classList.remove(element)
      }
    })

    $docElement.classList.add(color)
    window.getComputedStyle($docElement).getPropertyValue('opacity')

    requestAnimationFrame(() => {
      $docElement.classList.remove('disable-transitions')
    })

    localStorage.setItem('theme', color)
  }

  document.addEventListener('astro:after-swap', () => {
    const storedTheme = localStorage.getItem('theme')
    const $docElement = document.documentElement
    const themeArray = $docElement.classList.values()

    $docElement.classList.add('disable-transitions')

    window.getComputedStyle($docElement).getPropertyValue('opacity')

    themeArray.forEach((element) => {
      if (element !== storedTheme) {
        $docElement.classList.add(storedTheme!)
      } else {
        $docElement.classList.remove(element)
      }
    })

    requestAnimationFrame(() => {
      $docElement.classList.remove('disable-transitions')
    })
  })

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" title="Theme Palette">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-background w-auto min-w-[2rem]"
      >
        {THEME_COLORS.map((item) => (
          <DropdownMenuItem key={item.label} className="size-2" asChild>
            <div
              className="m-0 h-auto w-auto"
              id={item.label}
              onClick={() => {
                handleClick(item.label)
                setIsOpen(false)
              }}
            >
              <div
                data-color={item.label === 'light' ? 'root' : item.label}
                className="bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 -mx-1 h-4.5 w-4.5 rounded-lg border shadow-xs"
                id={item.label}
                title={item.label}
              ></div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ThemeMenu
