// Maps a product name to its two photos: [hand shot, scene shot].
// The hand shot is always first, so it is what customers see before the slide.
import arumHand from '../assets/perfumes/arum-hand.webp'
import arumScene from '../assets/perfumes/arum-scene.webp'
import gulHand from '../assets/perfumes/gul-hand.webp'
import gulScene from '../assets/perfumes/gul-scene.webp'
import nerineHand from '../assets/perfumes/nerine-hand.webp'
import nerineScene from '../assets/perfumes/nerine-scene.webp'
import maanHand from '../assets/perfumes/maan-hand.webp'
import maanScene from '../assets/perfumes/maan-scene.webp'

import arumCut from '../assets/perfumes/cutouts/arum-cutout.webp'
import gulCut from '../assets/perfumes/cutouts/gul-cutout.webp'
import nerineCut from '../assets/perfumes/cutouts/nerine-cutout.webp'
import maanCut from '../assets/perfumes/cutouts/maan-cutout.webp'

// Transparent-background bottle cutouts (for hero / dark sections)
const CUTOUTS = { arum: arumCut, gul: gulCut, nerine: nerineCut, maan: maanCut }

const IMAGES = {
  arum:   [arumHand, arumScene],
  gul:    [gulHand, gulScene],
  nerine: [nerineHand, nerineScene],
  maan:   [maanHand, maanScene],
}

// The database seed calls the first fragrance "Aurum" but the bottle label says "ARUM".
const ALIASES = { aurum: 'arum' }

const keyFor = (name) => {
  const key = String(name || '').toLowerCase().replace(/[^a-z]/g, '')
  return ALIASES[key] || key
}

export function getProductImages(name) {
  return IMAGES[keyFor(name)] || []
}

export function getProductCutout(name) {
  return CUTOUTS[keyFor(name)] || ''
}
