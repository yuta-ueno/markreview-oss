import { useState, useCallback, useRef } from 'react'
import { logger } from '../utils/logger'
import { ToastMessage } from '../components/Toast'

interface UseToastOptions {
  defaultDuration?: number
}

export const useToast = ({ defaultDuration = 4000 }: UseToastOptions = {}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  // Deduplicate identical messages within a short window to avoid double toasts
  const recentMapRef = useRef<Record<string, number>>({})

  const addToast = useCallback((
    message: string, 
    type: ToastMessage['type'] = 'info', 
    duration = defaultDuration
  ) => {
    const now = Date.now()
    const key = `${type}:${message}`
    const last = recentMapRef.current[key] || 0
    // Suppress duplicates within 2000ms
    if (now - last < 2000) {
      return ''
    }

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const toast: ToastMessage = {
      id,
      message,
      type,
      duration
    }

    setToasts(prev => [...prev, toast])
    recentMapRef.current[key] = now
    // Clean entry after some time to prevent unbounded growth
    setTimeout(() => {
      // Only delete if the stored timestamp matches (avoid race with newer one)
      if (recentMapRef.current[key] === now) {
        delete recentMapRef.current[key]
      }
    }, Math.max(duration, 2000))
    return id
  }, [defaultDuration])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Enhanced convenience methods with type parameter
  const success = useCallback((message: string, duration?: number) => {
    addToast(message, 'success', duration)
  }, [addToast])

  const error = useCallback((message: string, duration?: number) => {
    addToast(message, 'error', duration)
  }, [addToast])

  const warning = useCallback((message: string, duration?: number) => {
    addToast(message, 'warning', duration)
  }, [addToast])

  const info = useCallback((message: string, duration?: number) => {
    addToast(message, 'info', duration)
  }, [addToast])

  // Enhanced toast method with type parameter
  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info', duration?: number) => {
    addToast(message, type, duration)
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showToast,
    success,
    error,
    warning,
    info
  }
}

// Error handling utilities
export const handleFileError = (
  error: unknown, 
  operation: 'open' | 'save' | 'create' | 'load',
  showToast: (message: string, duration?: number) => void
) => {
  logger.error(`File ${operation} error:`, error)

  let message = `Failed to ${operation} file`
  
  if (error instanceof Error) {
    // Handle specific Tauri errors
    if (error.message.includes('cancelled')) {
      message = `${operation.charAt(0).toUpperCase() + operation.slice(1)} operation cancelled`
      showToast(message)
      return
    }
    
    if (error.message.includes('permission')) {
      message = `Permission denied. Cannot ${operation} file`
    } else if (error.message.includes('not found')) {
      message = `File not found or has been moved`
    } else if (error.message.includes('disk space')) {
      message = `Insufficient disk space to ${operation} file`
    } else {
      message = `${message}: ${error.message}`
    }
  }

  showToast(message)
}

export const handleGeneralError = (
  error: unknown,
  context: string,
  showToast: (message: string, duration?: number) => void
) => {
  logger.error(`${context} error:`, error)

  let message = `An error occurred in ${context}`
  
  if (error instanceof Error) {
    message = `${context}: ${error.message}`
  }

  showToast(message)
}
