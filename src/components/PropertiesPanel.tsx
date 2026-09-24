import type { Shape } from '../types/shape'

const SWATCHES = ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#ec4899', '#ffffff', '#000000', '#71717a']

interface PropertiesPanelProps {
  shapes: Shape[]
  selectedId: string | null
  onUpdateShape: (id: string, patch: Partial<Shape>) => void
}

function PropertiesPanel({ shapes, selectedId, onUpdateShape }: PropertiesPanelProps) {
  const shape = shapes.find((s) => s.id === selectedId)

  return (
    <section className="flex-1 overflow-y-auto border-b border-zinc-800 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Properties</h2>
      {!shape ? (
        <p className="mt-2 text-xs text-zinc-600">Выберите фигуру, чтобы изменить её свойства.</p>
      ) : (
        <div className="mt-3 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-200">
              {shape.type === 'ellipse' ? 'Ellipse' : 'Rectangle'}
            </span>
            <span className="font-mono text-xs text-zinc-500">{shape.id}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['X', 'x'],
                ['Y', 'y'],
                ['W', 'width'],
                ['H', 'height'],
              ] as const
            ).map(([label, key]) => (
              <label key={key} className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span>{label}</span>
                <input
                  type="number"
                  value={Math.round(shape[key])}
                  onChange={(e) =>
                    onUpdateShape(shape.id, { [key]: Number(e.target.value) } as Partial<Shape>)
                  }
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-1.5 py-1 text-zinc-100 outline-none focus:border-sky-500"
                />
              </label>
            ))}
          </div>

          <div>
            <span className="text-xs text-zinc-500">Fill</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={shape.fill}
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
        </div>
      )}
    </section>
  )
}

export default PropertiesPanel