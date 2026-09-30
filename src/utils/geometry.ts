import type { Camera, Point, Size } from '../types/shape'

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function subPoints(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y }
}

export function addPoints(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y }
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

export function rectFromPoints(a: Point, b: Point): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  }
}

export function fitImage(container: Size, image: Size): Size {
  const ratio = Math.min(container.width / image.width, container.height / image.height)
  return {
    width: Math.round(image.width * ratio),
    height: Math.round(image.height * ratio),
  }
}