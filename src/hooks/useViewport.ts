import { useCallback, useEffect, useRef, useState } from 'react'
import type { Camera, Point, Size } from '../types/shape'
import { clamp } from '../utils/geometry'

export const MIN_SCALE = 0.05
export const MAX_SCALE = 5

const FIT_PADDING = 80

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export function useViewport() {
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, scale: 1 })
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isPanning, setIsPanning] = useState(false)

  const cameraRef = useRef(camera)
  cameraRef.current = camera
  const spaceRef = useRef(false)
  const panRef = useRef<{ start: Point; cam: Camera } | null>(null)

  const endPan = useCallback(() => {
    panRef.current = null
    setIsPanning(false)
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      // Do not swallow the spacebar while the user types in a field.
      const target = e.target
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return
      }
      e.preventDefault()
      if (spaceRef.current) return
      spaceRef.current = true
      setIsSpacePressed(true)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
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

  const beginPan = useCallback((point: Point) => {
    panRef.current = { start: point, cam: cameraRef.current }
    setIsPanning(true)
  }, [])

  const panTo = useCallback((point: Point) => {
    const pan = panRef.current
    if (!pan) return
    setCamera({
      ...pan.cam,
      x: pan.cam.x + (point.x - pan.start.x),
      y: pan.cam.y + (point.y - pan.start.y),
    })
  }, [])

  const scrollBy = useCallback((dx: number, dy: number) => {
    setCamera((cam) => ({ ...cam, x: cam.x + dx, y: cam.y + dy }))
  }, [])

  const zoomAt = useCallback((screenPoint: Point, factor: number) => {
    setCamera((cam) => {
      const scale = clamp(cam.scale * factor, MIN_SCALE, MAX_SCALE)
      const ratio = scale / cam.scale
      return {
        scale,
        x: screenPoint.x - (screenPoint.x - cam.x) * ratio,
        y: screenPoint.y - (screenPoint.y - cam.y) * ratio,
      }
    })
  }, [])

  const fitBounds = useCallback((bounds: Rect | null, viewport: Size) => {
    if (!bounds || viewport.width <= 0 || viewport.height <= 0) {
      setCamera({ x: 0, y: 0, scale: 1 })
      return
    }
    const scale = clamp(
      Math.min(
        (viewport.width - FIT_PADDING) / bounds.width,
        (viewport.height - FIT_PADDING) / bounds.height,
      ),
      MIN_SCALE,
      MAX_SCALE,
    )
    setCamera({
      scale,
      x: viewport.width / 2 - (bounds.x + bounds.width / 2) * scale,
      y: viewport.height / 2 - (bounds.y + bounds.height / 2) * scale,
    })
  }, [])

  return {
    camera,
    isSpacePressed,
    isPanning,
    beginPan,
    panTo,
    endPan,
    scrollBy,
    zoomAt,
    fitBounds,
  }
}

export default useViewport