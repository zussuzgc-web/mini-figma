import type { Tool } from '../types/shape'

export interface ToolDefinition {
  id: Tool
  label: string
  hotkey: string
}

export const TOOLS: Record<Tool, ToolDefinition> = {
  select: { id: 'select', label: 'Move', hotkey: 'V' },
  rectangle: { id: 'rectangle', label: 'Rectangle', hotkey: 'R' },
  ellipse: { id: 'ellipse', label: 'Ellipse', hotkey: 'O' },
}

export const TOOL_ORDER: Tool[] = ['select', 'rectangle', 'ellipse']

export const TOOL_HOTKEYS: Record<string, Tool> = {
  v: 'select',
  r: 'rectangle',
  o: 'ellipse',
}