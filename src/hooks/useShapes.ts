import { useCallback, useRef, useState } from 'react'
import type { Point, Shape, ShapeType, Size } from '../types/shape'
import { rectFromPoints, subPoints } from '../utils/geometry'

let idCounter = 0

function nextId(): string {
  idCounter += 1
  return `shape-${idCounter}`
}

export const DRAFT_ID = '__draft__'

const MAX_HISTORY = 100

interface MoveState {
  id: string
  offset: Point
  snapshot: Shape[] | null
}

function subtreeIds(shapes: Shape[], seed: string): Set<string> {
  const result = new Set<string>([seed])
  let changed = true
  while (changed) {
    changed = false
    for (const s of shapes) {
      if (s.parentId && result.has(s.parentId) && !result.has(s.id)) {
        result.add(s.id)
        changed = true
      }
    }
  }
  return result
}

function defaultFill(type: ShapeType): string {
  if (type === 'frame') return 'rgba(99,102,241,0.08)'
  if (type === 'image') return 'transparent'
  if (type === 'ellipse') return '#a78bfa'
  return '#60a5fa'
}

function defaultName(type: ShapeType): string | undefined {
  return type === 'frame' ? 'Frame' : undefined
}

export function useShapes() {
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Shape | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const draftRef = useRef<Shape | null>(null)
  const shapesRef = useRef<Shape[]>([])
  const moveRef = useRef<MoveState | null>(null)
  const pastRef = useRef<Shape[][]>([])
  const futureRef = useRef<Shape[][]>([])
  shapesRef.current = shapes

  const syncHistoryFlags = useCallback((past: number, future: number) => {
    setCanUndo(past > 0)
    setCanRedo(future > 0)
  }, [])

  const pushHistory = useCallback(
    (before: Shape[]) => {
      pastRef.current.push(before)
      if (pastRef.current.length > MAX_HISTORY) {
        pastRef.current = pastRef.current.slice(-MAX_HISTORY)
      }
      futureRef.current = []
      syncHistoryFlags(pastRef.current.length, 0)
    },
    [syncHistoryFlags],
  )

  const keepSelection = useCallback((next: Shape[]) => {
    setSelectedId((prev) => (prev && next.some((s) => s.id === prev) ? prev : null))
  }, [])

  const undo = useCallback(() => {
    if (draftRef.current || moveRef.current) return
    if (pastRef.current.length === 0) return
    const previous = pastRef.current[pastRef.current.length - 1]
    pastRef.current = pastRef.current.slice(0, -1)
    futureRef.current.push(shapesRef.current)
    setShapes(previous)
    keepSelection(previous)
    syncHistoryFlags(pastRef.current.length, futureRef.current.length)
  }, [keepSelection, syncHistoryFlags])

  const redo = useCallback(() => {
    if (draftRef.current || moveRef.current) return
    if (futureRef.current.length === 0) return
    const next = futureRef.current[futureRef.current.length - 1]
    futureRef.current = futureRef.current.slice(0, -1)
    pastRef.current.push(shapesRef.current)
    setShapes(next)
    keepSelection(next)
    syncHistoryFlags(pastRef.current.length, futureRef.current.length)
  }, [keepSelection, syncHistoryFlags])

  const insertImage = useCallback(
    (src: string, origin: Point, size: Size, parentId?: string | null): Shape => {
      const shape: Shape = {
        id: nextId(),
        type: 'image',
        x: origin.x,
        y: origin.y,
        width: size.width,
        height: size.height,
        fill: 'transparent',
        stroke: null,
        strokeWidth: 0,
        parentId: parentId ?? null,
        src,
        name: 'Image',
      }
      pushHistory(shapesRef.current)
      setShapes((prev) => [...prev, shape])
      setSelectedId(shape.id)
      return shape
    },
    [pushHistory],
  )

  const updateShape = useCallback(
    (id: string, patch: Partial<Shape>) => {
      const current = shapesRef.current.find((s) => s.id === id)
      if (!current) return
      const changed = (Object.keys(patch) as (keyof Shape)[]).some((k) => current[k] !== patch[k])
      if (!changed) return
      pushHistory(shapesRef.current)
      setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
    },
    [pushHistory],
  )

  const removeShape = useCallback(
    (id: string) => {
      const ids = subtreeIds(shapesRef.current, id)
      if (!shapesRef.current.some((s) => ids.has(s.id))) return
      pushHistory(shapesRef.current)
      setShapes((prev) => prev.filter((s) => !ids.has(s.id)))
      setSelectedId((prev) => (prev && ids.has(prev) ? null : prev))
    },
    [pushHistory],
  )

  const selectShape = useCallback((id: string | null) => {
    setSelectedId(id)
  }, [])

  const startDrawing = useCallback(
    (type: ShapeType, origin: Point, parentId?: string | null): void => {
      if (draftRef.current || moveRef.current) return
      const shape: Shape = {
        id: DRAFT_ID,
        type,
        x: origin.x,
        y: origin.y,
        width: 0,
        height: 0,
        fill: defaultFill(type),
        stroke: type === 'frame' ? '#818cf8' : null,
        strokeWidth: type === 'frame' ? 1 : 0,
        parentId: parentId ?? null,
        src: undefined,
        name: defaultName(type),
      }
      draftRef.current = shape
      setDraft(shape)
    },
    [],
  )

  const updateDrawing = useCallback((point: Point): void => {
    const current = draftRef.current
    if (!current) return
    const updated: Shape = { ...current, ...rectFromPoints({ x: current.x, y: current.y }, point) }
    draftRef.current = updated
    setDraft(updated)
  }, [])

  const endDrawing = useCallback((): void => {
    const current = draftRef.current
    draftRef.current = null
    setDraft(null)
    if (!current) return
    if (current.width <= 0 || current.height <= 0) return
    const shape: Shape = {
      id: nextId(),
      type: current.type,
      x: current.x,
      y: current.y,
      width: current.width,
      height: current.height,
      fill: current.fill,
      stroke: current.stroke,
      strokeWidth: current.strokeWidth,
      parentId: current.parentId,
      src: current.src,
      name: current.name,
    }
    pushHistory(shapesRef.current)
    setShapes((prev) => [...prev, shape])
    setSelectedId(shape.id)
  }, [pushHistory])

  const startMove = useCallback((id: string, point: Point): void => {
    if (draftRef.current || moveRef.current) return
    const shape = shapesRef.current.find((s) => s.id === id)
    if (!shape) return
    moveRef.current = { id, offset: subPoints(point, { x: shape.x, y: shape.y }), snapshot: null }
  }, [])

  const moveShape = useCallback(
    (point: Point): void => {
      const state = moveRef.current
      if (!state) return
      if (state.snapshot === null) {
        state.snapshot = shapesRef.current
        const base = new Map(state.snapshot.map((s) => [s.id, s]))
        const origin = base.get(state.id)
        const current = subPoints(point, state.offset)
        if (!origin || (current.x === origin.x && current.y === origin.y)) return
        pushHistory(state.snapshot)
      }
      const snapshot = state.snapshot
      if (!snapshot) return
      const next = subPoints(point, state.offset)
      const ids = subtreeIds(snapshot, state.id)
      const base = new Map(snapshot.map((s) => [s.id, s]))
      const dx = next.x - (base.get(state.id)?.x ?? next.x)
      const dy = next.y - (base.get(state.id)?.y ?? next.y)
      setShapes((prev) =>
        prev.map((s) => {
          if (!ids.has(s.id)) return s
          return { ...s, x: s.x + dx, y: s.y + dy }
        }),
      )
    },
    [pushHistory],
  )

  const endMove = useCallback((): void => {
    moveRef.current = null
  }, [])

  return {
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
  }
}

export default useShapes