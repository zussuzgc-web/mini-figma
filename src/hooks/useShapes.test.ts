import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { bumpIdCounter, useShapes } from './useShapes'
import { STORAGE_KEY } from '../utils/storage'
import type { Shape } from '../types/shape'

type Shapes = ReturnType<typeof useShapes>
type Handle = { current: Shapes }

const SRC = 'data:image/png;base64,AAA'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.resetModules()
})

/** act() не возвращает значение колбэка, поэтому created выносим наружу. */
function addRect(result: Handle, x = 0, y = 0): Shape {
  let created: Shape | undefined
  act(() => {
    created = result.current.insertImage(SRC, { x, y }, { width: 100, height: 50 })
  })
  if (!created) throw new Error('insertImage не вернул фигуру')
  return created
}

function drawFrame(result: Handle): Shape {
  act(() => result.current.startDrawing('frame', { x: 0, y: 0 }))
  act(() => result.current.updateDrawing({ x: 200, y: 200 }))
  act(() => result.current.endDrawing())
  return result.current.shapes[0]
}

function makeShape(id: string): Shape {
  return {
    id,
    type: 'rectangle',
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    fill: '#60a5fa',
    stroke: null,
    strokeWidth: 0,
    parentId: null,
  }
}

describe('useShapes: добавление', () => {
  it('вставляет фигуру, выделяет её и включает undo', () => {
    const { result } = renderHook(() => useShapes())
    expect(result.current.shapes).toHaveLength(0)
    expect(result.current.canUndo).toBe(false)

    const shape = addRect(result, 10, 20)

    expect(result.current.shapes).toHaveLength(1)
    expect(result.current.shapes[0]).toMatchObject({ x: 10, y: 20, width: 100, height: 50 })
    expect(result.current.selectedId).toBe(shape.id)
    expect(result.current.canUndo).toBe(true)
  })

  it('не добавляет запись в историю, если значение не изменилось', () => {
    const { result } = renderHook(() => useShapes())
    const shape = addRect(result)

    act(() => result.current.updateShape(shape.id, { x: shape.x }))

    // Если бы no-op попал в историю, одного undo было бы мало, чтобы опустеть.
    act(() => result.current.undo())
    expect(result.current.shapes).toHaveLength(0)
  })
})

describe('useShapes: undo и redo', () => {
  it('возвращает состояние до вставки и затем повторяет действие', () => {
    const { result } = renderHook(() => useShapes())
    addRect(result)

    act(() => result.current.undo())
    expect(result.current.shapes).toHaveLength(0)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(true)

    act(() => result.current.redo())
    expect(result.current.shapes).toHaveLength(1)
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)
  })

  it('не накапливает фигуры при чередовании undo и redo', () => {
    const { result } = renderHook(() => useShapes())
    addRect(result, 0, 0)
    addRect(result, 5, 5)

    act(() => result.current.undo())
    act(() => result.current.redo())
    act(() => result.current.undo())
    act(() => result.current.undo())
    act(() => result.current.redo())

    expect(result.current.shapes).toHaveLength(1)
    expect(result.current.shapes[0].x).toBe(0)
  })

  it('сбрасывает redo, как только сделано новое действие', () => {
    const { result } = renderHook(() => useShapes())
    addRect(result)
    act(() => result.current.undo())
    expect(result.current.canRedo).toBe(true)

    addRect(result, 7, 7)
    expect(result.current.canRedo).toBe(false)
  })

  it('снимает выделение, если отменённая фигура исчезла', () => {
    const { result } = renderHook(() => useShapes())
    const shape = addRect(result)
    expect(result.current.selectedId).toBe(shape.id)

    act(() => result.current.undo())
    expect(result.current.selectedId).toBeNull()
  })

  it('игнорирует undo, пока на холсте идёт рисование', () => {
    const { result } = renderHook(() => useShapes())
    addRect(result)

    act(() => result.current.startDrawing('rectangle', { x: 0, y: 0 }))
    act(() => result.current.undo())

    expect(result.current.shapes).toHaveLength(1)
  })
})

describe('useShapes: перетаскивание', () => {
  it('не пишет историю, если фигура не сдвинулась', () => {
    const { result } = renderHook(() => useShapes())
    const shape = addRect(result, 40, 40)

    act(() => result.current.startMove(shape.id, { x: 50, y: 50 }))
    act(() => result.current.moveShape({ x: 50, y: 50 }))
    act(() => result.current.endMove())

    // Одна запись в истории уже есть — от вставки. Если бы перетаскивание
    // дописало свою, одного undo не хватило бы, чтобы опустеть.
    act(() => result.current.undo())
    expect(result.current.shapes).toHaveLength(0)
  })

  it('пишет ровно одну запись в историю на всё перетаскивание', () => {
    const { result } = renderHook(() => useShapes())
    addRect(result)
    const id = result.current.shapes[0].id

    act(() => result.current.startMove(id, { x: 0, y: 0 }))
    act(() => result.current.moveShape({ x: 10, y: 0 }))
    act(() => result.current.moveShape({ x: 20, y: 0 }))
    act(() => result.current.moveShape({ x: 30, y: 0 }))
    act(() => result.current.endMove())
    expect(result.current.shapes[0].x).toBe(30)

    act(() => result.current.undo())
    expect(result.current.shapes[0].x).toBe(0)

    // Ровно одна запись: следующий undo полностью опустошает холст.
    act(() => result.current.undo())
    expect(result.current.shapes).toHaveLength(0)

    act(() => result.current.redo())
    expect(result.current.shapes[0].x).toBe(0)

    act(() => result.current.redo())
    expect(result.current.shapes[0].x).toBe(30)
  })

  it('держит фигуру под курсором, а не даёт ей убегать', () => {
    const { result } = renderHook(() => useShapes())
    addRect(result)
    const id = result.current.shapes[0].id

    act(() => result.current.startMove(id, { x: 0, y: 0 }))
    for (const step of [10, 20, 30, 40, 50]) {
      act(() => result.current.moveShape({ x: step, y: 0 }))
      expect(result.current.shapes[0].x).toBe(step)
    }
    act(() => result.current.endMove())
  })

  it('переносит вместе с фреймом все вложенные фигуры', () => {
    const { result } = renderHook(() => useShapes())
    const frame = drawFrame(result)
    act(() => {
      result.current.insertImage(SRC, { x: 10, y: 10 }, { width: 20, height: 20 }, frame.id)
    })

    act(() => result.current.startMove(frame.id, { x: 0, y: 0 }))
    act(() => result.current.moveShape({ x: 100, y: 50 }))
    act(() => result.current.endMove())

    const moved = result.current.shapes.find((s) => s.id === frame.id)
    const child = result.current.shapes.find((s) => s.parentId === frame.id)
    expect(moved).toMatchObject({ x: 100, y: 50 })
    expect(child).toMatchObject({ x: 110, y: 60 })
  })
})

describe('useShapes: рисование', () => {
  it('не создаёт фигуру при клике без перетаскивания', () => {
    const { result } = renderHook(() => useShapes())

    act(() => result.current.startDrawing('rectangle', { x: 5, y: 5 }))
    act(() => result.current.updateDrawing({ x: 5, y: 5 }))
    act(() => result.current.endDrawing())

    expect(result.current.shapes).toHaveLength(0)
    expect(result.current.canUndo).toBe(false)
  })

  it('создаёт фигуру и выделяет её после перетаскивания', () => {
    const { result } = renderHook(() => useShapes())

    act(() => result.current.startDrawing('rectangle', { x: 5, y: 5 }))
    act(() => result.current.updateDrawing({ x: 40, y: 25 }))
    act(() => result.current.endDrawing())

    expect(result.current.shapes).toHaveLength(1)
    expect(result.current.shapes[0]).toMatchObject({ x: 5, y: 5, width: 35, height: 20 })
    expect(result.current.selectedId).toBe(result.current.shapes[0].id)
  })
})

describe('useShapes: восстановление из хранилища', () => {
  it('поднимает счётчик id выше восстановленных, чтобы не выдать занятый', () => {
    const ids = ['shape-3', 'shape-17', 'shape-9']
    expect(bumpIdCounter(ids.map(makeShape))).toBe(17)
  })

  it('игнорирует идентификаторы произвольного вида', () => {
    expect(bumpIdCounter([makeShape('imported-from-file')])).toBeGreaterThanOrEqual(0)
  })

  it('подхватывает сохранённые фигуры и не переиспользует их id', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ shapes: [makeShape('shape-12')], camera: { x: 0, y: 0, scale: 1 } }),
    )
    vi.resetModules()
    const fresh = await import('./useShapes')
    const { result } = renderHook(() => fresh.useShapes())

    expect(result.current.shapes.map((s) => s.id)).toEqual(['shape-12'])

    act(() => {
      result.current.startDrawing('rectangle', { x: 0, y: 0 })
      result.current.updateDrawing({ x: 10, y: 10 })
      result.current.endDrawing()
    })

    expect(result.current.shapes).toHaveLength(2)
    expect(result.current.shapes[1].id).not.toBe('shape-12')
  })
})

describe('useShapes: очистка', () => {
  it('удаляет фигуры, историю и выделение', () => {
    const { result } = renderHook(() => useShapes())
    addRect(result)
    expect(result.current.shapes).toHaveLength(1)
    expect(result.current.canUndo).toBe(true)

    act(() => result.current.clearAll())

    expect(result.current.shapes).toHaveLength(0)
    expect(result.current.selectedId).toBeNull()
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })
})

describe('useShapes: удаление', () => {
  it('удаляет фрейм вместе со всеми потомками', () => {
    const { result } = renderHook(() => useShapes())
    const frame = drawFrame(result)
    act(() => {
      result.current.insertImage(SRC, { x: 10, y: 10 }, { width: 20, height: 20 }, frame.id)
    })
    expect(result.current.shapes).toHaveLength(2)

    act(() => result.current.removeShape(frame.id))
    expect(result.current.shapes).toHaveLength(0)
  })

  it('восстанавливает удалённое поддерево через undo', () => {
    const { result } = renderHook(() => useShapes())
    const frame = drawFrame(result)
    act(() => {
      result.current.insertImage(SRC, { x: 10, y: 10 }, { width: 20, height: 20 }, frame.id)
    })

    act(() => result.current.removeShape(frame.id))
    expect(result.current.shapes).toHaveLength(0)

    act(() => result.current.undo())
    expect(result.current.shapes).toHaveLength(2)
    expect(result.current.shapes.some((s) => s.id === frame.id)).toBe(true)
  })

  it('не создаёт запись истории, если удаляемой фигуры уже нет', () => {
    const { result } = renderHook(() => useShapes())
    addRect(result)
    act(() => result.current.undo())
    expect(result.current.canUndo).toBe(false)

    act(() => result.current.removeShape('shape-999'))
    expect(result.current.canUndo).toBe(false)
  })
})
