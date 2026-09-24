import { useCallback, useEffect, useRef } from 'react'
import type { Point, Shape, Tool } from '../types/shape'
import type { useShapes } from '../hooks/useShapes'
import type { useViewport } from '../hooks/useViewport'
import { screenToCanvas } from '../utils/geometry'
import ShapeView from './Shape'

const GRID_SIZE = 24

function hitTest(shapes: Shape[], point: Point): Shape | null {
  for (let i = shapes.length - 1; i >= 0; i -= 1) {
    const s = shapes[i]
    if (point.x >= s.x && point.x <= s.x + s.width && point.y >= s.y && point.y <= s.y + s.height) {
      return s
    }
  }
  return null
}

interface CanvasProps {
  viewport: ReturnType<typeof useViewport>
  shapes: ReturnType<typeof useShapes>
  activeTool: Tool
}

function Canvas({ viewport, shapes, activeTool }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { camera, isPanning, isSpacePressed, beginPan, panTo, endPan, zoomAt, centerOn } = viewport
  const {
    draft,
    selectShape,
    startDrawing,
    updateDrawing,
    endDrawing,
    startMove,
    moveShape,
    endMove,
  } = shapes

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      centerOn({ width: rect.width, height: rect.height })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [centerOn])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const point = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      zoomAt(point, Math.exp(-e.deltaY * 0.0015))
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [zoomAt])

  useEffect(() => {
    const end = () => {
      endPan()
      endDrawing()
      endMove()
    }
    window.addEventListener('pointerup', end)
    window.addEventListener('blur', end)
    return () => {
      window.removeEventListener('pointerup', end)
      window.removeEventListener('blur', end)
    }
  }, [endPan, endDrawing, endMove])

  const getLocalPoint = useCallback((e: { clientX: number; clientY: number }): Point => {
    const rect = containerRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      const local = getLocalPoint(e)
      if (isSpacePressed) {
        beginPan(local)
        return
      }
      const canvasPoint = screenToCanvas(local, camera)
      if (activeTool === 'select') {
        const hit = hitTest(shapes.shapes, canvasPoint)
        selectShape(hit ? hit.id : null)
        if (hit) startMove(hit.id, canvasPoint)
        return
      }
      startDrawing(activeTool, canvasPoint)
    },
    [getLocalPoint, isSpacePressed, beginPan, camera, activeTool, shapes.shapes, selectShape, startMove, startDrawing],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const local = getLocalPoint(e)
      panTo(local)
      if (!isSpacePressed) {
        const canvasPoint = screenToCanvas(local, camera)
        updateDrawing(canvasPoint)
        moveShape(canvasPoint)
      }
    },
    [getLocalPoint, panTo, isSpacePressed, updateDrawing, moveShape, camera],
  )

  const gridSize = GRID_SIZE * camera.scale
  const cursor = isSpacePressed
    ? isPanning
      ? 'grabbing'
      : 'grab'
    : activeTool === 'select'
      ? 'default'
      : 'crosshair'

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 select-none overflow-hidden"
      style={{
        backgroundColor: '#18181b',
        backgroundImage:
          'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${camera.x}px ${camera.y}px`,
        cursor,
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
          transformOrigin: '0 0',
        }}
      >
        {shapes.shapes.map((shape) => (
          <ShapeView
            key={shape.id}
            shape={shape}
            selected={shape.id === shapes.selectedId}
            scale={camera.scale}
          />
        ))}
        {draft && <ShapeView shape={draft} selected={false} scale={camera.scale} />}
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 rounded bg-zinc-900/80 px-2 py-1 text-xs text-zinc-400">
        {Math.round(camera.scale * 100)}%
      </div>
      {isSpacePressed && (
        <div className="pointer-events-none absolute left-3 top-3 rounded bg-zinc-900/80 px-2 py-1 text-xs text-zinc-400">
          Space — панорамирование
        </div>
      )}
    </div>
  )
}

export default Canvas