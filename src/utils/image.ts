import type { Size } from '../types/shape'

/** Max edge length of an inserted image, in canvas units. */
export const MAX_IMAGE_EDGE = 600

/** Min edge length, so a tiny image stays grabbable. */
export const MIN_IMAGE_EDGE = 40

/**
 * Reject files large enough to blow up the shape state or the undo history.
 * Images are stored inline as data URLs, so the cost is roughly 4/3 of the
 * file size, multiplied by every history snapshot.
 */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024

export function clampImageSize(width: number, height: number): Size {
  if (width <= 0 || height <= 0) {
    return { width: MIN_IMAGE_EDGE, height: MIN_IMAGE_EDGE }
  }
  const ratio = Math.min(1, MAX_IMAGE_EDGE / Math.max(width, height))
  return {
    width: Math.round(Math.max(MIN_IMAGE_EDGE, width * ratio)),
    height: Math.round(Math.max(MIN_IMAGE_EDGE, height * ratio)),
  }
}

/**
 * Read an image file into a data URL plus its clamped size.
 * Rejects on unreadable file, undecodable data and oversized files.
 */
export function readImageFile(file: File): Promise<{ src: string; size: Size }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('not an image'))
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error('file too large'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.onload = () => {
      const src = reader.result as string
      const img = new Image()
      img.onerror = () => reject(new Error('decode failed'))
      img.onload = () =>
        resolve({
          src,
          size: clampImageSize(img.naturalWidth, img.naturalHeight),
        })
      img.src = src
    }
    reader.readAsDataURL(file)
  })
}