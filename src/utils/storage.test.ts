import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEY, saveDocument } from './storage'
import type { PersistedDocument } from './storage'
import type { Shape } from '../types/shape'

function shape(id: string, overrides: Partial<Shape> = {}): Shape {
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
    ...overrides,
  }
}

async function freshStorage() {
  vi.resetModules()
  return import('./storage')
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.resetModules()
})

describe('loadDocument', () => {
  it('возвращает null, если сохранения ещё нет', async () => {
    const { loadDocument: load } = await freshStorage()
    expect(load()).toBeNull()
  })

  it('читает фигуры и камеру обратно', async () => {
    const camera = { x: 12, y: -8, scale: 2 }
    saveDocument({ shapes: [shape('shape-1')], camera })
    const { loadDocument: load } = await freshStorage()

    const document = load()
    expect(document?.shapes).toHaveLength(1)
    expect(document?.shapes[0]).toMatchObject({ id: 'shape-1', width: 100 })
    expect(document?.camera).toEqual(camera)
  })

  it('переживает битый JSON и не ломает запуск', async () => {
    localStorage.setItem(STORAGE_KEY, '{это не json')
    const { loadDocument: load } = await freshStorage()
    expect(load()).toBeNull()
  })

  it('выбрасывает фигуры с неверными полями, но сохраняет корректные', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        shapes: [shape('shape-1'), { id: 'broken', type: 'rectangle', x: 'нет' }, null, 42],
        camera: { x: 0, y: 0, scale: 1 },
      }),
    )
    const { loadDocument: load } = await freshStorage()

    const document = load()
    expect(document?.shapes.map((s) => s.id)).toEqual(['shape-1'])
  })

  it('не принимает фигуру неизвестного типа', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ shapes: [shape('shape-1', { type: 'star' as Shape['type'] })], camera: null }),
    )
    const { loadDocument: load } = await freshStorage()
    expect(load()?.shapes).toHaveLength(0)
  })

  it('не восстанавливает черновик, который не должен попасть в документ', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ shapes: [shape('__draft__'), shape('shape-1')], camera: null }),
    )
    const { loadDocument: load } = await freshStorage()
    expect(load()?.shapes.map((s) => s.id)).toEqual(['shape-1'])
  })

  it('подставляет камеру по умолчанию, если сохранённая битая', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ shapes: [], camera: { x: 0, y: 0, scale: 0 } }))
    const { loadDocument: load, DEFAULT_CAMERA } = await freshStorage()
    expect(load()?.camera).toEqual(DEFAULT_CAMERA)
  })

  it('читает документ из памяти только один раз за загрузку страницы', async () => {
    const { loadDocument: load } = await freshStorage()
    expect(load()).toBeNull()

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ shapes: [shape('shape-1')], camera: null }))
    expect(load()).toBeNull()
  })
})

describe('saveDocument', () => {
  it('сообщает об успешной записи', () => {
    expect(saveDocument({ shapes: [shape('shape-1')], camera: { x: 0, y: 0, scale: 1 } })).toBe(true)
  })

  it('сохраняет содержимое, которое затем читается', async () => {
    const document: PersistedDocument = {
      shapes: [shape('shape-1', { type: 'image', src: 'data:image/png;base64,AAA' })],
      camera: { x: 4, y: 4, scale: 1.5 },
    }
    expect(saveDocument(document)).toBe(true)

    const { loadDocument: load } = await freshStorage()
    expect(load()?.shapes[0]).toMatchObject({ type: 'image', src: 'data:image/png;base64,AAA' })
  })

  it('не бросает ошибку, когда хранилище переполнено', () => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new DOMException('QuotaExceededError')
    }
    try {
      expect(saveDocument({ shapes: [], camera: { x: 0, y: 0, scale: 1 } })).toBe(false)
    } finally {
      Storage.prototype.setItem = original
    }
  })
})

describe('clearDocument', () => {
  it('удаляет сохранение', async () => {
    saveDocument({ shapes: [shape('shape-1')], camera: { x: 0, y: 0, scale: 1 } })
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()

    const { clearDocument: clear } = await freshStorage()
    clear()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
