import { useCallback, useEffect, useRef, useState } from 'react'
import type { Camera, Point, Size } from '../types/shape'
import { clamp } from '../utils/geometry'

export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 4

export function useViewport() {
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [isSpacePressed, setIsSpacePressed] = useState(false)

  const spaceRef = useRef(false)
  const panningRef = useRef(false)
  const lastPointRef = useRef<Point | null>(null)

  const endPan = useCallback(() => {
    panningRef.current = false
    lastPointRef.current = null
    setIsPanning(false)
  }, [])

  const beginPan = useCallback((point: Point) => {
    if (!spaceRef.current) return
    lastPointRef.current = point
    panningRef.current = true
    setIsPanning(true)
  }, [])

  const panTo = useCallback((point: Point) => {
    const last = lastPointRef.current
    if (!panningRef.current || !last) return
    setCamera((c) => ({
      ...c,
      x: c.x + (point.x - last.x),
      y: c.y + (point.y - last.y),
    }))
    lastPointRef.current = point
  }, [])

  const zoomAt = useCallback((point: Point, factor: number) => {
    setCamera((c) => {
      const scale = clamp(c.scale * factor, MIN_ZOOM, MAX_ZOOM)
      const ratio = scale / c.scale
      return {
        scale,
        x: point.x - (point.x - c.x) * ratio,
        y: point.y - (point.y - c.y) * ratio,
      }
    })
  }, [])

  const centerOn = useCallback((size: Size) => {
    setCamera({ x: size.width / 2, y: size.height / 2, scale: 1 })
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      e.preventDefault()
      spaceRef.current = true
      setIsSpacePressed(true)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      e.preventDefault()
      spaceRef.current = false
      setIsSpacePressed(false)
      endPan()
    }
    const onBlur = () => {
      spaceRef.current = false
      setIsSpacePressed(false)
      endPan()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [endPan])

  return { camera, isPanning, isSpacePressed, beginPan, panTo, endPan, zoomAt, centerOn }
}