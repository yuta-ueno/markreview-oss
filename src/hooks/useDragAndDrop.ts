import React, { useCallback, useState } from 'react'

export interface DragAndDropOptions {
  onFilesDrop?: (files: File[]) => void
  acceptedFileTypes?: string[]
  onDragEnter?: () => void
  onDragLeave?: () => void
  onError?: (error: string) => void
}

export const useDragAndDrop = (options: DragAndDropOptions = {}) => {
  const {
    onFilesDrop,
    acceptedFileTypes = ['.md', '.markdown', '.txt'],
    onDragEnter,
    onDragLeave,
    onError,
  } = options

  const [isDragging, setIsDragging] = useState(false)
  const [, setDragCounter] = useState(0)

  const isAcceptedFileType = useCallback(
    (fileName: string): boolean => {
      return acceptedFileTypes.some(type => 
        fileName.toLowerCase().endsWith(type.toLowerCase())
      )
    },
    [acceptedFileTypes]
  )

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setDragCounter(prev => prev + 1)
    
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
      onDragEnter?.()
    }
  }, [onDragEnter])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setDragCounter(prev => {
      const newCounter = prev - 1
      if (newCounter === 0) {
        setIsDragging(false)
        onDragLeave?.()
      }
      return newCounter
    })
  }, [onDragLeave])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragging(false)
    setDragCounter(0)
    
    const files = Array.from(e.dataTransfer?.files || [])
    
    if (files.length === 0) {
      onError?.('No files were dropped')
      return
    }

    // Filter for accepted file types
    const acceptedFiles = files.filter(file => isAcceptedFileType(file.name))
    
    if (acceptedFiles.length === 0) {
      const acceptedTypesStr = acceptedFileTypes.join(', ')
      onError?.(`Please drop files with supported extensions: ${acceptedTypesStr}`)
      return
    }

    if (acceptedFiles.length > 1) {
      onError?.('Please drop only one file at a time')
      return
    }

    onFilesDrop?.(acceptedFiles)
  }, [acceptedFileTypes, isAcceptedFileType, onFilesDrop, onError])

  const dragAndDropProps = {
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  }

  return {
    isDragging,
    dragAndDropProps,
  }
}