import { logger } from './logger'
import { APP_CONFIG } from './constants'

// Error types and categories
export enum ErrorCategory {
  FILE_OPERATION = 'file_operation',
  NETWORK = 'network',
  VALIDATION = 'validation',
  TAURI_API = 'tauri_api',
  PARSE = 'parse',
  UI = 'ui',
  GENERAL = 'general'
}

export interface ErrorContext {
  category: ErrorCategory
  operation?: string
  component?: string
  userId?: string
  timestamp: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>
}

export interface ProcessedError {
  userMessage: string
  technicalMessage: string
  category: ErrorCategory
  severity: 'low' | 'medium' | 'high' | 'critical'
  shouldNotifyUser: boolean
  shouldLog: boolean
  retryable: boolean
}

// Error severity levels
const ERROR_SEVERITY: Record<ErrorCategory, ProcessedError['severity']> = {
  [ErrorCategory.FILE_OPERATION]: 'medium',
  [ErrorCategory.NETWORK]: 'medium',
  [ErrorCategory.VALIDATION]: 'low',
  [ErrorCategory.TAURI_API]: 'high',
  [ErrorCategory.PARSE]: 'low',
  [ErrorCategory.UI]: 'low',
  [ErrorCategory.GENERAL]: 'medium'
}

// User-friendly error messages
const USER_ERROR_MESSAGES: Record<string, string> = {
  // File operation errors
  'permission_denied': 'アクセス権限がありません。ファイルまたはフォルダの権限を確認してください。',
  'file_not_found': 'ファイルが見つかりません。ファイルが移動または削除されている可能性があります。',
  'disk_space': 'ディスク容量が不足しています。空き容量を確保してから再度お試しください。',
  'file_too_large': `ファイルサイズが${APP_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MBの制限を超えています。`,
  'invalid_file_type': 'サポートされていないファイル形式です。Markdownファイル（.md、.markdown、.txt）を選択してください。',
  'file_corrupted': 'ファイルが破損している可能性があります。別のファイルをお試しください。',
  
  // Tauri API errors
  'tauri_not_available': 'デスクトップ機能を利用できません。ブラウザ版の機能をご利用ください。',
  'plugin_error': 'システムプラグインエラーが発生しました。アプリケーションを再起動してください。',
  
  // Validation errors
  'invalid_markdown': 'Markdown形式が正しくありません。構文を確認してください。',
  'unsafe_content': 'セキュリティ上の理由により、このファイルを開くことができません。',
  
  // Network errors
  'network_unavailable': 'ネットワーク接続を確認してください。',
  'timeout': 'タイムアウトが発生しました。しばらくしてから再度お試しください。',
  
  // General errors
  'unknown_error': '予期しないエラーが発生しました。問題が続く場合はサポートにお問い合わせください。',
  'operation_cancelled': '操作がキャンセルされました。'
}

/**
 * Process and categorize errors with appropriate user messaging
 */
export const processError = (
  error: unknown,
  context: ErrorContext
): ProcessedError => {
  const timestamp = Date.now()
  let userMessage = USER_ERROR_MESSAGES.unknown_error
  let technicalMessage = 'Unknown error'
  let retryable = false

  if (error instanceof Error) {
    technicalMessage = error.message
    
    // Categorize error based on message content
    const message = error.message.toLowerCase()
    
    if (message.includes('permission') || message.includes('access denied')) {
      userMessage = USER_ERROR_MESSAGES.permission_denied
      retryable = false
    } else if (message.includes('not found') || message.includes('enoent')) {
      userMessage = USER_ERROR_MESSAGES.file_not_found
      retryable = false
    } else if (message.includes('disk') || message.includes('space') || message.includes('enospc')) {
      userMessage = USER_ERROR_MESSAGES.disk_space
      retryable = false
    } else if (message.includes('cancelled') || message.includes('aborted')) {
      userMessage = USER_ERROR_MESSAGES.operation_cancelled
      retryable = true
    } else if (message.includes('timeout')) {
      userMessage = USER_ERROR_MESSAGES.timeout
      retryable = true
    } else if (message.includes('network') || message.includes('fetch')) {
      userMessage = USER_ERROR_MESSAGES.network_unavailable
      retryable = true
    } else if (context.category === ErrorCategory.FILE_OPERATION) {
      if (message.includes('large')) {
        userMessage = USER_ERROR_MESSAGES.file_too_large
      } else if (message.includes('type') || message.includes('format')) {
        userMessage = USER_ERROR_MESSAGES.invalid_file_type
      } else {
        userMessage = `ファイル${context.operation || '操作'}に失敗しました: ${technicalMessage}`
      }
      retryable = true
    } else if (context.category === ErrorCategory.TAURI_API) {
      userMessage = USER_ERROR_MESSAGES.tauri_not_available
      retryable = false
    }
  }

  const severity = ERROR_SEVERITY[context.category] || 'medium'
  const shouldLog = severity !== 'low'
  const shouldNotifyUser = severity !== 'low' && !technicalMessage.toLowerCase().includes('cancelled')

  // Log error if required
  if (shouldLog) {
    logger.error('Error processed:', {
      userMessage,
      technicalMessage,
      category: context.category,
      severity,
      context,
      timestamp,
      stack: error instanceof Error ? error.stack : undefined
    })
  }

  return {
    userMessage,
    technicalMessage,
    category: context.category,
    severity,
    shouldNotifyUser,
    shouldLog,
    retryable
  }
}

/**
 * Handle file operation errors with enhanced context
 */
export const handleFileError = (
  error: unknown,
  operation: string,
  showToast: (message: string, type?: 'error' | 'warning' | 'info' | 'success') => void,
  component?: string
): ProcessedError => {
  const context: ErrorContext = {
    category: ErrorCategory.FILE_OPERATION,
    operation,
    component,
    timestamp: Date.now()
  }

  const processedError = processError(error, context)

  if (processedError.shouldNotifyUser) {
    const toastType = processedError.severity === 'critical' ? 'error' : 
                     processedError.severity === 'high' ? 'error' : 'warning'
    showToast(processedError.userMessage, toastType)
  }

  return processedError
}

/**
 * Handle Tauri API errors
 */
export const handleTauriError = (
  error: unknown,
  apiName: string,
  showToast: (message: string, type?: 'error' | 'warning' | 'info' | 'success') => void,
  component?: string
): ProcessedError => {
  const context: ErrorContext = {
    category: ErrorCategory.TAURI_API,
    operation: apiName,
    component,
    timestamp: Date.now()
  }

  const processedError = processError(error, context)

  if (processedError.shouldNotifyUser) {
    showToast(processedError.userMessage, 'warning')
  }

  return processedError
}

/**
 * Handle validation errors
 */
export const handleValidationError = (
  error: unknown,
  field: string,
  showToast: (message: string, type?: 'error' | 'warning' | 'info' | 'success') => void,
  component?: string
): ProcessedError => {
  const context: ErrorContext = {
    category: ErrorCategory.VALIDATION,
    operation: `validate_${field}`,
    component,
    timestamp: Date.now()
  }

  const processedError = processError(error, context)

  if (processedError.shouldNotifyUser) {
    showToast(processedError.userMessage, 'warning')
  }

  return processedError
}

/**
 * Handle general application errors
 */
export const handleGeneralError = (
  error: unknown,
  context: string,
  showToast: (message: string, type?: 'error' | 'warning' | 'info' | 'success') => void,
  component?: string
): ProcessedError => {
  const errorContext: ErrorContext = {
    category: ErrorCategory.GENERAL,
    operation: context,
    component,
    timestamp: Date.now()
  }

  const processedError = processError(error, errorContext)

  if (processedError.shouldNotifyUser) {
    const toastType = processedError.severity === 'critical' ? 'error' : 'warning'
    showToast(processedError.userMessage, toastType)
  }

  return processedError
}

/**
 * Create error boundary handler
 */
export const createErrorBoundaryHandler = (
  componentName: string,
  showToast?: (message: string, type?: 'error' | 'warning' | 'info' | 'success') => void
) => {
  return (error: Error, errorInfo: { componentStack: string }) => {
    const context: ErrorContext = {
      category: ErrorCategory.UI,
      component: componentName,
      timestamp: Date.now(),
      metadata: {
        componentStack: errorInfo.componentStack
      }
    }

    const processedError = processError(error, context)

    if (showToast && processedError.shouldNotifyUser) {
      showToast('アプリケーションエラーが発生しました。ページをリロードしてください。', 'error')
    }

    return processedError
  }
}

/**
 * Utility to check if an error is retryable
 */
export const isRetryableError = (error: ProcessedError): boolean => {
  return error.retryable && error.severity !== 'critical'
}

/**
 * Get user-friendly error message for display
 */
export const getUserErrorMessage = (error: unknown, fallback = 'エラーが発生しました'): string => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    for (const [key, userMessage] of Object.entries(USER_ERROR_MESSAGES)) {
      if (message.includes(key.replace('_', ' ')) || message.includes(key.replace('_', ''))) {
        return userMessage
      }
    }
  }
  return fallback
}