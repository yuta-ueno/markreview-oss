import React, { Component, ReactNode } from 'react'
import { createErrorBoundaryHandler } from '../utils/errorHandler'
import { logger } from '../utils/logger'
import './ErrorBoundary.css'

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showToast?: (message: string, type?: 'error' | 'warning' | 'info' | 'success') => void
  componentName?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorId: string | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorHandler: ReturnType<typeof createErrorBoundaryHandler>

  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorId: null
    }

    this.errorHandler = createErrorBoundaryHandler(
      props.componentName || 'Unknown Component',
      props.showToast
    )
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state to trigger fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Process error through our error handler
    const processedError = this.errorHandler(error, {
      componentStack: errorInfo.componentStack || 'Unknown component stack'
    })
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log additional error details
    logger.error('React Error Boundary triggered:', {
      componentName: this.props.componentName,
      error: processedError,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId
    })
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error, this.handleRetry)
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">⚠️</div>
            <h2 className="error-boundary-title">申し訳ございません</h2>
            <p className="error-boundary-message">
              予期しないエラーが発生しました。<br />
              ページをリロードしてお試しください。
            </p>
            
            <div className="error-boundary-actions">
              <button 
                className="error-boundary-button primary" 
                onClick={this.handleRetry}
              >
                再試行
              </button>
              <button 
                className="error-boundary-button secondary" 
                onClick={() => window.location.reload()}
              >
                ページリロード
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="error-boundary-details">
                <summary>開発者向け詳細情報</summary>
                <div className="error-boundary-error">
                  <h4>エラーメッセージ:</h4>
                  <pre>{this.state.error.message}</pre>
                  {this.state.error.stack && (
                    <>
                      <h4>スタックトレース:</h4>
                      <pre className="error-boundary-stack">
                        {this.state.error.stack}
                      </pre>
                    </>
                  )}
                  <p><strong>Error ID:</strong> {this.state.errorId}</p>
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary