import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import styles from '../styles/Home.module.css'

const API = 'http://localhost:5000/api'

function BottleSVG({ name, color, size = 200 }) {
  return (
    <svg viewBox="0 0 200 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: size }}>
      <path d="M100 48 Q93 24 102 8" stroke="#C9A96E" strokeWidth="0.8" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.1;0.5" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="d" values="M100 48 Q93 24 102 8;M100 48 Q108 22 98 6;M100 48 Q93 24 102 8" dur="3s" repeatCount="indefinite"/>
      </path>
      <path d="M90 52 Q80 28 91 10" stroke="#C9A96E" strokeWidth="0.5" opacity="0.3">
        <animate attributeName="opacity" values="0.3;0.05;0.3" dur="4.5s" repeatCount="indefinite"/>
      </path>
      <path d="M112 50 Q122 26 110 9" stroke="#C9A96E" strokeWidth="0.5" opacity="0.25">
        <animate attributeName="opacity" values="0.25;0.05;0.25" dur="3.8s" repeatCount="indefinite"/>
      </path>
      <rect x="80" y="48" width="40" height="22" fill="#C9A96E" rx="2"/>
      <rect x="84" y="44" width="32" height="8" fill="#E2C98A" rx="1" opacity="0.8"/>
      <rect x="88" y="70" width="24" height="28" fill={color} opacity="0.95"/>
      <rect x="90" y="70" width="4" height="28" fill="rgba(255,255,255,0.06)" rx="2"/>
      <rect x="62" y="98" width="76" height="196" rx="6" fill={color} opacity="0.95"/>
      <rect x="67" y="104" width="7" height="184" rx="3.5" fill="rgba(255,255,255,0.05)"/>
      <rect x="76" y="104" width="3" height="184" rx="1.5" fill="rgba(255,255,255,0.03)"/>
      <rect x="70" y="138" width="60" height="110" fill="rgba(13,27,42,0.65)" rx="2"/>
      <line x1="76" y1="150" x2="124" y2="150" stroke="#C9A96E" strokeWidth="0.5" opacity="0.4"/>
      <text x="100" y="175" textAnchor="middle" fontFamily="'Cormorant Garamond',serif" fontSize="15" fontStyle="italic" fill="#C9A96E" opacity="0.95">{name}</text>
      <line x1="76" y1="183" x2="124" y2="183" stroke="#C9A96E" strokeWidth="0.4" opacity="0.35"/>
      <text x="100" y="198" textAnchor="middle" fontFamily="'Jost',sans-serif" fontSize="5.5" letterSpacing="3" fill="rgba(245,240,230,0.5)">AEVUM</text>
      <text x="100" y="214" textAnchor="middle" fontFamily="'Jost',sans-serif" fontSize="5" letterSpacing="2" fill="rgba(245,240,230,0.3)">EAU DE PARFUM</text>
      <ellipse cx="100" cy="292" rx="36" ry="5" fill="rgba(201,169,110,0.12)"/>
    </svg>
  )
}

// Scroll reveal hook
function useReveal() {
  const ref = useRef()
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.unobserve(el) } },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

export default function Home() {
  const [products, setProducts] = useState([])

  // Section reveal refs
  const marqueeRef    = useReveal()
  const himRef        = useReveal()
  const herRef        = useReveal()
  const collRef       = useReveal()
  const storyRef      = useReveal()


  // Card reveal refs (up to 8 products)
  const cardRefs = Array.from({ length: 8 }, () => useReveal())

  useEffect(() => {
    axios.get(`${API}/products`)
      .then(res => setProducts(res.data))
      .catch(console.error)
  }, [])

  // Split products by gender for Two Worlds section
  const himProducts = products.filter(p => p.filterKey === 'him').slice(0, 2)
  const herProducts = products.filter(p => p.filterKey === 'her').slice(0, 2)

  // Hero bottle names — use first him/her product or fallback
  const heroHimName = himProducts[0]?.name || 'Nox'
  const heroHerName = herProducts[0]?.name || 'Roza'
  const heroHimColor = himProducts[0]?.bottleColor || '#2d4a2d'
  const heroHerColor = herProducts[0]?.bottleColor || '#5a1e2e'

  return (
    <main style={{ background: 'var(--navy)' }}>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>Estd. 2026 · By Azka Shahid</p>
          <h1 className={styles.heroTitle}>
            Wear the<br /><em>Unseen.</em>
          </h1>
          <p className={styles.heroSub}>
            AEVUM is a tribute to timelessness fragrances that don't follow trends, they set them. Two worlds. One vision.
          </p>
          <div className={styles.heroCta}>
            <Link to="/products" className="btn-primary">Discover Collection</Link>
            <Link to="/about" className="btn-outline">Our Story</Link>
          </div>
        </div>
        <div className={styles.heroVisuals}>
          <div className={styles.heroBottleLeft} style={{ animationDelay: '0s' }}>
            <BottleSVG name={heroHimName} color={heroHimColor} size={180} />
            <p className={styles.heroBottleLabel} style={{ color: 'var(--olive-light)' }}>For Him</p>
          </div>
          <div className={styles.heroBottleRight} style={{ animationDelay: '1s' }}>
            <BottleSVG name={heroHerName} color={heroHerColor} size={180} />
            <p className={styles.heroBottleLabel} style={{ color: 'var(--mehron-light)' }}>For Her</p>
          </div>
        </div>
        <div className={styles.heroScroll}>
          <span /><span>Scroll to explore</span>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div ref={marqueeRef} className={`${styles.marqueeWrap} reveal reveal-fade`}>
        <div className={styles.marqueeTrack}>
          {[
            'Rare Oud','Rose Absolute','Vetiver','Saffron','Ambergris',
            'Sandalwood','Bergamot','Jasmine Sambac','Cedarwood','Amber',
            'Rare Oud','Rose Absolute','Vetiver','Saffron','Ambergris',
            'Sandalwood','Bergamot','Jasmine Sambac','Cedarwood','Amber',
          ].map((item, i) => (
            <span key={i} className={styles.marqueeItem}>
              {item} <span className={styles.marqueeDot}>✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── TWO WORLDS ── */}
      <section className={styles.twoWorlds}>

        <div ref={himRef} className={`${styles.worldHim} reveal reveal-left`}>
          <div className={styles.worldBg} style={{ background: 'linear-gradient(135deg, #0d1a0d, #2d4a2d, #1a2d1a)' }} />
          <div className={styles.worldContent}>
            <p className={styles.worldEyebrow} style={{ color: 'var(--olive-light)' }}>For Him</p>
            <h2 className={styles.worldTitle}>The<br /><em>Masculine</em><br />World</h2>
            <p className={styles.worldSub}>Bold. Grounded. Unforgettable. Fragrances built for men who command without speaking.</p>
            <Link to="/products?filter=him" className="btn-outline" style={{ borderColor: 'var(--olive-light)', color: 'var(--olive-light)' }}>
              Explore →
            </Link>
          </div>
          <div className={styles.worldBottles}>
            {himProducts.length > 0 ? himProducts.map((p, i) => (
              <div key={p._id} style={{ animation: `float 6s ease-in-out ${i * 1.2}s infinite` }}>
                <BottleSVG name={p.name} color={p.bottleColor} size={140} />
                <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--olive-light)', letterSpacing: '0.15em', marginTop: 8 }}>
                  {p.name.toUpperCase()}
                </p>
              </div>
            )) : (
              // Fallback while loading
              <>
                <div style={{ animation: 'float 6s ease-in-out infinite' }}>
                  <BottleSVG name="Nox" color="#2d4a2d" size={140} />
                  <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--olive-light)', letterSpacing: '0.15em', marginTop: 8 }}>NOX</p>
                </div>
                <div style={{ animation: 'float 6s ease-in-out 1.2s infinite' }}>
                  <BottleSVG name="Verdis" color="#3a5030" size={140} />
                  <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--olive-light)', letterSpacing: '0.15em', marginTop: 8 }}>VERDIS</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div ref={herRef} className={`${styles.worldHer} reveal reveal-right`}>
          <div className={styles.worldBg} style={{ background: 'linear-gradient(135deg, #1a0a10, #5a1e2e, #2a0d18)' }} />
          <div className={styles.worldContent}>
            <p className={styles.worldEyebrow} style={{ color: 'var(--mehron-light)' }}>For Her</p>
            <h2 className={styles.worldTitle}>The<br /><em>Feminine</em><br />World</h2>
            <p className={styles.worldSub}>Delicate. Deep. Magnetic. Fragrances that linger like a memory you can't quite place.</p>
            <Link to="/products?filter=her" className="btn-outline" style={{ borderColor: 'var(--mehron-light)', color: 'var(--mehron-light)' }}>
              Explore →
            </Link>
          </div>
          <div className={styles.worldBottles}>
            {herProducts.length > 0 ? herProducts.map((p, i) => (
              <div key={p._id} style={{ animation: `float 6s ease-in-out ${i * 1.3 + 0.5}s infinite` }}>
                <BottleSVG name={p.name} color={p.bottleColor} size={140} />
                <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--mehron-light)', letterSpacing: '0.15em', marginTop: 8 }}>
                  {p.name.toUpperCase()}
                </p>
              </div>
            )) : (
              <>
                <div style={{ animation: 'float 6s ease-in-out 0.5s infinite' }}>
                  <BottleSVG name="Roza" color="#5a1e2e" size={140} />
                  <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--mehron-light)', letterSpacing: '0.15em', marginTop: 8 }}>ROZA</p>
                </div>
                <div style={{ animation: 'float 6s ease-in-out 1.8s infinite' }}>
                  <BottleSVG name="Velour" color="#6b2030" size={140} />
                  <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--mehron-light)', letterSpacing: '0.15em', marginTop: 8 }}>VELOUR</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── COLLECTION ── */}
      <section className={styles.collection}>
        <div ref={collRef} className={`${styles.collectionHeader} reveal reveal-up`}>
          <p className={styles.eyebrow}>The Collection</p>
          <h2 className={styles.sectionTitle}>
            {products.length > 0
              ? `${products.length} Fragrance${products.length !== 1 ? 's' : ''}. One Legacy.`
              : 'Our Fragrances.'}
          </h2>
          <p className={styles.sectionSub}>Each bottle is a chapter. Each scent, a world.</p>
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-display)', fontSize: 22 }}>
            Loading fragrances...
          </div>
        ) : (
          <div className={styles.collectionGrid}>
            {products.map((p, i) => (
              <div
                key={p._id}
                ref={cardRefs[i]}
                className={`${styles.collCard} reveal reveal-up`}
                style={{ background: p.bg, transitionDelay: `${(i % 4) * 0.1}s` }}
              >
                <div className={styles.collBottle} style={{ animation: 'float 6s ease-in-out infinite' }}>
                  <BottleSVG name={p.name} color={p.bottleColor} size={160} />
                </div>
                {p.badge && (
                  <span className={styles.collBadge} style={{
                    background: p.filterKey === 'him' ? 'var(--olive)' : 'var(--mehron)',
                    color: '#FFFFFF',
                  }}>
                    {p.badge}
                  </span>
                )}
                <div className={styles.collInfo}>
                  <p className={styles.collGender} style={{ color: p.filterKey === 'him' ? 'var(--olive-light)' : 'var(--mehron-light)' }}>
                    {p.gender} · {p.category}
                  </p>
                  <h3 className={styles.collName}>{p.name}</h3>
                  <p className={styles.collTagline}>{p.tagline}</p>
                  <p className={styles.collNotes}>{p.notes?.join(' · ')}</p>
                  <div className={styles.collFooter}>
                    <span className={styles.collPrice}>PKR {p.price?.toLocaleString()}</span>
                    <Link
                      to={`/products/${p._id}`}
                      className={styles.collLink}
                      style={{ color: p.filterKey === 'him' ? 'var(--olive-light)' : 'var(--mehron-light)' }}
                    >
                      View →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── STORY STRIP ── */}
      <section className={styles.storyStrip}>
        <div ref={storyRef} className={`${styles.storyLeft} reveal reveal-left`}>
          <p className={styles.eyebrow}>Our Philosophy</p>
          <h2 className={styles.storyTitle}>"A scent is the<br /><em>last thing</em> they forget."</h2>
          <div className={styles.goldLine} />
          <p className={styles.storyBody}>
            AEVUM was born from a single belief — that fragrance is the most intimate form of self-expression. Founded by Azka Shahid, every bottle is a deliberate act of artistry, using rare ingredients sourced with intention and care.
          </p>
          <Link to="/about" className="btn-primary">Read Our Story</Link>
        </div>
        <div className={styles.storyRight}>
          <div className={styles.storyOrb} />
          <div className={styles.storyRing1} />
          <div className={styles.storyRing2} />
          <div className={styles.storyText}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 80, fontWeight: 300, color: 'rgba(201,169,110,0.08)', lineHeight: 1, userSelect: 'none' }}>AEVUM</p>
          </div>
        </div>
      </section>



    </main>
  )
}