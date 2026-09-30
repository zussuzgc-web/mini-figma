import { useRef } from 'react'
import type { PointerEvent, WheelEvent } from 'react'
import type { Camera, Point, Shape, ShapeType, Size, Tool } from '../types/shape'
import { DRAFT_ID } from '../hooks/useShapes'
import { screenToCanvas } from '../utils/geometry'
import { readImageFile } from '../utils/image'

interface CanvasProps {
  camera: Camera
  shapes: Shape[]
  selectedId: string | null
  draft: Shape | null
  activeTool: Tool
  isSpacePressed: boolean
  isPanning: boolean
  selectShape: (id: string | null) => void
  insertImage: (src: string, origin: Point, size: Size, parentId?: string | null) => Shape
  startDrawing: (type: ShapeType, origin: Point, parentId?: string | null) => void
  updateDrawing: (point: Point) => void
  endDrawing: () => void
  startMove: (id: string, point: Point) => void
  moveShape: (point: Point) => void
  endMove: () => void
  beginPan: (point: Point) => void
  panTo: (point: Point) => void
  endPan: () => void
  scrollBy: (dx: number, dy: number) => void
  zoomAt: (point: Point, factor: number) => void
  onFitAll: (bounds: Rect | null, viewport: Size) => void
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

function unionBounds(shapes: Shape[]): Rect | null {
  if (shapes.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const s of shapes) {
    minX = Math.min(minX, s.x)
    minY = Math.min(minY, s.y)
    maxX = Math.max(maxX, s.x + s.width)
    maxY = Math.max(maxY, s.y + s.height)
  }
  return { x: minX, y: minY, width: Math.max(maxX - minX, 1), height: Math.max(maxY - minY, 1) }
}

function contains(shape: Shape, point: Point): boolean {
  return (
    point.x >= shape.x &&
    point.x <= shape.x + shape.width &&
    point.y >= shape.y &&
    point.y <= shape.y + shape.height
  )
}

/** Shapes whose whole ancestor chain also contains the point, i.e. actually visible under that point. */
function visibleAt(shapes: Shape[], point: Point): Shape[] {
  const byId = new Map(shapes.map((s) => [s.id, s]))
  return shapes.filter((s) => {
    let cursor = s.parentId
    while (cursor) {
      const parent = byId.get(cursor)
      if (!parent || !contains(parent, point)) return false
      cursor = parent.parentId ?? null
    }
    return true
  })
}

function hitTest(shapes: Shape[], point: Point): Shape | null {
  const candidates = visibleAt(shapes, point)
  for (let i = candidates.length - 1; i >= 0; i -= 1) {
    if (contains(candidates[i], point)) return candidates[i]
  }
  return null
}

function frameChildren(shapes: Shape[], id: string): Shape[] {
  return shapes.filter((s) => s.parentId === id && s.id !== DRAFT_ID)
}

export default function Canvas(props: CanvasProps) {
  const {
    camera,
    shapes,
    selectedId,
    draft,
    activeTool,
    isSpacePressed,
    isPanning,
    selectShape,
    insertImage,
    startDrawing,
    updateDrawing,
    endDrawing,
    startMove,
    moveShape,
    endMove,
    beginPan,
    panTo,
    endPan,
    scrollBy,
    zoomAt,
    onFitAll,
  } = props

  const surfaceRef = useRef<HTMLDivElement | null>(null)

  const toCanvas = (e: { clientX: number; clientY: number }): { screen: Point; canvas: Point } => {
    const surface = surfaceRef.current
    const rect = surface?.getBoundingClientRect()
    const screen: Point = rect
      ? { x: e.clientX - rect.left, y: e.clientY - rect.top }
      : { x: e.clientX, y: e.clientY }
    return { screen, canvas: screenToCanvas(screen, camera) }
  }

  const pickParent = (point: Point): string | null => {
    const hit = hitTest(shapes, point)
    if (hit && hit.type === 'frame') return hit.id
    return hit?.parentId ?? null
  }

  const placeImage = (point: Point, parentId: string | null) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      void readImageFile(file).then(
        ({ src, size }) => insertImage(src, point, size, parentId),
        () => undefined,
      )
    }
    input.click()
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const surface = surfaceRef.current
    if (!surface || e.button > 1) return
    surface.setPointerCapture(e.pointerId)
    const { screen, canvas } = toCanvas(e)

    if (isSpacePressed || e.button === 1) {
      beginPan(screen)
      return
    }

    if (activeTool === 'image') {
      placeImage(canvas, pickParent(canvas))
      return
    }

    if (activeTool === 'select') {
      const hit = hitTest(shapes, canvas)
      if (hit) {
        selectShape(hit.id)
        startMove(hit.id, canvas)
      } else {
        selectShape(null)
      }
      return
    }

    startDrawing(activeTool, canvas, pickParent(canvas))
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const { screen, canvas } = toCanvas(e)
    if (isPanning) {
      panTo(screen)
    } else if (activeTool === 'select') {
      moveShape(canvas)
    } else {
      updateDrawing(canvas)
    }
  }

  const onPointerUp = () => {
    endPan()
    if (activeTool === 'select') endMove()
    else endDrawing()
  }

  const onWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const { screen } = toCanvas(e)
    if (e.shiftKey) {
      scrollBy(-e.deltaY, 0)
      return
    }
    zoomAt(screen, Math.exp(-e.deltaY * 0.001))
  }

  const onDoubleClick = () => {
    const rect = surfaceRef.current?.getBoundingClientRect()
    if (!rect) return
    onFitAll(unionBounds(shapes.filter((s) => !s.parentId)), { width: rect.width, height: rect.height })
  }

  const px = 1 / camera.scale

  const renderShape = (shape: Shape, originX: number, originY: number) => {
    const left = (shape.x - originX) * camera.scale
    const top = (shape.y - originY) * camera.scale
    const width = shape.width * camera.scale
    const height = shape.height * camera.scale
    const selected = shape.id === selectedId
    const children = frameChildren(shapes, shape.id)

    return (
      <div key={shape.id} style={{ position: 'absolute', left, top, width, height }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: shape.type === 'image' ? 'transparent' : shape.fill,
            border: shape.stroke ? `${shape.strokeWidth * px}px solid ${shape.stroke}` : 'none',
            borderRadius: shape.type === 'ellipse' ? '50%' : shape.type === 'frame' ? 2 : 0,
            boxSizing: 'border-box',
            overflow: shape.type === 'frame' ? 'hidden' : 'visible',
          }}
        >
          {shape.type === 'image' && shape.src && (
            <img
              src={shape.src}
              alt={shape.name ?? ''}
              draggable={false}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'fill',
                pointerEvents: 'none',
              }}
            />
          )}
          {children.map((child) => renderShape(child, shape.x, shape.y))}
        </div>

        {selected && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: `${px}px solid #2f80ed`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  }

  const transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`

  return (
    <div
      ref={surfaceRef}
      className="canvas-surface relative h-full w-full overflow-hidden"
      style={{
        backgroundColor: '#18181b',
        cursor: isPanning ? 'grabbing' : isSpacePressed ? 'grab' : activeTool === 'select' ? 'default' : 'crosshair',
        touchAction: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      onDoubleClick={onDoubleClick}
      title="Double-click — fit all"
    >
      <div style={{ position: 'absolute', transformOrigin: '0 0', transform, width: '100%', height: '100%' }}>
        {shapes
          .filter((s) => !s.parentId && s.id !== DRAFT_ID)
          .map((s) => renderShape(s, 0, 0))}

        {draft && (
          <div
            style={{
              position: 'absolute',
              left: draft.x * camera.scale,
              top: draft.y * camera.scale,
              width: draft.width * camera.scale,
              height: draft.height * camera.scale,
              border: `${px}px solid #2f80ed`,
              background: draft.type === 'frame' ? 'rgba(99,102,241,0.08)' : 'rgba(96,165,250,0.15)',
              boxSizing: 'border-box',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  )
}