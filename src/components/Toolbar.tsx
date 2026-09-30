import { TOOLS } from '../constants/tools'
import type { Tool } from '../types/shape'

interface ToolbarProps {
  activeTool: Tool
  onSelectTool: (tool: Tool) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

export default function Toolbar({
  activeTool,
  onSelectTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: ToolbarProps) {
  return (
    <nav className="flex w-20 flex-col items-center gap-1 border-r border-zinc-800 bg-zinc-950 py-3">
      {TOOLS.map((tool) => {
        const active = tool.id === activeTool
        return (
          <button
            key={tool.id}
            type="button"
            title={`${tool.label} (${tool.hotkey})`}
            onClick={() => onSelectTool(tool.id)}
            className={`flex h-12 w-14 flex-col items-center justify-center gap-0.5 rounded-md text-xs transition-colors ${
              active
                ? 'bg-sky-600 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <span className="text-base leading-none">{tool.icon}</span>
            <span className="truncate text-[10px] leading-none">{tool.label}</span>
          </button>
        )
      })}

      <div className="mt-auto flex flex-col gap-1">
        <button
          type="button"
          title="Undo (Ctrl+Z)"
          onClick={onUndo}
          disabled={!canUndo}
          className="h-9 w-12 rounded-md bg-zinc-900 text-sm text-zinc-300 transition-colors enabled:hover:bg-zinc-800 disabled:text-zinc-700"
        >
          ↶
        </button>
        <button
          type="button"
          title="Redo (Ctrl+Shift+Z)"
          onClick={onRedo}
          disabled={!canRedo}
          className="h-9 w-12 rounded-md bg-zinc-900 text-sm text-zinc-300 transition-colors enabled:hover:bg-zinc-800 disabled:text-zinc-700"
        >
          ↷
        </button>
      </div>
    </nav>
  )
}