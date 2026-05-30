import { useEffect, useRef } from 'react'

export default function Cursor() {
  const dotRef  = useRef()
  const ringRef = useRef()
  const mouse   = useRef({ x: -100, y: -100 })
  const ring    = useRef({ x: -100, y: -100 })
  const rafRef  = useRef()

  useEffect(() => {
    // Hide system cursor globally
    document.documentElement.style.cursor = 'none'
    document.body.style.cursor = 'none'

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY }
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX + 'px'
        dotRef.current.style.top  = e.clientY + 'px'
        dotRef.current.style.opacity = '1'
      }
      if (ringRef.current) {
        ringRef.current.style.opacity = '1'
      }
    }

    const lerp = (a, b, t) => a + (b - a) * t

    const animate = () => {
      ring.current.x = lerp(ring.current.x, mouse.current.x, 0.1)
      ring.current.y = lerp(ring.current.y, mouse.current.y, 0.1)
      if (ringRef.current) {
        ringRef.current.style.left = ring.current.x + 'px'
        ringRef.current.style.top  = ring.current.y + 'px'
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    const onEnter = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = 'translate(-50%,-50%) scale(2.5)'
        dotRef.current.style.background = 'var(--gold-light)'
      }
      if (ringRef.current) {
        ringRef.current.style.transform = 'translate(-50%,-50%) scale(1.6)'
        ringRef.current.style.borderColor = 'var(--gold-light)'
        ringRef.current.style.opacity = '0.4'
      }
    }

    const onLeave = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = 'translate(-50%,-50%) scale(1)'
        dotRef.current.style.background = 'var(--gold)'
      }
      if (ringRef.current) {
        ringRef.current.style.transform = 'translate(-50%,-50%) scale(1)'
        ringRef.current.style.borderColor = 'var(--gold)'
        ringRef.current.style.opacity = '0.6'
      }
    }

    // Hide cursor when leaving window
    const onLeaveWindow = () => {
      if (dotRef.current)  dotRef.current.style.opacity  = '0'
      if (ringRef.current) ringRef.current.style.opacity = '0'
    }

    const attachListeners = () => {
      document.querySelectorAll('a, button').forEach(el => {
        el.style.cursor = 'none'
        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
      })
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeaveWindow)
    attachListeners()

    // Re-attach on DOM changes (for dynamic content)
    const observer = new MutationObserver(attachListeners)
    observer.observe(document.body, { childList: true, subtree: true })

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeaveWindow)
      cancelAnimationFrame(rafRef.current)
      observer.disconnect()
      document.documentElement.style.cursor = ''
      document.body.style.cursor = ''
    }
  }, [])

  return (
    <>
      {/* Gold dot */}
      <div ref={dotRef} style={{
        width: 8,
        height: 8,
        background: 'var(--gold)',
        borderRadius: '50%',
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 99999,
        transform: 'translate(-50%,-50%)',
        transition: 'transform 0.15s ease, background 0.2s ease',
        opacity: 0,
        left: -100,
        top: -100,
      }} />

      {/* Gold ring (lagging behind) */}
      <div ref={ringRef} style={{
        width: 36,
        height: 36,
        border: '1.5px solid var(--gold)',
        borderRadius: '50%',
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 99998,
        transform: 'translate(-50%,-50%)',
        transition: 'transform 0.3s ease, opacity 0.3s ease, border-color 0.2s ease',
        opacity: 0,
        left: -100,
        top: -100,
      }} />
    </>
  )
}