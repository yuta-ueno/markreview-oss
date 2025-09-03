import React from 'react'
import './DragDropOverlay.css'

interface DragDropOverlayProps {
  isVisible: boolean
  message?: string
}

const DragDropOverlay: React.FC<DragDropOverlayProps> = ({
  isVisible,
  message = 'Drop your markdown file here',
}) => {
  if (!isVisible) return null

  return (
    <div className="drag-drop-overlay">
      <div className="drag-drop-content">
        <div className="drag-drop-icon">📄</div>
        <div className="drag-drop-message">{message}</div>
        <div className="drag-drop-hint">
          Supported formats: .md, .markdown, .txt
        </div>
      </div>
    </div>
  )
}

export default DragDropOverlay