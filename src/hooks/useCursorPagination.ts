import { useCallback, useState } from 'react'

export default function useCursorPagination(loading: boolean) {
  const [cursor, setCursor] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [cursorStack, setCursorStack] = useState<string[]>([])
  const [page, setPage] = useState(1)

  const resetPagination = useCallback((clearNextCursor = false) => {
    setCursor(null)
    if (clearNextCursor) setNextCursor(null)
    setCursorStack([])
    setPage(1)
  }, [])

  const goNext = useCallback(() => {
    if (!nextCursor || loading) return
    setCursorStack((prev) => [...prev, cursor || ''])
    setCursor(nextCursor)
    setPage((prev) => prev + 1)
  }, [cursor, loading, nextCursor])

  const goPrevious = useCallback(() => {
    if (!cursorStack.length || loading) return
    const nextStack = [...cursorStack]
    const prevCursor = nextStack.pop() || ''
    setCursorStack(nextStack)
    setCursor(prevCursor || null)
    setPage((prev) => Math.max(1, prev - 1))
  }, [cursorStack, loading])

  return {
    cursor,
    nextCursor,
    setNextCursor,
    cursorStack,
    page,
    resetPagination,
    goNext,
    goPrevious,
  }
}
