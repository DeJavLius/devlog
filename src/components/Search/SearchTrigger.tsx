import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import SearchModal from './SearchModal'

const SearchTrigger = () => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        title="검색 (⌘K)"
        aria-label="검색 열기"
      >
        <Search className="h-5 w-5" />
      </Button>
      <SearchModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default SearchTrigger
