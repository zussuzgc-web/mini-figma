import type { Shape } from '../types/shape'

interface ShapeViewProps {
  shape: Shape
  selected: boolean
  scale?: number
}

const HANDLE_SIZE = 8

function handlePositions(width: number, height: number) {
  return [
    { left: 0, top: 0 },
    { left: width / 2, top: 0 },
    { left: width, top: 0 },
    { left: width, top: height / 2 },
    { left: width, top: height },
    { left: width / 2, top: height },
    { left: 0, top: height },
    { left: 0, top: height / 2 },
  ]
}

function ShapeView({ shape, selected, scale = 1 }: ShapeViewProps) {
  const flattened = 1 / scale
  const handle = HANDLE_SIZE / scale
  const base: React.CSSProperties = {
    position: 'absolute',
    left: shape.x,
    top: shape.y,
    width: shape.width,
    height: shape.height,
    backgroundColor: shape.fill,
    border: shape.stroke ? `${shape.strokeWidth}px solid ${shape.stroke}` : undefined,
    boxSizing: 'border-box',
  }

  const style: React.CSSProperties =
    shape.type === 'ellipse'
      ? { ...base, borderRadius: '50%' }
      : { ...base, borderRadius: '6px' }

  return (
    <>
      <div key="shape" style={style} />
      {selected && (
        <div
          key="frame"
          className="pointer-events-none absolute"
          style={{
            left: shape.x,
            top: shape.y,
            width: shape.width,
            height: shape.height,
            border: `${flattened}px solid #38bdf8`,
            boxSizing: 'border-box',
          }}
        >
          {handlePositions(shape.width, shape.height).map((pos, i) => (
            <div
              key={i}
              className="absolute rounded-sm"
              style={{
                left: pos.left,
                top: pos.top,
                width: handle,
                height: handle,
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#38bdf8',
                border: `${flattened}px solid #0f172a`,
                boxSizing: 'border-box',
              }}
            />
          ))}
        </div>
      )}
    </>
  )
}

export default ShapeView