import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--bg-dark)',
      padding: '80px 60px 40px',
      borderTop: '2px solid var(--border-gold)',
    }}>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr',
        gap: '60px',
        paddingBottom: '60px',
        borderBottom: '1px solid rgba(184,146,74,0.15)',
        marginBottom: '40px',
      }}>

        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 600, letterSpacing: '0.42em', color: 'var(--gold-light)', marginBottom: 4 }}>
            AEVUM
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 400, marginBottom: 22 }}>
            By Azka Shahid · Estd. 2026
          </div>
          <p style={{ fontSize: 14, color: 'rgba(250,247,242,0.45)', fontWeight: 300, lineHeight: 1.95, maxWidth: 260, marginBottom: 28, letterSpacing: '0.02em' }}>
            Timeless fragrances crafted for those who understand that a scent is the last thing they forget.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <a href="https://www.instagram.com/aevum_byazka" target="_blank" rel="noreferrer"
              style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-light)', fontWeight: 400, display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'opacity 0.3s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.65'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Instagram — @aevum_byazka
            </a>
            <span style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(250,247,242,0.25)', fontWeight: 300 }}>
              Pinterest — coming soon
            </span>
            <span style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(250,247,242,0.25)', fontWeight: 300 }}>
              TikTok — coming soon
            </span>
          </div>
        </div>

        {[
          {
            title: 'For Him', color: 'var(--olive-light)',
            links: [
              { label: 'Aurum', to: '/products/1' },
              { label: 'Maan', to: '/products/2' },
              { label: "All Men's", to: '/products?filter=him' },
            ],
          },
          {
            title: 'For Her', color: 'var(--mehron-light)',
            links: [
              { label: 'Nerine', to: '/products/3' },
              { label: 'Gul', to: '/products/4' },
              { label: "All Women's", to: '/products?filter=her' },
            ],
          },
          {
            title: 'Navigate', color: 'var(--gold)',
            links: [
              { label: 'Home', to: '/' },
              { label: 'All Fragrances', to: '/products' },
              { label: 'Our Story', to: '/about' },
              { label: 'My Account', to: '/login' },
            ],
          },
        ].map(col => (
          <div key={col.title}>
            <h5 style={{ fontSize: 10, letterSpacing: '0.38em', textTransform: 'uppercase', color: col.color, fontWeight: 500, marginBottom: 24, fontFamily: 'var(--font-body)' }}>
              {col.title}
            </h5>
            <ul style={{ listStyle: 'none' }}>
              {col.links.map(link => (
                <li key={link.label} style={{ marginBottom: 14 }}>
                  <Link to={link.to}
                    style={{ fontSize: 14, color: 'rgba(250,247,242,0.42)', fontWeight: 300, letterSpacing: '0.04em', transition: 'color 0.3s', display: 'block' }}
                    onMouseEnter={e => e.currentTarget.style.color = col.color}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(250,247,242,0.42)'}
                  >{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <p style={{ fontSize: 12, color: 'rgba(250,247,242,0.2)', fontWeight: 300, letterSpacing: '0.08em' }}>
          2026 AEVUM by Azka Shahid. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, background: 'var(--olive-light)', borderRadius: '50%', display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: 'rgba(250,247,242,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Him</span>
          <span style={{ width: 8, height: 8, background: 'var(--mehron-light)', borderRadius: '50%', display: 'inline-block', marginLeft: 12 }} />
          <span style={{ fontSize: 11, color: 'rgba(250,247,242,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Her</span>
        </div>
      </div>

    </footer>
  )
}