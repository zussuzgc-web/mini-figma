import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

declare global {
  // React 19 требует этот флаг, чтобы act() был разрешён вне тестового рендерера.
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => {
  cleanup()
})
