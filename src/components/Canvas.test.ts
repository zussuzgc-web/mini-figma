import { describe, expect, it } from 'vitest'
import { hitTest, visibleAt } from './Canvas'
import type { Shape } from '../types/shape'

function rect(overrides: Partial<Shape> & { id: string; x: number; y: number }): Shape {
  return {
    type: 'rectangle',
    width: 100,
    height: 100,
    fill: '#fff',
    stroke: null,
    strokeWidth: 0,
    parentId: null,
    ...overrides,
  }
}

describe('visibleAt', () => {
  it('возвращает все фигуры, если предков нет', () => {
    const shapes = [rect({ id: 'a', x: 0, y: 0 }), rect({ id: 'b', x: 0, y: 0 })]
    expect(visibleAt(shapes, { x: 10, y: 10 }).map((s) => s.id)).toEqual(['a', 'b'])
  })

  it('скрывает потомка, если точка вне фрейма', () => {
    const shapes = [
      rect({ id: 'frame', type: 'frame', x: 0, y: 0, width: 50, height: 50 }),
      rect({ id: 'child', x: 0, y: 0, width: 20, height: 20, parentId: 'frame' }),
    ]
    expect(visibleAt(shapes, { x: 100, y: 100 }).map((s) => s.id)).toEqual(['frame'])
  })

  it('показывает потомка, когда точка внутри всех предков', () => {
    const shapes = [
      rect({ id: 'outer', type: 'frame', x: 0, y: 0, width: 200, height: 200 }),
      rect({ id: 'inner', type: 'frame', x: 0, y: 0, width: 100, height: 100, parentId: 'outer' }),
      rect({ id: 'child', x: 10, y: 10, width: 20, height: 20, parentId: 'inner' }),
    ]
    expect(visibleAt(shapes, { x: 15, y: 15 }).map((s) => s.id)).toEqual(['outer', 'inner', 'child'])
  })
})

describe('hitTest', () => {
  it('возвращает null на пустом холсте', () => {
    expect(hitTest([], { x: 0, y: 0 })).toBeNull()
  })

  it('возвращает null, если под курсором ничего нет', () => {
    const shapes = [rect({ id: 'a', x: 0, y: 0 })]
    expect(hitTest(shapes, { x: 500, y: 500 })).toBeNull()
  })

  it('выбирает фигуру, расположенную позже в массиве, как верхнюю', () => {
    const shapes = [rect({ id: 'bottom', x: 0, y: 0 }), rect({ id: 'top', x: 50, y: 50 })]
    expect(hitTest(shapes, { x: 60, y: 60 })?.id).toBe('top')
  })

  it('не выбирает ничего за пределами фрейма, даже если потомок там есть', () => {
    const shapes = [
      rect({ id: 'frame', type: 'frame', x: 0, y: 0, width: 50, height: 50 }),
      rect({ id: 'child', x: 0, y: 0, width: 200, height: 200, parentId: 'frame' }),
    ]
    expect(hitTest(shapes, { x: 120, y: 120 })).toBeNull()
  })

  it('выбирает обрезанного потомка внутри фрейма, где он ещё виден', () => {
    const shapes = [
      rect({ id: 'frame', type: 'frame', x: 0, y: 0, width: 50, height: 50 }),
      rect({ id: 'child', x: 0, y: 0, width: 200, height: 200, parentId: 'frame' }),
    ]
    expect(hitTest(shapes, { x: 10, y: 10 })?.id).toBe('child')
  })

  it('считает границы фигуры включительно', () => {
    const shapes = [rect({ id: 'a', x: 0, y: 0, width: 10, height: 10 })]
    expect(hitTest(shapes, { x: 10, y: 10 })?.id).toBe('a')
  })
})
