import { useState } from 'react'
import type { Tool } from './types/shape'
import { useViewport } from './hooks/useViewport'
import { useShapes } from './hooks/useShapes'
import { useHotkeys } from './hooks/useHotkeys'
import Canvas from './components/Canvas'
import Toolbar from './components/Toolbar'
import PropertiesPanel from './components/PropertiesPanel'
import LayersPanel from './components/LayersPanel'

function App() {
  const viewport = useViewport()
  const shapes = useShapes()
  const [activeTool, setActiveTool] = useState<Tool>('select')

  useHotkeys({ onSelectTool: setActiveTool, onUndo: shapes.undo, onRedo: shapes.redo })

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <Toolbar activeTool={activeTool} onSelectTool={setActiveTool} />
      <main className="relative flex-1">
        <Canvas viewport={viewport} shapes={shapes} activeTool={activeTool} />
      </main>
      <aside className="flex w-72 flex-col border-l border-zinc-800 bg-zinc-950">
        <PropertiesPanel
          shapes={shapes.shapes}
          selectedId={shapes.selectedId}
          onUpdateShape={shapes.updateShape}
        />
        <LayersPanel
          shapes={shapes.shapes}
          selectedId={shapes.selectedId}
          onSelectShape={shapes.selectShape}
        />
      </aside>
    </div>
  )
}

export default App