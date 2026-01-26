import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI
} from '@excalidraw/excalidraw/types/types'
import { useCallback, useEffect, useRef, useState } from 'react'

import BlockLoading from '../BlockLoading.tsx'

/*
 * Copyright 2025 CWorld
 * Licensed under the Apache License, Version 2.0.
 *
 * Modifications made by Jerry on 2025.
 */
interface ExcalidrawViewerProps {
  data: string
  width?: string
  height?: string
  className?: string
  viewModeEnabled?: boolean
  zenModeEnabled?: boolean
  showExtendButton?: boolean
  onChange?: (
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles
  ) => void
  onReady?: (api: ExcalidrawImperativeAPI) => void
}

export default function ExcalidrawViewer({
  data,
  width = '100%',
  height = '500px',
  className = '',
  viewModeEnabled = true,
  zenModeEnabled = false,
  showExtendButton = true,
  onChange,
  onReady
}: ExcalidrawViewerProps) {
  const [ExcalidrawComponent, setExcalidrawComponent] = useState<any>(null)
  const [excalidrawData, setExcalidrawData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [zoom, setZoom] = useState(100)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI>()

  // Detect client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Better dark mode detection
  useEffect(() => {
    if (!isClient) return

    const checkTheme = () => {
      const htmlElement = document.documentElement
      const bodyElement = document.body

      // Check multiple ways themes might be set
      const isDark =
        htmlElement.classList.contains('dark') ||
        bodyElement.classList.contains('dark') ||
        htmlElement.getAttribute('data-theme') === 'dark' ||
        bodyElement.getAttribute('data-theme') === 'dark' ||
        htmlElement.style.colorScheme === 'dark'

      // Only fall back to system preference if no explicit theme is set
      const hasExplicitTheme =
        htmlElement.classList.contains('dark') ||
        htmlElement.classList.contains('light') ||
        bodyElement.classList.contains('dark') ||
        bodyElement.classList.contains('light') ||
        htmlElement.getAttribute('data-theme') ||
        bodyElement.getAttribute('data-theme')

      const finalIsDark = hasExplicitTheme
        ? isDark
        : window.matchMedia('(prefers-color-scheme: dark)').matches

      console.log('Theme check:', {
        htmlClasses: htmlElement.className,
        bodyClasses: bodyElement.className,
        dataTheme: htmlElement.getAttribute('data-theme'),
        hasExplicitTheme,
        isDark,
        finalIsDark
      })

      setIsDarkMode(finalIsDark)
    }

    checkTheme()

    // Listen for all possible theme changes
    const observer = new MutationObserver(() => {
      setTimeout(checkTheme, 50) // Small delay to ensure changes are applied
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style']
    })
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style']
    })

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleMediaChange = () => {
      setTimeout(checkTheme, 50)
    }
    mediaQuery.addEventListener('change', handleMediaChange)

    // Also listen for storage events (in case theme is stored in localStorage)
    const handleStorageChange = () => {
      setTimeout(checkTheme, 100)
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', handleMediaChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [isClient])

  // Load Excalidraw and parse data
  useEffect(() => {
    if (!isClient) return

    const loadExcalidraw = async () => {
      try {
        setIsLoading(true)

        // Parse data first, handling escaped characters from clipboard
        let parsed

        try {
          // First try direct parsing for properly formatted JSON
          parsed = JSON.parse(data)
        } catch (error) {
          // If direct parsing fails, clean the data by removing excessive escaping
          let cleanedData = data

          // Fix various escaped characters that might come from clipboard/markdown
          // 1. Replace escaped brackets, quotes, and braces
          cleanedData = cleanedData.replace(/\\+\[/g, '[')
          cleanedData = cleanedData.replace(/\\+\]/g, ']')
          cleanedData = cleanedData.replace(/\\+\{/g, '{')
          cleanedData = cleanedData.replace(/\\+\}/g, '}')
          cleanedData = cleanedData.replace(/\\+"/g, '"')

          // 2. Fix markdown escaped characters like \_ -> _
          cleanedData = cleanedData.replace(/\\+/g, '')

          // 3. Try parsing again with cleaned data
          parsed = JSON.parse(cleanedData)
        }

        if (parsed && typeof parsed === 'object') {
          const initialData = {
            elements: parsed.elements || [],
            appState: {
              viewBackgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
              ...parsed.appState,
              // Ensure content is centered from the start
              scrollX: 0,
              scrollY: 0
            },
            files: parsed.files || {}
          }

          setExcalidrawData(initialData)
        } else {
          throw new Error('Invalid data structure')
        }

        // Dynamic import Excalidraw
        const excalidrawModule = await import('@excalidraw/excalidraw')
        setExcalidrawComponent(() => excalidrawModule.Excalidraw)

        setIsLoading(false)
      } catch (err) {
        console.error('Failed to load Excalidraw:', err)
        setError('Failed to load Excalidraw: ' + String(err))
        setIsLoading(false)
      }
    }

    loadExcalidraw()
  }, [data, isClient])

  // Update theme without reloading
  useEffect(() => {
    if (excalidrawAPIRef.current) {
      excalidrawAPIRef.current.updateScene({
        appState: {
          viewBackgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
          theme: isDarkMode ? 'dark' : 'light'
        }
      })
    }
  }, [isDarkMode])

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    if (excalidrawAPIRef.current) {
      const currentZoom = excalidrawAPIRef.current.getAppState().zoom.value
      const newZoom = Math.min(currentZoom * 1.25, 3)
      excalidrawAPIRef.current.updateScene({
        appState: { zoom: { value: newZoom as any } }
      })
      setZoom(Math.round(newZoom * 100))
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    if (excalidrawAPIRef.current) {
      const currentZoom = excalidrawAPIRef.current.getAppState().zoom.value
      const newZoom = Math.max(currentZoom * 0.8, 0.1)
      excalidrawAPIRef.current.updateScene({
        appState: { zoom: { value: newZoom as any } }
      })
      setZoom(Math.round(newZoom * 100))
    }
  }, [])

  // Handle scroll to content
  const handleScrollToContent = useCallback(() => {
    if (excalidrawAPIRef.current) {
      excalidrawAPIRef.current.scrollToContent(undefined, {
        fitToContent: true
      })
      setShowScrollButton(false)
    }
  }, [])

  // Handle export
  const handleExport = async () => {
    if (!excalidrawAPIRef.current) return

    try {
      const elements = excalidrawAPIRef.current.getSceneElements()
      const { exportToBlob } = await import('@excalidraw/excalidraw')

      const blob = await exportToBlob({
        elements,
        files: null
      })

      const url = URL.createObjectURL(blob)
      const win = window.open()
      if (win) {
        win.location.replace(url)
      }
    } catch (err) {
      console.error('Export failed:', err)
    }
    setShowMenu(false)
  }

  // Don't render anything on server side
  if (!isClient) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-neutral-800 ${className}`}
        style={{ width, height }}
      >
        <BlockLoading style={{ width, height }}>Loading Excalidraw...</BlockLoading>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-neutral-800 ${className}`}
        style={{ width, height }}
      >
        <BlockLoading style={{ width, height }}>
          <div className='text-red-500'>
            <div className='mb-2'>⚠️ Error</div>
            <div className='text-xs'>{error}</div>
          </div>
        </BlockLoading>
      </div>
    )
  }

  if (isLoading || !ExcalidrawComponent || !excalidrawData) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-neutral-800 ${className}`}
        style={{ width, height }}
      >
        <BlockLoading style={{ width, height }}>Loading Excalidraw...</BlockLoading>
      </div>
    )
  }

  return (
    <div
      className={`relative my-4 overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 ${className}`}
      style={{ width, height }}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
    >
      <style>{`
        .excalidraw .App-menu_top,
        .excalidraw .App-bottom-bar {
          display: none !important;
        }
        .excalidraw .App-canvas {
          position: relative !important;
        }
        .excalidraw canvas {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
        }
      `}</style>
      <ExcalidrawComponent
        theme={isDarkMode ? 'dark' : 'light'}
        initialData={excalidrawData}
        detectScroll={false}
        zenModeEnabled={zenModeEnabled}
        onChange={onChange}
        viewModeEnabled={viewModeEnabled}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            export: false,
            toggleTheme: false
          }
        }}
        excalidrawAPI={(api: ExcalidrawImperativeAPI) => {
          excalidrawAPIRef.current = api
          // Center content immediately without delay
          requestAnimationFrame(() => {
            api.scrollToContent(undefined, {
              fitToContent: true
            })
            // Update zoom state after fitting to content
            const currentZoom = api.getAppState().zoom.value
            setZoom(Math.round(currentZoom * 100))
          })
          onReady?.(api)
        }}
      />

      {/* Menu Button - Top Left */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className='absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-white/90 text-gray-700 backdrop-blur transition-all hover:-translate-y-px hover:border-black/15 hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-gray-800/90 dark:text-gray-300 dark:hover:border-white/15 dark:hover:bg-gray-800'
        title='Menu'
      >
        <svg
          width='16'
          height='16'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <line x1='3' y1='6' x2='21' y2='6' />
          <line x1='3' y1='12' x2='21' y2='12' />
          <line x1='3' y1='18' x2='21' y2='18' />
        </svg>
      </button>

      {/* Menu Dropdown */}
      {showMenu && (
        <div className='absolute left-3 top-12 z-20 min-w-[160px] animate-in fade-in slide-in-from-top-2 overflow-hidden rounded-lg border border-black/10 bg-white/95 shadow-lg backdrop-blur dark:border-white/10 dark:bg-gray-800/95'>
          <button
            onClick={handleExport}
            className='flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
          >
            <svg
              width='14'
              height='14'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
              <polyline points='7,10 12,15 17,10' />
              <line x1='12' y1='15' x2='12' y2='3' />
            </svg>
            Export image...
          </button>
        </div>
      )}

      {/* Zoom Controls - Bottom Left */}
      <div className='absolute bottom-3 left-3 z-10 flex items-center overflow-hidden rounded-lg border border-black/10 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-gray-800/90'>
        <button
          onClick={handleZoomOut}
          className='flex h-8 w-8 items-center justify-center text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600 active:scale-95 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
        >
          <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <line x1='5' y1='12' x2='19' y2='12' />
          </svg>
        </button>
        <span className='min-w-[40px] border-x border-black/10 px-3 text-center text-xs font-medium text-gray-500 dark:border-white/10 dark:text-gray-400'>
          {zoom}%
        </span>
        <button
          onClick={handleZoomIn}
          className='flex h-8 w-8 items-center justify-center text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600 active:scale-95 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
        >
          <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <line x1='12' y1='5' x2='12' y2='19' />
            <line x1='5' y1='12' x2='19' y2='12' />
          </svg>
        </button>
      </div>

      {/* Scroll to Content Button - Bottom Center */}
      {showScrollButton && (
        <button
          onClick={handleScrollToContent}
          className='absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/90 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-all hover:-translate-y-[2px] hover:bg-blue-600 hover:shadow-lg active:scale-95 active:translate-y-0'
          title='Scroll back to content'
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
          </svg>
          Scroll back to content
        </button>
      )}
    </div>
  )
}
