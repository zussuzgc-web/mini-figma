import { useEffect, useState } from 'react'
import type { Shape } from '../types/shape'
import { SHAPE_LABELS } from '../constants/tools'

const SWATCHES = ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#ec4899', '#ffffff', '#000000', '#71717a']

interface PropertiesPanelProps {
  shapes: Shape[]
  selectedId: string | null
  onUpdateShape: (id: string, patch: Partial<Shape>) => void
  onRemoveShape: (id: string) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

const GEOMETRY_KEYS = [
  { label: 'X', key: 'x', min: null },
  { label: 'Y', key: 'y', min: null },
  { label: 'W', key: 'width', min: 1 },
  { label: 'H', key: 'height', min: 1 },
] as const

const FIELD_CLASS = 'w-full rounded border border-zinc-700 bg-zinc-900 px-1.5 py-1 text-zinc-100 outline-none focus:border-sky-500'

/**
 * Number input with a local draft: history is written once on commit
 * (blur/Enter) instead of on every keystroke.
 */
function NumberField({
  label,
  value,
  min,
  onCommit,
  inputClassName,
}: {
  label: string
  value: number
  min?: number
  onCommit: (value: number) => void
  inputClassName?: string
}) {
  const [draft, setDraft] = useState(() => String(Math.round(value)))

  useEffect(() => {
    setDraft(String(Math.round(value)))
  }, [value])

  const commit = () => {
    const parsed = Number(draft)
    if (draft.trim() === '' || !Number.isFinite(parsed)) {
      setDraft(String(Math.round(value)))
      return
    }
    const next = min === undefined ? parsed : Math.max(min, parsed)
    setDraft(String(next))
    onCommit(next)
  }

  return (
    <label className="flex items-center gap-1.5 text-xs text-zinc-400">
      <span>{label}</span>
      <input
        type="number"
        value={draft}
        min={min}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            e.currentTarget.blur()
          } else if (e.key === 'Escape') {
            setDraft(String(Math.round(value)))
            e.currentTarget.blur()
          }
        }}
        className={inputClassName}
      />
    </label>
  )
}

/** Text input with a local draft, so a name edit is one history entry, not one per key. */
function TextField({
  label,
  value,
  onCommit,
}: {
  label: string
  value: string
  onCommit: (value: string) => void
}) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  return (
    <label className="block text-xs text-zinc-400">
      {label}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onCommit(draft)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            e.currentTarget.blur()
          } else if (e.key === 'Escape') {
            setDraft(value)
            e.currentTarget.blur()
          }
        }}
        className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-1.5 py-1 text-zinc-100 outline-none focus:border-sky-500"
      />
    </label>
  )
}

function PropertiesPanel({
  shapes,
  selectedId,
  onUpdateShape,
  onRemoveShape,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: PropertiesPanelProps) {
  const shape = shapes.find((s) => s.id === selectedId)

  return (
    <section className="flex-1 overflow-y-auto border-b border-zinc-800 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Properties</h2>
        <div className="flex gap-1">
          <button
            type="button"
            title="Undo (Ctrl+Z)"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-6 w-6 rounded bg-zinc-900 text-xs text-zinc-300 enabled:hover:bg-zinc-800 disabled:text-zinc-700"
          >
            ↶
          </button>
          <button
            type="button"
            title="Redo (Ctrl+Shift+Z)"
            onClick={onRedo}
            disabled={!canRedo}
            className="h-6 w-6 rounded bg-zinc-900 text-xs text-zinc-300 enabled:hover:bg-zinc-800 disabled:text-zinc-700"
          >
            ↷
          </button>
        </div>
      </div>

      {!shape ? (
        <p className="mt-2 text-xs text-zinc-600">Выберите фигуру, чтобы изменить её свойства.</p>
      ) : (
        <div className="mt-3 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-200">{SHAPE_LABELS[shape.type]}</span>
            <span className="font-mono text-xs text-zinc-500">{shape.id}</span>
          </div>

          {shape.type === 'frame' && (
            <TextField
              label="Name"
              value={shape.name ?? ''}
              onCommit={(value) => onUpdateShape(shape.id, { name: value })}
            />
          )}

          <div className="grid grid-cols-2 gap-2">
            {GEOMETRY_KEYS.map(({ label, key, min }) => (
              <NumberField
                key={key}
                label={label}
                value={shape[key]}
                min={min ?? undefined}
                onCommit={(value) =>
                  onUpdateShape(shape.id, { [key]: value } as Partial<Shape>)
                }
                inputClassName={FIELD_CLASS}
              />
            ))}
          </div>

          {shape.type !== 'image' && (
            <div>
              <span className="text-xs text-zinc-500">Fill</span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={shape.fill.startsWith('#') ? shape.fill : '#60a5fa'}
                  onChange={(e) => onUpdateShape(shape.id, { fill: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded border border-zinc-700 bg-zinc-900 p-0.5"
                />
                <span className="font-mono text-xs text-zinc-400">{shape.fill}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SWATCHES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onClick={() => onUpdateShape(shape.id, { fill: color })}
                    className={`h-6 w-6 rounded border border-zinc-700 ${
                      shape.fill === color ? 'ring-2 ring-sky-400' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <span className="text-xs text-zinc-500">Stroke</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={shape.stroke ?? '#818cf8'}
                onChange={(e) => onUpdateShape(shape.id, { stroke: e.target.value, strokeWidth: 1 })}
                className="h-8 w-10 cursor-pointer rounded border border-zinc-700 bg-zinc-900 p-0.5"
              />
              <NumberField
                label="Width"
                value={shape.strokeWidth}
                min={0}
                onCommit={(value) => onUpdateShape(shape.id, { strokeWidth: value })}
                inputClassName="w-16 rounded border border-zinc-700 bg-zinc-900 px-1.5 py-1 text-zinc-100 outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => onRemoveShape(shape.id)}
            className="w-full rounded bg-red-600/20 px-2 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-600/30"
          >
            Delete (Del)
          </button>
        </div>
      )}
    </section>
  )
}

export default PropertiesPanel