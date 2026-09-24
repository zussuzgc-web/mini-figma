import { useEffect } from 'react'
import type { Tool } from '../types/shape'
import { TOOL_HOTKEYS } from '../constants/tools'

interface UseHotkeysOptions {
  onSelectTool: (tool: Tool) => void
  onUndo?: () => void
  onRedo?: () => void
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
  )
}

export function useHotkeys({ onSelectTool, onUndo, onRedo }: UseHotkeysOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.defaultPrevented || isEditableTarget(e.target)) return

      if (!(e.ctrlKey || e.metaKey)) {
        const tool = TOOL_HOTKEYS[e.key.toLowerCase()]
        if (tool) {
          e.preventDefault()
          onSelectTool(tool)
        }
        return
      }

      const key = e.key.toLowerCase()
      if (key === 'z') {
        e.preventDefault()
        if (e.shiftKey) onRedo?.()
        else onUndo?.()
      } else if (key === 'y') {
        e.preventDefault()
        onRedo?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSelectTool, onUndo, onRedo])
}

export default useHotkeys