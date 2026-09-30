import { describe, expect, it } from 'vitest'
import { clamp, rectFromPoints, screenToCanvas, subPoints } from './geometry'

describe('clamp', () => {
  it('возвращает значение внутри границ без изменений', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('прижимает значение к нижней и верхней границе', () => {
    expect(clamp(-3, 0, 10)).toBe(0)
    expect(clamp(42, 0, 10)).toBe(10)
  })
})

describe('subPoints', () => {
  it('вычитает координаты', () => {
    expect(subPoints({ x: 10, y: 20 }, { x: 3, y: 4 })).toEqual({ x: 7, y: 16 })
  })

  it('сохраняет отрицательные смещения', () => {
    expect(subPoints({ x: 1, y: 1 }, { x: 5, y: 5 })).toEqual({ x: -4, y: -4 })
  })
})

describe('screenToCanvas', () => {
  it('переводит экранные координаты в координаты холста', () => {
    const camera = { x: 100, y: 50, scale: 2 }
    expect(screenToCanvas({ x: 300, y: 150 }, camera)).toEqual({ x: 100, y: 50 })
  })

  it('учитывает отрицательное смещение камеры', () => {
    const camera = { x: -50, y: -50, scale: 1 }
    expect(screenToCanvas({ x: 0, y: 0 }, camera)).toEqual({ x: 50, y: 50 })
  })
})

describe('rectFromPoints', () => {
  it('строит прямоугольник от верхнего левого угла', () => {
    expect(rectFromPoints({ x: 10, y: 20 }, { x: 30, y: 60 })).toEqual({
      x: 10,
      y: 20,
      width: 20,
      height: 40,
    })
  })

  it('нормализует прямоугольник, когда рисование идёт справа налево', () => {
    expect(rectFromPoints({ x: 30, y: 60 }, { x: 10, y: 20 })).toEqual({
      x: 10,
      y: 20,
      width: 20,
      height: 40,
    })
  })

  it('даёт нулевой размер для клика без перетаскивания', () => {
    expect(rectFromPoints({ x: 5, y: 5 }, { x: 5, y: 5 })).toEqual({
      x: 5,
      y: 5,
      width: 0,
      height: 0,
    })
  })
})
