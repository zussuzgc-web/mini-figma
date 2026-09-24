import { useCallback, useRef, useState } from 'react'
import type { Point, Shape, ShapeType, Size } from '../types/shape'
import { rectFromPoints, subPoints } from '../utils/geometry'

let idCounter = 0

function nextId(): string {
  idCounter += 1
  return `shape-${idCounter}`
}

const DRAFT_ID = '__draft__'

const MAX_HISTORY = 100

interface MoveState {
  id: string
  offset: Point
  snapshot: Shape[] | null
}

export function useShapes() {
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Shape | null>(null)
  const draftRef = useRef<Shape | null>(null)
  const shapesRef = useRef<Shape[]>([])
  const moveRef = useRef<MoveState | null>(null)
  const pastRef = useRef<Shape[][]>([])
  const futureRef = useRef<Shape[][]>([])
  shapesRef.current = shapes

  const pushHistory = useCallback((before: Shape[]) => {
    pastRef.current.push(before)
    if (pastRef.current.length > MAX_HISTORY) {
      pastRef.current = pastRef.current.slice(-MAX_HISTORY)
    }
    futureRef.current = []
  }, [])

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
  }, [keepSelection])

  const redo = useCallback(() => {
    if (draftRef.current || moveRef.current) return
    if (futureRef.current.length === 0) return
    const next = futureRef.current[futureRef.current.length - 1]
    futureRef.current = futureRef.current.slice(0, -1)
    pastRef.current.push(shapesRef.current)
    setShapes(next)
    keepSelection(next)
  }, [keepSelection])

  const addShape = useCallback(
    (type: ShapeType, origin: Point, size: Size): Shape => {
      const shape: Shape = {
        id: nextId(),
        type,
        x: origin.x,
        y: origin.y,
        width: size.width,
        height: size.height,
        fill: '#60a5fa',
        stroke: null,
        strokeWidth: 0,
      }
      pushHistory(shapesRef.current)
      setShapes((prev) => [...prev, shape])
      setSelectedId(shape.id)
      return shape
    },
    [pushHistory],
  )

  const startDrawing = useCallback((type: ShapeType, origin: Point): void => {
    if (draftRef.current) return
    const shape: Shape = {
      id: DRAFT_ID,
      type,
      x: origin.x,
      y: origin.y,
      width: 0,
      height: 0,
      fill: '#60a5fa',
      stroke: null,
      strokeWidth: 0,
    }
    draftRef.current = shape
    setDraft(shape)
  }, [])

  const updateDrawing = useCallback((point: Point): void => {
    const current = draftRef.current
    if (!current) return
    const next = rectFromPoints({ x: current.x, y: current.y }, point)
    const updated: Shape = { ...current, ...next }
    draftRef.current = updated
    setDraft(updated)
  }, [])

  const endDrawing = useCallback((): void => {
    const current = draftRef.current
    if (!current) return
    draftRef.current = null
    setDraft(null)
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
    }
    pushHistory(shapesRef.current)
    setShapes((prev) => [...prev, shape])
    setSelectedId(shape.id)
  }, [pushHistory])

  const updateShape = useCallback((id: string, patch: Partial<Shape>) => {
    pushHistory(shapesRef.current)
    setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }, [pushHistory])

  const removeShape = useCallback((id: string) => {
    pushHistory(shapesRef.current)
    setShapes((prev) => prev.filter((s) => s.id !== id))
    setSelectedId((prev) => (prev === id ? null : prev))
  }, [pushHistory])

  const selectShape = useCallback((id: string | null) => {
    setSelectedId(id)
  }, [])

  const startMove = useCallback((id: string, point: Point): void => {
    if (draftRef.current || moveRef.current) return
    const shape = shapesRef.current.find((s) => s.id === id)
    if (!shape) return
    moveRef.current = {
      id,
      offset: subPoints(point, { x: shape.x, y: shape.y }),
      snapshot: null,
    }
  }, [])

  const moveShape = useCallback((point: Point): void => {
    const state = moveRef.current
    if (!state) return
    if (state.snapshot === null) {
      state.snapshot = shapesRef.current
      pushHistory(state.snapshot)
    }
    const next = subPoints(point, state.offset)
    setShapes((prev) => prev.map((s) => (s.id === state.id ? { ...s, x: next.x, y: next.y } : s)))
  }, [pushHistory])

  const endMove = useCallback((): void => {
    moveRef.current = null
  }, [])

  return {
    shapes,
    selectedId,
    draft,
    addShape,
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