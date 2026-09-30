import { describe, expect, it } from 'vitest'
import { MAX_IMAGE_EDGE, MAX_IMAGE_BYTES, MIN_IMAGE_EDGE, clampImageSize } from './image'

describe('clampImageSize', () => {
  it('оставляет небольшое изображение без изменений', () => {
    expect(clampImageSize(100, 80)).toEqual({ width: 100, height: 80 })
  })

  it('уменьшает большое изображение по длинной стороне, сохраняя пропорции', () => {
    const size = clampImageSize(2400, 1200)
    expect(size).toEqual({ width: MAX_IMAGE_EDGE, height: MAX_IMAGE_EDGE / 2 })
  })

  it('увеличивает крошечное изображение до минимального размера, чтобы его можно было схватить', () => {
    expect(clampImageSize(10, 10)).toEqual({ width: MIN_IMAGE_EDGE, height: MIN_IMAGE_EDGE })
  })

  it('поднимает слишком узкую сторону до минимального размера, чтобы фигуру можно было схватить', () => {
    const size = clampImageSize(1200, 30)
    expect(size.width).toBe(MAX_IMAGE_EDGE)
    expect(size.height).toBe(MIN_IMAGE_EDGE)
  })

  it('возвращает минимальный размер для вырожденных значений', () => {
    expect(clampImageSize(0, 0)).toEqual({ width: MIN_IMAGE_EDGE, height: MIN_IMAGE_EDGE })
    expect(clampImageSize(-10, 5)).toEqual({ width: MIN_IMAGE_EDGE, height: MIN_IMAGE_EDGE })
  })
})

describe('лимиты загрузки изображений', () => {
  it('ограничивает размер файла, чтобы не раздувать состояние и историю', () => {
    expect(MAX_IMAGE_BYTES).toBe(2 * 1024 * 1024)
  })
})
