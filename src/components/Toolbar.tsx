import { TOOL_ORDER, TOOLS } from '../constants/tools'
import type { Tool } from '../types/shape'

interface ToolbarProps {
  activeTool: Tool
  onSelectTool: (tool: Tool) => void
}

function Toolbar({ activeTool, onSelectTool }: ToolbarProps) {
  return (
    <nav className="flex w-16 flex-col items-center gap-1 border-r border-zinc-800 bg-zinc-950 py-3">
      {TOOL_ORDER.map((id) => {
        const tool = TOOLS[id]
        const active = id === activeTool
        return (
          <button
            key={id}
            type="button"
            title={`${tool.label} (${tool.hotkey})`}
            onClick={() => onSelectTool(id)}
            className={`flex h-11 w-11 items-center justify-center rounded-md text-sm font-semibold transition-colors ${
              active
                ? 'bg-sky-600 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            {tool.hotkey}
          </button>
        )
      })}
    </nav>
  )
}

export default Toolbar