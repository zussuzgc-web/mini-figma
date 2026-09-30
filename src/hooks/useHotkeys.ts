import { useEffect } from 'react'
import type { Tool } from '../types/shape'
import { TOOL_HOTKEYS } from '../constants/tools'

interface UseHotkeysOptions {
  onSelectTool: (tool: Tool) => void
  onUndo?: () => void
  onRedo?: () => void
  onDelete?: () => void
  onPasteImage?: (file: File) => void
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
  )
}

export function useHotkeys({ onSelectTool, onUndo, onRedo, onDelete, onPasteImage }: UseHotkeysOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isEditableTarget(e.target)) return

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) onRedo?.()
        else onUndo?.()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        onRedo?.()
        return
      }
      if (e.ctrlKey || e.metaKey) return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        onDelete?.()
        return
      }

      const tool = TOOL_HOTKEYS[e.key.toLowerCase()]
      if (tool) {
        e.preventDefault()
        onSelectTool(tool)
      }
    }

    const handlePaste = (e: ClipboardEvent) => {
      if (onPasteImage) {
        const items = Array.from(e.clipboardData?.items ?? [])
        const fileItem = items.find(
          (item) => item.kind === 'file' && item.type.startsWith('image/'),
        )
        if (fileItem) {
          const file = fileItem.getAsFile()
          if (file) {
            e.preventDefault()
            onPasteImage(file)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('paste', handlePaste)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('paste', handlePaste)
    }
  }, [onSelectTool, onUndo, onRedo, onDelete, onPasteImage])
}

export default useHotkeys
