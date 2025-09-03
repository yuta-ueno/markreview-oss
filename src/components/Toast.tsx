import { useEffect, useState } from 'react'
import './Toast.css'

export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastProps {
  toast: ToastMessage
  onClose: (id: string) => void
}

const Toast = ({ toast, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Show animation
    const showTimer = setTimeout(() => setIsVisible(true), 100)
    
    // Auto close
    const closeTimer = setTimeout(() => {
      setIsLeaving(true)
      setTimeout(() => onClose(toast.id), 300)
    }, toast.duration || 4000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(closeTimer)
    }
  }, [toast.id, toast.duration, onClose])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => onClose(toast.id), 300)
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return '✓'
      case 'error': return '✕'
      case 'warning': return '⚠'
      case 'info': return 'ℹ'
      default: return 'ℹ'
    }
  }

  return (
    <div 
      className={`toast toast-${toast.type} ${isVisible ? 'toast-show' : ''} ${isLeaving ? 'toast-hide' : ''}`}
      role="alert"
    >
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <span className="toast-message">{toast.message}</span>
        <button 
          className="toast-close" 
          onClick={handleClose}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onClose: (id: string) => void
}

export const ToastContainer = ({ toasts, onClose }: ToastContainerProps) => {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  )
}

export default Toast