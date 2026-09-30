import type { Camera, Shape } from '../types/shape'

export const STORAGE_KEY = 'mini-figma:document:v1'

export const SAVE_DEBOUNCE_MS = 300

export const DEFAULT_CAMERA: Camera = { x: 0, y: 0, scale: 1 }

export interface PersistedDocument {
  shapes: Shape[]
  camera: Camera
}

const SHAPE_TYPES = ['rectangle', 'ellipse', 'frame', 'image']

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isValidShape(value: unknown): value is Shape {
  if (typeof value !== 'object' || value === null) return false
  const shape = value as Record<string, unknown>
  if (typeof shape.id !== 'string' || shape.id === '') return false
  if (typeof shape.type !== 'string' || !SHAPE_TYPES.includes(shape.type)) return false
  if (!isFiniteNumber(shape.x) || !isFiniteNumber(shape.y)) return false
  if (!isFiniteNumber(shape.width) || !isFiniteNumber(shape.height)) return false
  if (typeof shape.fill !== 'string') return false
  if (shape.stroke !== null && typeof shape.stroke !== 'string') return false
  if (!isFiniteNumber(shape.strokeWidth)) return false
  if (shape.parentId !== null && shape.parentId !== undefined && typeof shape.parentId !== 'string') {
    return false
  }
  if (shape.src !== undefined && typeof shape.src !== 'string') return false
  if (shape.name !== undefined && typeof shape.name !== 'string') return false
  return true
}

function isValidCamera(value: unknown): value is Camera {
  if (typeof value !== 'object' || value === null) return false
  const camera = value as Record<string, unknown>
  return isFiniteNumber(camera.x) && isFiniteNumber(camera.y) && isFiniteNumber(camera.scale) && camera.scale > 0
}

let cache: PersistedDocument | null | undefined

/** Document is read once per page load: both hooks ask for it during their first render. */
export function loadDocument(): PersistedDocument | null {
  if (cache !== undefined) return cache
  cache = null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cache
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return cache
    const record = parsed as Record<string, unknown>
    if (!Array.isArray(record.shapes)) return cache
    cache = {
      shapes: record.shapes.filter(isValidShape).filter((shape) => shape.id !== '__draft__'),
      camera: isValidCamera(record.camera) ? record.camera : DEFAULT_CAMERA,
    }
  } catch {
    cache = null
  }
  return cache
}

/** Returns false when the browser refuses the write, e.g. images exceed the storage quota. */
export function saveDocument(document: PersistedDocument): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(document))
    return true
  } catch {
    return false
  }
}

export function clearDocument(): void {
  cache = undefined
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // хранилище недоступно — очищать нечего
  }
}
