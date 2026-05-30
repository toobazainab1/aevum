import { Link } from 'react-router-dom'
import styles from '../styles/About.module.css'

const himPerfumes = [
  { name: 'Nox',   desc: 'Woody Oud · 50ml / 18ml' },
  { name: 'Verdis', desc: 'Fresh Aromatic · 50ml / 18ml' },
]

const herPerfumes = [
  { name: 'Roza',   desc: 'Floral Oriental · 50ml / 18ml' },
  { name: 'Velour', desc: 'Amber Floral · 50ml / 18ml' },
]

const story = [
  "AEVUM began not with a business plan, but with a feeling — the feeling of walking into a room and being remembered long after you've left it. Founded by Azka Shahid, AEVUM is a tribute to timelessness in a world obsessed with the immediate.",
  "Every fragrance in the AEVUM collection is built around a single emotion. We don't create scents for trends. We create scents for moments — the moment you step into confidence, into tenderness, into silence.",
  "We source only the finest raw materials. Omani oud. Bulgarian rose absolute. Atlas cedar. Mysore sandalwood. Each ingredient chosen not for economy, but for truth.",
  "AEVUM is two worlds in harmony — a masculine world of dark woods and grounded power, and a feminine world of soft florals and deep warmth. Different roads. One destination: to be unforgettable.",
]

export default function About() {
  return (
    <main className={styles.main}>

      {/* Story Section */}
      <section className={styles.storySection}>
        <p className={styles.eyebrow}>Our Story · Est. 2026</p>
        <h1 className={styles.storyTitle}>
          AEVUM was born from one <em>obsession.</em>
        </h1>
        <div className={styles.goldLine} />
        {story.map((para, i) => (
          <p key={i} className={styles.para}>{para}</p>
        ))}
        <div className={styles.ctaRow}>
          <Link to="/products" className="btn-primary">Discover Collection</Link>
          <Link to="/" className="btn-outline">Back to Home</Link>
        </div>
      </section>

      {/* Divider */}
      <div className={styles.divider}>
        <div className={styles.dividerLine} />
        <span className={styles.dividerText}>Two Worlds · One House</span>
        <div className={styles.dividerLine} />
      </div>

      {/* Split Section */}
      <section className={styles.splitSection}>

        {/* HIM */}
        <div className={styles.himSide}>
          <div className={styles.sideInner}>
            <p className={styles.himEyebrow}>For Him</p>
            <h2 className={styles.sideTitle}>
              Bold.<br /><em>Grounded.</em><br />Unforgettable.
            </h2>
            <p className={styles.sideSub}>
              Crafted for the man who commands without speaking.
              Two fragrances. One unwavering confidence.
            </p>

            {/* Plain cards — no links, no shop button */}
            <div className={styles.perfumeRow}>
              {himPerfumes.map(p => (
                <div key={p.name} className={styles.himCard}>
                  <p className={styles.cardName}>{p.name}</p>
                  <p className={styles.himCardDesc}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* HER */}
        <div className={styles.herSide}>
          <div className={styles.sideInner}>
            <p className={styles.herEyebrow}>For Her</p>
            <h2 className={styles.sideTitle}>
              Delicate.<br /><em>Deep.</em><br />Magnetic.
            </h2>
            <p className={styles.sideSub}>
              For the woman who knows that softness is the most powerful thing.
              Two fragrances. One quiet force.
            </p>

            {/* Plain cards — no links, no shop button */}
            <div className={styles.perfumeRow}>
              {herPerfumes.map(p => (
                <div key={p.name} className={styles.herCard}>
                  <p className={styles.cardName}>{p.name}</p>
                  <p className={styles.herCardDesc}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* Instagram Section */}
      <section className={styles.igSection}>
        <p className={styles.igEyebrow}>Follow the Journey</p>
        <h3 className={styles.igTitle}>Find us on <em>Instagram</em></h3>
        <p className={styles.igSub}>Behind the scenes. New launches. Stories.</p>
        <a
          href="https://www.instagram.com/aevum_byazka"
          target="_blank"
          rel="noreferrer"
          className={styles.igBtn}
        >
          @aevum_byazka
        </a>
        <p className={styles.igNote}>Pinterest and TikTok — coming soon</p>
      </section>

    </main>
  )
}