import { useEffect, useRef, useState } from 'react'

const A = {
  hero: '/assets/hero.jpg',
  original: '/assets/bottle-original.jpg',
  pink: '/assets/bottle-pink.jpg',
  emblem: '/assets/emblem.png',
  story: '/assets/story.jpg',
  party: '/assets/lifestyle-party.jpg',
  martini: '/assets/cocktail-martini.jpg',
  wolfberry: '/assets/cocktail-wolfberry.jpg',
  pinkwolf: '/assets/cocktail-pinkwolf.jpg',
}

function BottleCanvas({ variant = 'original', hero = false, className = '' }) {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    let active = true
    let dispose = () => {}
    import('./three/BottleScene.js')
      .then(async ({ initBottleScene }) => {
        const cleanup = await initBottleScene(host, { variant, hero })
        if (active) dispose = cleanup
        else cleanup()
      })
      .catch(() => host.classList.add('idga7-3d-unavailable'))
    return () => {
      active = false
      dispose()
    }
  }, [variant, hero])

  return <div ref={hostRef} className={`idga7-scene ${className}`} aria-hidden="true" />
}

function useReveal() {
  useEffect(() => {
    const items = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [])
}

const NAV_LINKS = [
  ['Vodka', '#vodka'],
  ['Lifestyle', '#lifestyle'],
  ['Cocktails', '#cocktails'],
  ['Find Us', '#find-us'],
]

const COCKTAILS = [
  {
    name: 'The Wolfberry',
    image: A.wolfberry,
    tag: 'Signature · Original',
    recipe: '60ml IDGA7 Original · 30ml blackberry liqueur · 15ml lime · Shaken, served cold.',
  },
  {
    name: 'Pink Wolf',
    image: A.pinkwolf,
    tag: 'Signature · Pink Lemonade',
    recipe: '50ml IDGA7 Pink Lemonade · 20ml grapefruit · 10ml elderflower · Built over ice.',
  },
  {
    name: 'Zero Apologies',
    image: A.martini,
    tag: 'The statement',
    recipe: '65ml IDGA7 Original · 10ml dry vermouth · A twist of lemon · Stirred, never shaken.',
  },
]

const STORES = [
  { city: 'Kampala', name: 'The Bottle District', address: '12 Kampala Road' },
  { city: 'Nairobi', name: 'Maison Noir', address: 'Westlands, Nairobi' },
  { city: 'Lagos', name: 'Vault Luxury Wines', address: 'Victoria Island' },
  { city: 'Accra', name: 'The Social House', address: 'Cantonments' },
]

export default function App() {
  useReveal()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const filteredStores = STORES.filter((store) =>
    `${store.city} ${store.name}`.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div className="idga7">
      <header className="nav">
        <a href="#top" className="nav-logo">
          <span className="nav-logo-mark">IDGA7</span>
          <span className="nav-logo-sub">ZERO APOLOGIES</span>
        </a>
        <button className="nav-menu-btn" type="button" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
          <span /><span />
        </button>
        <nav className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
          {NAV_LINKS.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
          <a className="nav-cta" href="#vodka" onClick={() => setMenuOpen(false)}>Explore the vodka</a>
        </nav>
      </header>

      <main>
        {/* CINEMATIC HERO */}
        <section className="hero" id="top">
          <div className="hero-media" style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.35), #050505 92%), url(${A.hero})` }} />
          <div className="hero-smoke" />
          <BottleCanvas variant="original" hero className="hero-scene" />
          <div className="hero-copy">
            <img src={A.emblem} alt="" className="hero-emblem" />
            <p className="hero-eyebrow">Premium vodka · Est. to stand apart</p>
            <h1 className="hero-title">IDGA7</h1>
            <p className="hero-slogan">ZERO APOLOGIES</p>
            <p className="hero-line">Bold by nature. Luxurious by design. Unapologetically yours.</p>
            <a className="hero-button" href="#vodka">Enter the experience</a>
          </div>
          <div className="hero-scroll"><span />Scroll to discover</div>
        </section>

        {/* MANIFESTO */}
        <section className="manifesto reveal" id="story">
          <div className="manifesto-image" style={{ backgroundImage: `url(${A.story})` }} />
          <div className="manifesto-copy">
            <p className="kicker">The manifesto</p>
            <h2>We don&apos;t ask permission<br />to be exceptional.</h2>
            <p className="lede">
              IDGA7 was created for those who walk in with presence and leave an impression.
              Crafted with precision, distilled with character, and dressed in a design language
              that belongs in the world of high fashion — not the liquor aisle.
            </p>
            <p className="small">Chrome. Shadow. Pink. Attitude.</p>
          </div>
        </section>

        {/* COLLECTION — INTERACTIVE 3D BOTTLES */}
        <section className="collection" id="vodka">
          <div className="section-head reveal">
            <p className="kicker">The collection</p>
            <h2>Two expressions.<br /><em>One unmistakable presence.</em></h2>
            <p className="hint">Drag to rotate · Scroll to zoom</p>
          </div>
          <div className="bottle-grid">
            <article className="bottle-card reveal">
              <BottleCanvas variant="original" className="bottle-scene" />
              <div className="bottle-info">
                <p className="bottle-tag">01 · The original</p>
                <h3>IDGA7 Original</h3>
                <p className="bottle-desc">A clean, confident expression. Chrome brightness against absolute black — precision you can taste.</p>
                <div className="bottle-meta"><span>40% ABV</span><span>700ml</span><span>Premium vodka</span></div>
              </div>
            </article>
            <article className="bottle-card is-pink reveal">
              <BottleCanvas variant="pink" className="bottle-scene" />
              <div className="bottle-info">
                <p className="bottle-tag">02 · The statement</p>
                <h3>Pink Lemonade</h3>
                <p className="bottle-desc">Bright, bold and impossible to ignore. A lush pink finish with a sharp citrus edge.</p>
                <div className="bottle-meta"><span>40% ABV</span><span>700ml</span><span>Flavoured vodka</span></div>
              </div>
            </article>
          </div>
        </section>

        {/* LIFESTYLE */}
        <section className="lifestyle" id="lifestyle">
          <div className="section-head reveal">
            <p className="kicker">The world of IDGA7</p>
            <h2>Not just a drink.<br /><em>A point of view.</em></h2>
          </div>
          <div className="lifestyle-grid">
            <figure className="lifestyle-tile tall reveal" style={{ backgroundImage: `url(${A.party})` }}>
              <figcaption><span>01</span>Nightlife, redefined</figcaption>
            </figure>
            <figure className="lifestyle-tile reveal" style={{ backgroundImage: `url(${A.hero})` }}>
              <figcaption><span>02</span>Style without apology</figcaption>
            </figure>
            <figure className="lifestyle-tile reveal" style={{ backgroundImage: `url(${A.story})` }}>
              <figcaption><span>03</span>Made for the memorable</figcaption>
            </figure>
          </div>
        </section>

        {/* COCKTAILS */}
        <section className="cocktails" id="cocktails">
          <div className="section-head reveal">
            <p className="kicker">The ritual</p>
            <h2>Cocktails with character.</h2>
          </div>
          <div className="cocktail-grid">
            {COCKTAILS.map((drink, index) => (
              <article className="cocktail-card reveal" key={drink.name}>
                <div className="cocktail-image" style={{ backgroundImage: `url(${drink.image})` }}>
                  <span className="cocktail-number">0{index + 1}</span>
                </div>
                <div className="cocktail-body">
                  <p className="cocktail-tag">{drink.tag}</p>
                  <h3>{drink.name}</h3>
                  <p>{drink.recipe}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* RETAILER LOCATOR */}
        <section className="find-us" id="find-us">
          <div className="find-inner reveal">
            <div className="find-copy">
              <p className="kicker">Find us</p>
              <h2>Where to find<br /><em>IDGA7.</em></h2>
              <p className="lede">We&apos;re expanding fast. Search a city or retailer to see the latest stockists carrying IDGA7.</p>
              <label className="find-search">
                <span>Search city or retailer</span>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Kampala" />
              </label>
            </div>
            <div className="find-results">
              {filteredStores.length ? filteredStores.map((store) => (
                <div className="store" key={store.name}>
                  <span className="store-city">{store.city}</span>
                  <strong>{store.name}</strong>
                  <span>{store.address}</span>
                </div>
              )) : <p className="store-empty">No stockists found yet — check back soon.</p>}
            </div>
          </div>
        </section>

        {/* FUTURE / SOCIAL */}
        <section className="future reveal">
          <p className="kicker">What&apos;s next</p>
          <h2>The story is only beginning.</h2>
          <div className="future-grid">
            <div className="future-card"><span>Campaigns</span><p>Film, fashion and the faces of Zero Apologies.</p></div>
            <div className="future-card"><span>Events</span><p>Invite-only nights in the cities we call home.</p></div>
            <div className="future-card"><span>Merch</span><p>Objects for those who live the attitude.</p></div>
          </div>
          <div className="social-row">
            <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://tiktok.com" target="_blank" rel="noreferrer">TikTok</a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook</a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-mark">IDGA7</div>
        <p>Zero Apologies.</p>
        <p className="footer-legal">© {new Date().getFullYear()} IDGA7 Vodka. Please drink responsibly.</p>
      </footer>
    </div>
  )
}
