import React, { useState, useRef, useCallback, useEffect } from 'react'
import './SplitPane.css'

interface SplitPaneProps {
  left: React.ReactNode
  right: React.ReactNode
  defaultSplit?: number // percentage (0-100)
  minSize?: number // minimum percentage for each pane
}

const SplitPane: React.FC<SplitPaneProps> = ({
  left,
  right,
  defaultSplit = 50,
  minSize = 20,
}) => {
  const [leftWidth, setLeftWidth] = useState(defaultSplit)
  const [isDragging, setIsDragging] = useState(false)
  const splitPaneRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !splitPaneRef.current) return

      const rect = splitPaneRef.current.getBoundingClientRect()
      const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100

      // Apply constraints
      const constrainedWidth = Math.min(
        Math.max(newLeftWidth, minSize),
        100 - minSize
      )

      setLeftWidth(constrainedWidth)
    },
    [isDragging, minSize]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div className="split-pane" ref={splitPaneRef}>
      <div
        className="split-pane-left"
        style={{ width: `${leftWidth}%` }}
        data-testid="split-pane-left"
      >
        {left}
      </div>
      <div
        className={`split-pane-divider ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        data-testid="split-pane-divider"
      />
      <div
        className="split-pane-right"
        style={{ width: `${100 - leftWidth}%` }}
        data-testid="split-pane-right"
      >
        {right}
      </div>
    </div>
  )
}

export default SplitPane