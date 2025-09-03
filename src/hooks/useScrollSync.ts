import { useCallback, useRef, useEffect } from 'react'

export interface ScrollSyncOptions {
  enabled?: boolean
  throttleDelay?: number
}

export const useScrollSync = (options: ScrollSyncOptions = {}) => {
  const { enabled = true, throttleDelay = 100 } = options
  
  const editorRef = useRef<HTMLElement | null>(null)
  const previewRef = useRef<HTMLElement | null>(null)
  const isScrollingSyncRef = useRef(false)
  const throttleTimerRef = useRef<number | null>(null)

  // Get scroll elements (CodeMirror scroller and preview content)
  const getScrollElements = useCallback(() => {
    const editorScroller = editorRef.current?.querySelector('.cm-scroller') as HTMLElement
    const previewScroller = previewRef.current?.querySelector('.preview-content') as HTMLElement
    
    return { editorScroller, previewScroller }
  }, [])

  // Calculate scroll percentage
  const getScrollPercentage = useCallback((element: HTMLElement): number => {
    const { scrollTop, scrollHeight, clientHeight } = element
    const maxScroll = scrollHeight - clientHeight
    return maxScroll > 0 ? scrollTop / maxScroll : 0
  }, [])

  // Set scroll percentage
  const setScrollPercentage = useCallback((element: HTMLElement, percentage: number) => {
    const { scrollHeight, clientHeight } = element
    const maxScroll = scrollHeight - clientHeight
    const targetScrollTop = maxScroll * percentage
    
    element.scrollTo({
      top: targetScrollTop,
      behavior: 'auto' // Use auto to avoid conflicts during sync
    })
  }, [])

  // Throttled sync function
  const throttledSync = useCallback(
    (sourceElement: HTMLElement, targetElement: HTMLElement) => {
      if (throttleTimerRef.current) {
        window.clearTimeout(throttleTimerRef.current)
      }

      throttleTimerRef.current = window.setTimeout(() => {
        if (!isScrollingSyncRef.current && enabled) {
          isScrollingSyncRef.current = true
          const scrollPercentage = getScrollPercentage(sourceElement)
          setScrollPercentage(targetElement, scrollPercentage)
          
          // Reset the flag after a short delay
          window.setTimeout(() => {
            isScrollingSyncRef.current = false
          }, 50)
        }
      }, throttleDelay)
    },
    [enabled, throttleDelay, getScrollPercentage, setScrollPercentage]
  )

  // Editor scroll handler
  const handleEditorScroll = useCallback(() => {
    const { editorScroller, previewScroller } = getScrollElements()
    if (editorScroller && previewScroller && !isScrollingSyncRef.current) {
      throttledSync(editorScroller, previewScroller)
    }
  }, [getScrollElements, throttledSync])

  // Preview scroll handler  
  const handlePreviewScroll = useCallback(() => {
    const { editorScroller, previewScroller } = getScrollElements()
    if (editorScroller && previewScroller && !isScrollingSyncRef.current) {
      throttledSync(previewScroller, editorScroller)
    }
  }, [getScrollElements, throttledSync])

  // Setup scroll listeners
  useEffect(() => {
    if (!enabled) return

    const { editorScroller, previewScroller } = getScrollElements()
    
    if (editorScroller) {
      editorScroller.addEventListener('scroll', handleEditorScroll, { passive: true })
    }
    
    if (previewScroller) {
      previewScroller.addEventListener('scroll', handlePreviewScroll, { passive: true })
    }

    return () => {
      if (editorScroller) {
        editorScroller.removeEventListener('scroll', handleEditorScroll)
      }
      if (previewScroller) {
        previewScroller.removeEventListener('scroll', handlePreviewScroll)
      }
      if (throttleTimerRef.current) {
        window.clearTimeout(throttleTimerRef.current)
      }
    }
  }, [enabled, handleEditorScroll, handlePreviewScroll, getScrollElements])

  // Refs to be attached to editor and preview containers
  const editorScrollRef = useCallback((node: HTMLElement | null) => {
    editorRef.current = node
  }, [])

  const previewScrollRef = useCallback((node: HTMLElement | null) => {
    previewRef.current = node
  }, [])

  return {
    editorScrollRef,
    previewScrollRef,
  }
}