import { getProductCutout } from '../utils/perfumeImages'

// Real bottle photo with transparent background. Renders an empty spacer (not a fake bottle)
// when there is no cutout yet, so the layout doesn't jump while products load.
export default function PerfumeCutout({ name, height = 300 }) {
  const src = name ? getProductCutout(name) : ''
  if (!src) return <div style={{ height, aspectRatio: '1 / 2' }} aria-hidden="true" />
  return (
    <img
      src={src}
      alt={`${name} eau de parfum`}
      decoding="async"
      draggable={false}
      style={{
        height, width: 'auto', display: 'block',
        filter: 'drop-shadow(0 18px 28px rgba(0,0,0,0.55)) drop-shadow(0 0 22px rgba(201,169,110,0.18))',
      }}
    />
  )
}
