import { useEffect, useRef, useState } from 'react'
import { getProductImages } from '../utils/perfumeImages'

const INTERVAL_MS = 4000

/**
 * Photo slider for a perfume. Shows the hand photo first, then slides to the scene photo.
 * Returns null when no photos exist for the product so the caller can fall back to the SVG bottle.
 *
 * Props:
 *  - name: product name (used to look up the photos)
 *  - fit: 'cover' | 'contain'
 *  - autoplay: slide automatically (default true)
 *  - controls: show dots + arrows (default true)
 *  - radius: border radius in px
 */
export default function ProductImageSlider({
  name, fit = 'cover', autoplay = true, controls = true, radius = 0, style,
}) {
  const images = getProductImages(name)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchX = useRef(null)
  const count = images.length

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => { setIndex(0) }, [name])

  useEffect(() => {
    if (!autoplay || paused || reduceMotion || count < 2) return
    const t = setInterval(() => setIndex(i => (i + 1) % count), INTERVAL_MS)
    return () => clearInterval(t)
  }, [autoplay, paused, reduceMotion, count])

  if (count === 0) return null

  const go = (i) => setIndex(((i % count) + count) % count)

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; setPaused(true) }
  const onTouchEnd = (e) => {
    if (touchX.current !== null) {
      const dx = e.changedTouches[0].clientX - touchX.current
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1))
    }
    touchX.current = null
    setPaused(false)
  }

  const arrow = (side) => ({
    position: 'absolute', top: '50%', [side]: 10, transform: 'translateY(-50%)',
    width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
    background: 'rgba(255,255,255,0.78)', color: '#1C1712', fontSize: 18, lineHeight: '32px',
    padding: 0, zIndex: 3, opacity: 0, transition: 'opacity .3s',
  })

  return (
    <div
      className="pis-root"
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: radius, ...style }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
      aria-label={`${name} photos`}
    >
      <div
        style={{
          display: 'flex', width: '100%', height: '100%',
          transform: `translateX(-${index * 100}%)`,
          transition: reduceMotion ? 'none' : 'transform 0.8s cubic-bezier(.65,.05,.36,1)',
        }}
      >
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`${name} eau de parfum, photo ${i + 1} of ${count}`}
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            style={{ flex: '0 0 100%', width: '100%', height: '100%', objectFit: fit, display: 'block' }}
          />
        ))}
      </div>

      {controls && count > 1 && (
        <>
          <button type="button" className="pis-arrow" aria-label="Previous photo" style={arrow('left')}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(index - 1) }}>‹</button>
          <button type="button" className="pis-arrow" aria-label="Next photo" style={arrow('right')}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(index + 1) }}>›</button>
          <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 7, zIndex: 3 }}>
            {images.map((_, i) => (
              <button
                key={i} type="button" aria-label={`Show photo ${i + 1}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(i) }}
                style={{
                  width: i === index ? 22 : 7, height: 7, borderRadius: 4, border: 'none', padding: 0,
                  cursor: 'pointer', background: i === index ? '#C9A96E' : 'rgba(255,255,255,0.75)',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.12)', transition: 'all .35s',
                }}
              />
            ))}
          </div>
          <style>{`.pis-root:hover .pis-arrow{opacity:1!important}@media (hover:none){.pis-arrow{opacity:.85!important}}`}</style>
        </>
      )}
    </div>
  )
}
