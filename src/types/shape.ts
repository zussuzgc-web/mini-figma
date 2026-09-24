export type Tool = 'select' | 'rectangle' | 'ellipse'

export type ShapeType = 'rectangle' | 'ellipse'

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Camera {
  x: number
  y: number
  scale: number
}

export interface Shape {
  id: string
  type: ShapeType
  x: number
  y: number
  width: number
  height: number
  fill: string
  stroke: string | null
  strokeWidth: number
}