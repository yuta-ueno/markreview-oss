import { useCallback, useRef, useEffect, type RefCallback } from 'react'
import { logger } from '../utils/logger'

export interface ScrollSyncOptions {
  enabled?: boolean
  throttleDelay?: number
  editorSelector?: string
  previewSelector?: string
  // New: allow passing scroller elements directly
  editorEl?: HTMLElement | null
  previewEl?: HTMLElement | null
}

export const useScrollSync = (options: ScrollSyncOptions = {}) => {
  const {
    enabled = true,
    throttleDelay = 100,
    editorSelector = '.cm-scroller',
    previewSelector = '.preview-content',
  } = options
  
  const editorRef = useRef<HTMLDivElement | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const isScrollingSyncRef = useRef(false)
  const throttleTimerRef = useRef<number | null>(null)
  const attachedEditorElRef = useRef<HTMLElement | null>(null)
  const attachedPreviewElRef = useRef<HTMLElement | null>(null)
  const editorObserverRef = useRef<MutationObserver | null>(null)
  const previewObserverRef = useRef<MutationObserver | null>(null)

  // Get scroll elements (CodeMirror scroller and preview content)
  const getScrollElements = useCallback(() => {
    const editorScroller = (options.editorEl ?? (editorRef.current?.querySelector(editorSelector) as HTMLElement | null)) || undefined
    const previewScroller = (options.previewEl ?? (previewRef.current?.querySelector(previewSelector) as HTMLElement | null)) || undefined
    
    // Debug logging
    logger.debug('ScrollSync: Getting elements', {
      editorRef: !!editorRef.current,
      previewRef: !!previewRef.current,
      editorScroller: !!editorScroller,
      previewScroller: !!previewScroller,
      editorScrollerClass: editorScroller?.className,
      previewScrollerClass: previewScroller?.className
    })
    
    return { editorScroller, previewScroller }
  }, [editorSelector, previewSelector, options.editorEl, options.previewEl])

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
          
          logger.debug('ScrollSync: Syncing scroll', {
            sourceElement: sourceElement.className,
            targetElement: targetElement.className,
            scrollPercentage: scrollPercentage.toFixed(3),
          })
          
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

  // Attach listeners to current elements, replacing previous bindings if needed
  const attachListenersIfReady = useCallback(() => {
    if (!enabled) return
    const { editorScroller, previewScroller } = getScrollElements()
    if (!(editorScroller && previewScroller)) return

    // Rebind if targets changed
    if (attachedEditorElRef.current !== editorScroller || attachedPreviewElRef.current !== previewScroller) {
      if (attachedEditorElRef.current) {
        attachedEditorElRef.current.removeEventListener('scroll', handleEditorScroll)
      }
      if (attachedPreviewElRef.current) {
        attachedPreviewElRef.current.removeEventListener('scroll', handlePreviewScroll)
      }
      editorScroller.addEventListener('scroll', handleEditorScroll, { passive: true })
      previewScroller.addEventListener('scroll', handlePreviewScroll, { passive: true })
      attachedEditorElRef.current = editorScroller
      attachedPreviewElRef.current = previewScroller
      logger.debug('ScrollSync: listeners attached/refreshed')
    }
  }, [enabled, getScrollElements, handleEditorScroll, handlePreviewScroll])

  // Setup scroll listeners and observe DOM changes (robust for delayed mount e.g., Tauri WebView)
  useEffect(() => {
    attachListenersIfReady()

    // Observe for dynamic creation (e.g., CodeMirror scroller)
    const edNode = editorRef.current
    const pvNode = previewRef.current
    if (typeof MutationObserver !== 'undefined') {
      if (edNode) {
        editorObserverRef.current?.disconnect()
        editorObserverRef.current = new MutationObserver(() => attachListenersIfReady())
        editorObserverRef.current.observe(edNode, { childList: true, subtree: true })
      }
      if (pvNode) {
        previewObserverRef.current?.disconnect()
        previewObserverRef.current = new MutationObserver(() => attachListenersIfReady())
        previewObserverRef.current.observe(pvNode, { childList: true, subtree: true })
      }
    }

    return () => {
      // Cleanup listeners
      if (attachedEditorElRef.current) {
        attachedEditorElRef.current.removeEventListener('scroll', handleEditorScroll)
      }
      if (attachedPreviewElRef.current) {
        attachedPreviewElRef.current.removeEventListener('scroll', handlePreviewScroll)
      }
      attachedEditorElRef.current = null
      attachedPreviewElRef.current = null

      // Cleanup observers and timers
      editorObserverRef.current?.disconnect()
      previewObserverRef.current?.disconnect()
      if (throttleTimerRef.current) window.clearTimeout(throttleTimerRef.current)
    }
  }, [attachListenersIfReady])

  // Refs to be attached to editor and preview containers
  const editorScrollRef: RefCallback<HTMLDivElement> = useCallback((node) => {
    editorRef.current = node
  }, [])

  const previewScrollRef: RefCallback<HTMLDivElement> = useCallback((node) => {
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
    
    logger.debug('ScrollSync: Reset scroll positions to top')
  }, [getScrollElements])

  return {
    editorScrollRef,
    previewScrollRef,
    resetScrollPositions,
  }
}
