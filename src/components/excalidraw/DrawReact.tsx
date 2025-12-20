import { useEffect, useState } from 'react'

import ExcalidrawViewer from './ExcalidrawViewer.tsx'

interface DrawProps {
  children?: any
  data?: string
  width?: string
  height?: string
  className?: string
  viewModeEnabled?: boolean
  zenModeEnabled?: boolean
}

export default function Draw({
  children,
  data,
  width = '100%',
  height = '400px',
  className = '',
  viewModeEnabled = true,
  zenModeEnabled = false
}: DrawProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Process data: prioritize data prop, otherwise try to get from children
  let excalidrawData = data

  if (!excalidrawData && children) {
    if (typeof children === 'string') {
      excalidrawData = children.trim()
    } else {
      excalidrawData = String(children).trim()
    }
  }

  if (!excalidrawData) {
    return (
      <div className={`excalidraw-container error ${className}`} style={{ width, height }}>
        <p className='error-message'>No Excalidraw data provided</p>
      </div>
    )
  }

  // Only render ExcalidrawViewer on client side
  if (!isClient) {
    return (
      <div className={`excalidraw-container loading ${className}`} style={{ width, height }}>
        <div className='loading-content'>
          <div className='loading-spinner'></div>
          <p>Initializing...</p>
        </div>
      </div>
    )
  }

  return (
    <ExcalidrawViewer
      data={excalidrawData}
      width={width}
      height={height}
      className={className}
      viewModeEnabled={viewModeEnabled}
      zenModeEnabled={zenModeEnabled}
    />
  )
}
