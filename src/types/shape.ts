export type Tool = 'select' | 'rectangle' | 'ellipse' | 'frame' | 'image'

export type ShapeType = 'rectangle' | 'ellipse' | 'frame' | 'image'

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
  parentId?: string | null
  src?: string
  name?: string
}
