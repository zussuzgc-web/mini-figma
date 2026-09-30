import type { Shape } from '../types/shape'
import { SHAPE_LABELS } from '../constants/tools'

interface LayersPanelProps {
  shapes: Shape[]
  selectedId: string | null
  onSelectShape: (id: string | null) => void
}

function LayersPanel({ shapes, selectedId, onSelectShape }: LayersPanelProps) {
  const roots = shapes.filter((s) => !s.parentId)
  const childrenOf = (id: string) => shapes.filter((s) => s.parentId === id)

  const renderRow = (shape: Shape, depth: number) => (
    <li key={shape.id}>
      <button
        type="button"
        onClick={() => onSelectShape(shape.id)}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        className={`flex w-full items-center gap-2 rounded py-1 pr-2 text-left text-xs transition-colors ${
          shape.id === selectedId
            ? 'bg-zinc-800 text-zinc-100'
            : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
        }`}
      >
        <span
          className={`h-3 w-3 shrink-0 ${
            shape.type === 'ellipse'
              ? 'rounded-full'
              : shape.type === 'frame'
                ? 'rounded-[1px] border border-indigo-400'
                : shape.type === 'image'
                  ? 'bg-zinc-700'
                  : 'rounded-[2px]'
          }`}
          style={
            shape.type === 'frame' || shape.type === 'image' ? undefined : { backgroundColor: shape.fill }
          }
        />
        <span className="truncate">
          {shape.name?.trim() || SHAPE_LABELS[shape.type]}
        </span>
      </button>
      {childrenOf(shape.id).length > 0 && (
        <ul className="mt-0.5 space-y-0.5">{childrenOf(shape.id).map((c) => renderRow(c, depth + 1))}</ul>
      )}
    </li>
  )

  return (
    <section className="flex-1 overflow-y-auto p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Layers</h2>
      {roots.length === 0 ? (
        <p className="mt-2 text-xs text-zinc-600">Фигур пока нет.</p>
      ) : (
        <ul className="mt-2 space-y-0.5">
          {[...roots].reverse().map((shape) => renderRow(shape, 0))}
        </ul>
      )}
    </section>
  )
}

export default LayersPanel