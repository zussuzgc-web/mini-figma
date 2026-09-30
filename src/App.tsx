import { useCallback, useState } from 'react'
import type { Point, Tool } from './types/shape'
import { readImageFile } from './utils/image'
import Canvas from './components/Canvas'
import Toolbar from './components/Toolbar'
import PropertiesPanel from './components/PropertiesPanel'
import LayersPanel from './components/LayersPanel'
import { useShapes } from './hooks/useShapes'
import { useViewport } from './hooks/useViewport'
import { useHotkeys } from './hooks/useHotkeys'

function App() {
  const {
    shapes,
    selectedId,
    draft,
    canUndo,
    canRedo,
    insertImage,
    updateShape,
    removeShape,
    selectShape,
    startDrawing,
    updateDrawing,
    endDrawing,
    startMove,
    moveShape,
    endMove,
    undo,
    redo,
  } = useShapes()

  const {
    camera,
    isSpacePressed,
    isPanning,
    beginPan,
    panTo,
    endPan,
    scrollBy,
    zoomAt,
    fitBounds,
  } = useViewport()

  const [activeTool, setActiveTool] = useState<Tool>('select')

  const selectTool = useCallback(
    (tool: Tool) => {
      setActiveTool(tool)
      if (tool === 'select') selectShape(null)
    },
    [selectShape],
  )

  const onDelete = useCallback(() => {
    if (selectedId) removeShape(selectedId)
  }, [selectedId, removeShape])

  const onPasteImage = useCallback(
    (file: File) => {
      const origin: Point = {
        x: (40 - camera.x) / camera.scale,
        y: (40 - camera.y) / camera.scale,
      }
      readImageFile(file)
        .then(({ src, size }) => insertImage(src, origin, size, null))
        .catch(() => selectShape(null))
    },
    [camera, insertImage, selectShape],
  )

  useHotkeys({
    onSelectTool: selectTool,
    onUndo: undo,
    onRedo: redo,
    onDelete,
    onPasteImage,
  })

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <Toolbar
        activeTool={activeTool}
        onSelectTool={selectTool}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />

      <main className="relative flex-1">
        <Canvas
          camera={camera}
          shapes={shapes}
          selectedId={selectedId}
          draft={draft}
          activeTool={activeTool}
          isSpacePressed={isSpacePressed}
          isPanning={isPanning}
          selectShape={selectShape}
          insertImage={insertImage}
          startDrawing={startDrawing}
          updateDrawing={updateDrawing}
          endDrawing={endDrawing}
          startMove={startMove}
          moveShape={moveShape}
          endMove={endMove}
          beginPan={beginPan}
          panTo={panTo}
          endPan={endPan}
          scrollBy={scrollBy}
          zoomAt={zoomAt}
          onFitAll={fitBounds}
        />
      </main>

      <aside className="flex w-72 flex-col border-l border-zinc-800 bg-zinc-950">
        <PropertiesPanel
          shapes={shapes}
          selectedId={selectedId}
          onUpdateShape={updateShape}
          onRemoveShape={removeShape}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
        />
        <LayersPanel shapes={shapes} selectedId={selectedId} onSelectShape={selectShape} />
      </aside>
    </div>
  )
}

export default App