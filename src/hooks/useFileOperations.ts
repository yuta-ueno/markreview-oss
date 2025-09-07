import { useCallback } from 'react'
import { saveAsFile, saveFile, validateFileContent } from '../utils/file'
import { APP_CONFIG, getFileExtensionFromPath, isValidFileSize } from '../utils/constants'
import { logger } from '../utils/logger'

export const DEFAULT_CONTENT = `# MarkReview - 操作マニュアル

**MarkReview**へようこそ！軽量で高速なMarkdownエディター＆プレビューアーです。

## 🚀 基本操作

### ファイル操作
- **新規作成**: \`Ctrl+N\` または「NEW」ボタン
- **ファイルを開く**: \`Ctrl+O\` または「OPEN」ボタン
- **保存**: \`Ctrl+S\` または「SAVE」ボタン
- **ドラッグ&ドロップ**: ファイルを直接アプリにドラッグして開く

### エディター機能
- **検索**: \`Ctrl+F\` でエディター内検索
- **設定**: \`Ctrl+,\` または歯車アイコンで設定画面を開く
- **リアルタイムプレビュー**: 右側でMarkdownをリアルタイム表示

## 🎨 カスタマイズ

### テーマ設定
- **Solarized Light**: 明るく読みやすいテーマ
- **Solarized Dark**: 目に優しいダークテーマ  
- **Auto**: システム設定に従って自動切り替え

### エディター設定
- **フォントサイズ**: 8px〜32pxで調整可能
- **フォント**: Monaco、Fira Code、Source Code Pro、JetBrains Mono
- **タブサイズ**: 2、4、8スペース
- **ワードラップ**: 長い行の自動折り返し

## 📝 Markdown記法サンプル

### 見出し
\`\`\`markdown
# 見出し1
## 見出し2  
### 見出し3
\`\`\`

### 強調
\`\`\`markdown
**太字** *斜体* ~~打ち消し~~
\`\`\`

### リスト
\`\`\`markdown
- 箇条書き1
- 箇条書き2
  - ネストしたアイテム

1. 番号付きリスト
2. アイテム2
\`\`\`

### チェックボックス
- [x] 完了したタスク
- [ ] 未完了のタスク

### コードブロック
\`\`\`javascript
function hello(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`

### テーブル
| 機能 | 状態 | 説明 |
|------|------|------|
| リアルタイムプレビュー | ✅ | 編集と同時にプレビュー更新 |
| ドラッグ&ドロップ | ✅ | ファイルを直接開ける |
| テーマ切り替え | ✅ | 3つのテーマから選択 |

### 引用
> これは引用文です。
> 複数行にわたって記述できます。

## 💡 ヒント

1. **新規ファイル**を作成すると、この内容はクリアされ空の状態になります
2. **ファイル関連づけ**でMarkdownファイルを直接開けます
3. **キーボードショートカット**で効率的に作業できます
4. **設定画面**で好みに応じてカスタマイズできます

---

**MarkReview v0.1.6** - 軽量Markdownエディター  
新しいファイルを作成するには「NEW」ボタンをクリックしてください。`

// 新規ファイル作成時は空のコンテンツを使用
export const NEW_FILE_CONTENT = ''

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
    onContentChange(NEW_FILE_CONTENT, APP_CONFIG.DEFAULT_FILENAME, null, false)
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
        logger.warn('Tauri file API not available, but file drop functionality is working through alternative path')
        return
      }
      const content = await readTextFile(filePath)
      const fileName = getFileExtensionFromPath(filePath)
      
      onContentChange(content, fileName, filePath, false)
      onSuccess(APP_CONFIG.SUCCESS_MESSAGES.FILE_OPENED(fileName))
    } catch (err) {
      logger.error('Error reading dropped file:', err)
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
