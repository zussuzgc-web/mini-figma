import type { Shape } from '../types/shape'

interface LayersPanelProps {
  shapes: Shape[]
  selectedId: string | null
  onSelectShape: (id: string | null) => void
}

function LayersPanel({ shapes, selectedId, onSelectShape }: LayersPanelProps) {
  return (
    <section className="flex-1 overflow-y-auto p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Layers</h2>
      {shapes.length === 0 ? (
        <p className="mt-2 text-xs text-zinc-600">Фигур пока нет.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {[...shapes].reverse().map((shape) => (
            <li key={shape.id}>
              <button
                type="button"
                onClick={() => onSelectShape(shape.id)}
                className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs transition-colors ${
                  shape.id === selectedId
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`h-3 w-3 shrink-0 ${
                      shape.type === 'ellipse' ? 'rounded-full' : 'rounded-[2px]'
                    }`}
                    style={{ backgroundColor: shape.fill }}
                  />
                  <span className="truncate">
                    {shape.type === 'ellipse' ? 'Ellipse' : 'Rectangle'} {shape.id}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default LayersPanel