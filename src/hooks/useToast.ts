import { useState, useCallback } from 'react'
import { ToastMessage } from '../components/Toast'

interface UseToastOptions {
  defaultDuration?: number
}

export const useToast = ({ defaultDuration = 4000 }: UseToastOptions = {}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((
    message: string, 
    type: ToastMessage['type'] = 'info', 
    duration = defaultDuration
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const toast: ToastMessage = {
      id,
      message,
      type,
      duration
    }

    setToasts(prev => [...prev, toast])
    return id
  }, [defaultDuration])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Convenience methods
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

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
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
  console.error(`File ${operation} error:`, error)

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
  console.error(`${context} error:`, error)

  let message = `An error occurred in ${context}`
  
  if (error instanceof Error) {
    message = `${context}: ${error.message}`
  }

  showToast(message)
}