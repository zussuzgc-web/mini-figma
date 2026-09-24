import type { Camera, Point } from '../types/shape'

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function screenToCanvas(screen: Point, camera: Camera): Point {
  return {
    x: (screen.x - camera.x) / camera.scale,
    y: (screen.y - camera.y) / camera.scale,
  }
}

export function canvasToScreen(canvas: Point, camera: Camera): Point {
  return {
    x: canvas.x * camera.scale + camera.x,
    y: canvas.y * camera.scale + camera.y,
  }
}

export function rectFromPoints(a: Point, b: Point) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  }
}

export function subPoints(a: Point, b: Point): Point {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  }
}