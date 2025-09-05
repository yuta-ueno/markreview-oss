import { useCallback } from 'react'
import { saveAsFile, saveFile, validateFileContent } from '../utils/file'
import { APP_CONFIG, getFileExtensionFromPath, isValidFileSize } from '../utils/constants'

export const DEFAULT_CONTENT = `# Welcome to MarkReview

Start typing your **Markdown** content here!

## Features
- ✅ Live preview
- ✅ Syntax highlighting  
- ✅ GitHub Flavored Markdown
- ✅ Tables, checkboxes, code blocks

## Code Example
\`\`\`javascript
function hello(name) {
  console.log(\`Hello, \${name}!\`)
}
\`\`\`

## Table Example
| Feature | Status |
|---------|--------|
| Editor | ✅ Done |
| Preview | ✅ Done |
| Themes | ✅ Done |

## Task List
- [x] Completed task
- [ ] Pending task

> This is a blockquote example.`

export interface FileOperationHandlers {
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export interface FileOperationResult {
  handleNew: () => void
  handleOpen: (content: string, filename: string) => void
  handleSave: () => Promise<void>
  handleFileRead: (files: File[]) => void
  handleTauriFileDrop: (filePath: string) => Promise<void>
  triggerFileOpen: () => void
}

export interface UseFileOperationsOptions {
  isTauri: boolean
  markdownContent: string
  filename: string
  currentFilePath: string | null
  handlers: FileOperationHandlers
  readTextFile: ((filePath: string) => Promise<string>) | null
  onContentChange: (content: string, filename: string, filePath: string | null, hasChanges: boolean) => void
}

export const useFileOperations = ({
  isTauri,
  markdownContent,
  filename,
  currentFilePath,
  handlers,
  readTextFile,
  onContentChange,
}: UseFileOperationsOptions): FileOperationResult => {
  const { onSuccess, onError } = handlers

  // Handle new file creation
  const handleNew = useCallback(() => {
    onContentChange(DEFAULT_CONTENT, APP_CONFIG.DEFAULT_FILENAME, null, false)
  }, [onContentChange])

  // Handle file opening
  const handleOpen = useCallback((content: string, filename: string) => {
    const validation = validateFileContent(content)
    if (!validation.valid) {
      onError(`Cannot open file: ${validation.reason}`)
      return
    }

    onContentChange(content, filename, null, false)
    onSuccess(APP_CONFIG.SUCCESS_MESSAGES.FILE_OPENED(filename))
  }, [onContentChange, onError, onSuccess])

  // Handle file saving
  const handleSave = useCallback(async () => {
    if (isTauri) {
      if (currentFilePath) {
        // Save to existing file
        const result = await saveFile(markdownContent, currentFilePath, onSuccess)
        if (result.success) {
          onContentChange(markdownContent, filename, currentFilePath, false)
        }
      } else {
        // Save as new file
        const result = await saveAsFile(markdownContent, onSuccess, filename)
        if (result.success && result.data) {
          onContentChange(markdownContent, result.data.filename, result.data.path, false)
        }
      }
    } else {
      // Fallback to browser download
      const blob = new Blob([markdownContent], { type: APP_CONFIG.DOWNLOAD_MIME_TYPE })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = filename || APP_CONFIG.FALLBACK_FILENAME
      a.style.display = 'none'
      
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      onContentChange(markdownContent, filename, currentFilePath, false)
      onSuccess(APP_CONFIG.SUCCESS_MESSAGES.FILE_SAVED(filename))
    }
  }, [isTauri, currentFilePath, markdownContent, filename, onSuccess, onContentChange])

  // Handle Tauri file drop
  const handleTauriFileDrop = useCallback(async (filePath: string) => {
    try {
      // Validate file extension
      if (!APP_CONFIG.SUPPORTED_FILE_PATTERN.test(filePath)) {
        onError(APP_CONFIG.VALIDATION_MESSAGES.INVALID_FILE_TYPE)
        return
      }

      // Read file using Tauri API
      if (!readTextFile) {
        onError(APP_CONFIG.VALIDATION_MESSAGES.TAURI_API_UNAVAILABLE)
        return
      }
      const content = await readTextFile(filePath)
      const fileName = getFileExtensionFromPath(filePath)
      
      onContentChange(content, fileName, filePath, false)
      onSuccess(APP_CONFIG.SUCCESS_MESSAGES.FILE_OPENED(fileName))
    } catch (err) {
      console.error('Error reading dropped file:', err)
      onError(`Failed to read file: ${err}`)
    }
  }, [onError, onSuccess, readTextFile, onContentChange])

  // Handle file reading from browser
  const handleFileRead = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return

    // Validate file type
    if (!APP_CONFIG.SUPPORTED_FILE_PATTERN.test(file.name)) {
      onError(APP_CONFIG.VALIDATION_MESSAGES.INVALID_FILE_TYPE)
      return
    }

    // Validate file size
    if (!isValidFileSize(file.size)) {
      onError(APP_CONFIG.VALIDATION_MESSAGES.FILE_TOO_LARGE)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      handleOpen(content, file.name)
    }
    reader.onerror = () => {
      onError(APP_CONFIG.VALIDATION_MESSAGES.FILE_READ_ERROR)
    }
    reader.readAsText(file)
  }, [handleOpen, onError])

  // Trigger file open dialog
  const triggerFileOpen = useCallback(() => {
    // Create a temporary file input to trigger the open dialog
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = APP_CONFIG.SUPPORTED_FILE_EXTENSIONS.join(',')
    input.style.display = 'none'
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleFileRead([file])
      }
      document.body.removeChild(input)
    }
    
    document.body.appendChild(input)
    input.click()
  }, [handleFileRead])

  return {
    handleNew,
    handleOpen,
    handleSave,
    handleFileRead,
    handleTauriFileDrop,
    triggerFileOpen,
  }
}