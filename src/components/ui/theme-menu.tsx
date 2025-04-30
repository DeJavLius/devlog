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
  const [isOpen, setIsOpen] = useState(false);

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
  }, []);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          title="Theme Palette"
        >
          <Palette className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className="bg-background min-w-[2rem] w-auto"
      >
        {THEME_COLORS.map((item) => (
          <DropdownMenuItem key={item.label} 
            className="size-2"
          asChild>
            <div className="h-auto w-auto m-0"
              onClick={() => {
                setIsOpen(false);
              }}
            >
              <div data-color={item.label}
                className="border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 rounded-lg h-4.5 w-4.5 -mx-1"
                title={item.label === "root" ? "light": item.label}
              >
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ThemeMenu
