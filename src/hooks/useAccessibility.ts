import { useEffect, useRef } from 'react'

export function useKeyboardNavigation(
  ref: React.RefObject<HTMLElement>,
  options: {
    onEnter?: () => void
    onEscape?: () => void
    onArrowUp?: () => void
    onArrowDown?: () => void
  }
) {
  useEffect(() => {
    const element = ref.current
    if (!element) return

    function handleKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case 'Enter':
          if (options.onEnter) {
            event.preventDefault()
            options.onEnter()
          }
          break
        case 'Escape':
          if (options.onEscape) {
            event.preventDefault()
            options.onEscape()
          }
          break
        case 'ArrowUp':
          if (options.onArrowUp) {
            event.preventDefault()
            options.onArrowUp()
          }
          break
        case 'ArrowDown':
          if (options.onArrowDown) {
            event.preventDefault()
            options.onArrowDown()
          }
          break
      }
    }

    element.addEventListener('keydown', handleKeyDown)
    return () => element.removeEventListener('keydown', handleKeyDown)
  }, [ref, options])
}

export function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  callback: () => void
) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [ref, callback])
}

export function useGainFocus(condition: boolean) {
  const ref = useRef<HTMLElement>(null)
  
  useEffect(() => {
    if (condition && ref.current) {
      ref.current.focus({ preventScroll: true })
    }
  }, [condition])
  
  return ref
}