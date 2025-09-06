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
    
    // Debug logging
    console.log('ScrollSync: Getting elements', {
      editorRef: !!editorRef.current,
      previewRef: !!previewRef.current,
      editorScroller: !!editorScroller,
      previewScroller: !!previewScroller,
      editorScrollerClass: editorScroller?.className,
      previewScrollerClass: previewScroller?.className
    })
    
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
          
          console.log('ScrollSync: Syncing scroll', {
            sourceElement: sourceElement.className,
            targetElement: targetElement.className,
            scrollPercentage: scrollPercentage.toFixed(3),
            sourceScrollTop: sourceElement.scrollTop,
            sourceScrollHeight: sourceElement.scrollHeight
          })
          
          setScrollPercentage(targetElement, scrollPercentage)
          
          // Reset the flag after a short delay
          window.setTimeout(() => {
            isScrollingSyncRef.current = false
          }, 50)
        } else {
          console.log('ScrollSync: Sync skipped', {
            isScrollingSyncRef: isScrollingSyncRef.current,
            enabled
          })
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

  // Setup scroll listeners with retry mechanism
  useEffect(() => {
    if (!enabled) return

    let retryCount = 0
    const maxRetries = 10
    let cleanupFunctions: (() => void)[] = []

    const setupListeners = () => {
      const { editorScroller, previewScroller } = getScrollElements()
      
      console.log('ScrollSync: Setting up listeners', {
        retryCount,
        editorScroller: !!editorScroller,
        previewScroller: !!previewScroller
      })
      
      if (editorScroller && previewScroller) {
        // Both elements found, setup listeners
        editorScroller.addEventListener('scroll', handleEditorScroll, { passive: true })
        previewScroller.addEventListener('scroll', handlePreviewScroll, { passive: true })
        
        console.log('ScrollSync: Listeners attached successfully')
        
        // Return cleanup function
        return () => {
          editorScroller.removeEventListener('scroll', handleEditorScroll)
          previewScroller.removeEventListener('scroll', handlePreviewScroll)
        }
      } else if (retryCount < maxRetries) {
        // Elements not ready, retry after a delay
        console.log('ScrollSync: Elements not ready, retrying...', {
          retryCount,
          willRetryAfter: '100ms'
        })
        
        const timeoutId = setTimeout(() => {
          retryCount++
          const cleanupFn = setupListeners()
          if (cleanupFn) {
            cleanupFunctions.push(cleanupFn)
          }
        }, 100)
        
        return () => clearTimeout(timeoutId)
      } else {
        console.warn('ScrollSync: Max retries reached, could not find scroll elements')
        return () => {}
      }
    }

    const initialCleanup = setupListeners()
    if (initialCleanup) {
      cleanupFunctions.push(initialCleanup)
    }

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup())
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

  // Reset scroll positions to top
  const resetScrollPositions = useCallback(() => {
    const { editorScroller, previewScroller } = getScrollElements()
    
    // Reset editor scroll position
    if (editorScroller) {
      editorScroller.scrollTop = 0
    }
    
    // Reset preview scroll position  
    if (previewScroller) {
      previewScroller.scrollTop = 0
    }
    
    console.log('ScrollSync: Reset scroll positions to top', {
      editorScroller: !!editorScroller,
      previewScroller: !!previewScroller
    })
  }, [getScrollElements])

  return {
    editorScrollRef,
    previewScrollRef,
    resetScrollPositions,
  }
}