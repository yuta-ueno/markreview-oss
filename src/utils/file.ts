import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { handleFileError } from '../hooks/useToast'

export interface FileOperationResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

export interface FileInfo {
  content: string
  filename: string
  path: string
}

// Open file dialog and read file content
export const openFile = async (
  showToast: (message: string, duration?: number) => void
): Promise<FileOperationResult<FileInfo>> => {
  try {
    const filePath = await open({
      multiple: false,
      filters: [
        {
          name: 'Markdown',
          extensions: ['md', 'markdown']
        },
        {
          name: 'Text',
          extensions: ['txt']
        },
        {
          name: 'All Files',
          extensions: ['*']
        }
      ]
    })

    if (!filePath) {
      // User cancelled
      return { success: false }
    }

    const content = await readTextFile(filePath)
    const filename = filePath.split(/[\\/]/).pop() || 'unknown.md'
    
    showToast(`File "${filename}" opened successfully`)
    
    return {
      success: true,
      data: {
        content,
        filename,
        path: filePath
      }
    }
  } catch (error) {
    handleFileError(error, 'open', showToast)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Save file with dialog
export const saveAsFile = async (
  content: string,
  showToast: (message: string, duration?: number) => void,
  defaultFilename?: string
): Promise<FileOperationResult<FileInfo>> => {
  try {
    const filePath = await save({
      defaultPath: defaultFilename || 'document.md',
      filters: [
        {
          name: 'Markdown',
          extensions: ['md']
        },
        {
          name: 'Text',
          extensions: ['txt']
        }
      ]
    })

    if (!filePath) {
      // User cancelled
      return { success: false }
    }

    await writeTextFile(filePath, content)
    const filename = filePath.split(/[\\/]/).pop() || 'document.md'
    
    showToast(`File "${filename}" saved successfully`)
    
    return {
      success: true,
      data: {
        content,
        filename,
        path: filePath
      }
    }
  } catch (error) {
    handleFileError(error, 'save', showToast)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Save to existing file path
export const saveFile = async (
  content: string,
  filePath: string,
  showToast: (message: string, duration?: number) => void
): Promise<FileOperationResult> => {
  try {
    await writeTextFile(filePath, content)
    const filename = filePath.split(/[\\/]/).pop() || 'document.md'
    
    showToast(`File "${filename}" saved successfully`)
    
    return { success: true }
  } catch (error) {
    handleFileError(error, 'save', showToast)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Export as HTML
export const exportAsHTML = async (
  htmlContent: string,
  showToast: (message: string, duration?: number) => void,
  defaultFilename?: string
): Promise<FileOperationResult> => {
  try {
    const filename = defaultFilename 
      ? defaultFilename.replace(/\.(md|markdown|txt)$/i, '.html')
      : 'document.html'

    const filePath = await save({
      defaultPath: filename,
      filters: [
        {
          name: 'HTML',
          extensions: ['html']
        }
      ]
    })

    if (!filePath) {
      // User cancelled
      return { success: false }
    }

    await writeTextFile(filePath, htmlContent)
    const savedFilename = filePath.split(/[\\/]/).pop() || 'document.html'
    
    showToast(`HTML exported as "${savedFilename}" successfully`)
    
    return { success: true }
  } catch (error) {
    handleFileError(error, 'save', showToast)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Validate file content for security
export const validateFileContent = (content: string): { valid: boolean; reason?: string } => {
  // Check file size (10MB limit)
  if (content.length > 10 * 1024 * 1024) {
    return { valid: false, reason: 'File is too large (maximum 10MB)' }
  }

  // Check for potentially dangerous content
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /data:.*base64/gi
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      return { valid: false, reason: 'File contains potentially unsafe content' }
    }
  }

  return { valid: true }
}