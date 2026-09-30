import type { Tool, ShapeType } from '../types/shape'

export interface ToolDef {
  id: Tool
  label: string
  icon: string
  hotkey: string
}

export const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Move', icon: '↖', hotkey: 'V' },
  { id: 'frame', label: 'Frame', icon: '▣', hotkey: 'F' },
  { id: 'rectangle', label: 'Rectangle', icon: '▭', hotkey: 'R' },
  { id: 'ellipse', label: 'Ellipse', icon: '◯', hotkey: 'O' },
  { id: 'image', label: 'Image', icon: '▨', hotkey: 'I' },
]

export const TOOL_HOTKEYS: Record<string, Tool> = {
  v: 'select',
  f: 'frame',
  r: 'rectangle',
  o: 'ellipse',
  i: 'image',
}

export const SHAPE_LABELS: Record<ShapeType, string> = {
  frame: 'Frame',
  rectangle: 'Rectangle',
  ellipse: 'Ellipse',
  image: 'Image',
}