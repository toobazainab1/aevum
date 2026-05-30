import { useEffect, useRef, useState } from 'react'

/**
 * useScrollAnimation
 * Returns [ref, isVisible]
 * Attach ref to any element — it becomes visible when scrolled into view.
 * 
 * @param {number} threshold - 0 to 1, how much of element must be visible (default 0.15)
 * @param {string} rootMargin - CSS margin for observer (default '0px 0px -60px 0px')
 */
export function useScrollAnimation(threshold = 0.15, rootMargin = '0px 0px -60px 0px') {
  const ref = useRef()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el) // animate once
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return [ref, isVisible]
}