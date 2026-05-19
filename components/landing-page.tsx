import Link from "next/link"

// ─── Brand constants ──────────────────────────────────────────────────────────

const C = {
  cream:  "#FAF3EE",
  green:  "#8DB870",
  coral:  "#E8674A",
  peach:  "#F0A896",
  gold:   "#F5C27A",
  dark:   "#1A1A0F",
  page:   "#FFFDF9",
  border: "#E8DDD5",
  muted:  "#7A6E66",
}

// ─── Inline SVG honeycomb tile (used as hero bg pattern) ─────────────────────
// Pointy-top hex grid, very faint gold — data-URI safe
const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='97'%3E%3Cpath d='M28 3 L53 17.5 L53 46.5 L28 61 L3 46.5 L3 17.5Z' fill='none' stroke='%23F5C27A' stroke-width='1' stroke-opacity='0.22'/%3E%3Cpath d='M28 64 L53 78.5 L53 107.5 L28 122 L3 107.5 L3 78.5Z' fill='none' stroke='%23F5C27A' stroke-width='1' stroke-opacity='0.22'/%3E%3C/svg%3E")`

// ─── Wordmark ─────────────────────────────────────────────────────────────────

function Wordmark({ size = "hero" }: { size?: "hero" | "nav" | "footer" }) {
  const sizes: Record<string, string> = {
    hero:   "text-[5rem] leading-none md:text-[7rem]",
    nav:    "text-2xl",
    footer: "text-3xl",
  }
  return (
    <span className={`font-bold tracking-tight ${sizes[size]}`} style={{ fontFamily: "var(--font-display)" }}>
      <span style={{ color: C.green }}>Honey</span>
      <span style={{ color: C.coral }}>Do</span>
    </span>
  )
}

// ─── Tagline badge ────────────────────────────────────────────────────────────

function TaglineBadge({ large = false }: { large?: boolean }) {
  return (
    <span
      className={`inline-block italic border-2 rounded-full ${large ? "text-xl px-8 py-2.5" : "text-sm px-5 py-1.5"}`}
      style={{
        fontFamily: "var(--font-display)",
        borderColor: C.gold,
        color: "#B8862A",
      }}
    >
      make planning sweet
    </span>
  )
}

// ─── Pill button ──────────────────────────────────────────────────────────────

function PillButton({
  href,
  variant,
  children,
  large = false,
}: {
  href: string
  variant: "filled-green" | "filled-coral" | "outline-coral"
  children: React.ReactNode
  large?: boolean
}) {
  const base = `inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-95 ${large ? "px-8 py-3.5 text-base" : "px-6 py-2.5 text-sm"}`
  const styles: Record<string, React.CSSProperties> = {
    "filled-green":   { background: C.green,  color: "#fff", borderRadius: 999, boxShadow: "0 2px 12px rgba(141,184,112,0.35)" },
    "filled-coral":   { background: C.coral,  color: "#fff", borderRadius: 999, boxShadow: "0 2px 12px rgba(232,103,74,0.35)" },
    "outline-coral":  { background: "transparent", color: C.coral, border: `2px solid ${C.coral}`, borderRadius: 999 },
  }
  return (
    <Link href={href} className={base} style={styles[variant]}>
      {children}
    </Link>
  )
}

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({
  emoji,
  title,
  body,
}: {
  emoji: string
  title: string
  body: string
}) {
  return (
    <div
      className="flex flex-col gap-4 p-7 rounded-2xl"
      style={{ background: C.cream, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      {/* Icon circle */}
      <div
        className="flex items-center justify-center w-14 h-14 rounded-2xl text-2xl shrink-0"
        style={{ background: "#FEF0D6" }}
      >
        {emoji}
      </div>
      <div>
        <h3
          className="text-xl font-semibold mb-2"
          style={{ fontFamily: "var(--font-display)", color: C.dark }}
        >
          {title}
        </h3>
        <p className="text-base leading-relaxed" style={{ color: C.muted }}>
          {body}
        </p>
      </div>
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 h-16"
      style={{
        background: "rgba(255,253,249,0.88)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <Link href="/" className="flex items-center gap-2">
        <span className="text-xl" aria-hidden>🐝</span>
        <Wordmark size="nav" />
      </Link>

      <nav className="flex items-center gap-2">
        <Link
          href="/login"
          className="hidden sm:inline-block text-sm font-medium px-4 py-2 rounded-full transition-colors"
          style={{ color: C.muted }}
          onMouseOver={(e) => (e.currentTarget.style.color = C.dark)}
          onMouseOut={(e) => (e.currentTarget.style.color = C.muted)}
        >
          Sign in
        </Link>
        <PillButton href="/register" variant="filled-coral">
          Get started
        </PillButton>
      </nav>
    </header>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      className="relative overflow-hidden flex flex-col items-center justify-center text-center px-6 py-24 md:py-36"
      style={{
        background: C.cream,
        backgroundImage: HEX_PATTERN,
        backgroundSize: "56px 97px",
      }}
    >
      {/* Decorative color blobs */}
      <div className="absolute pointer-events-none inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-30 blur-3xl"
             style={{ background: C.coral }} />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-25 blur-3xl"
             style={{ background: C.green }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl"
             style={{ background: C.gold }} />
      </div>

      {/* Floating bee monogram badge (top right) */}
      <div
        className="absolute top-8 right-8 md:top-12 md:right-14 hidden sm:flex flex-col items-center justify-center w-20 h-20 rounded-2xl text-3xl"
        style={{ background: "rgba(245,194,122,0.18)", border: `1.5px solid ${C.gold}` }}
        aria-hidden
      >
        🌸
        <span className="text-xs font-medium mt-0.5" style={{ color: "#B8862A", fontFamily: "var(--font-display)" }}>HoneyDo</span>
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center gap-6 max-w-3xl">
        {/* Primary wordmark */}
        <div className="flex flex-col items-center gap-3">
          <Wordmark size="hero" />
          <TaglineBadge large />
        </div>

        {/* Value prop */}
        <p
          className="text-lg md:text-xl max-w-xl leading-relaxed"
          style={{ color: C.muted }}
        >
          The wedding planning app your whole family will actually love.
          Checklists, budget, timeline — all in one sweet place.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <PillButton href="/register" variant="filled-green" large>
            Get started — it&apos;s free
          </PillButton>
          <PillButton href="#features" variant="outline-coral" large>
            See how it works
          </PillButton>
        </div>

        {/* Social proof nudge */}
        <p className="text-sm" style={{ color: "#B8A89A" }}>
          Built for couples by real wedding professionals 🐝
        </p>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

function Features() {
  return (
    <section id="features" className="px-6 md:px-10 py-20 md:py-28" style={{ background: C.page }}>
      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        {/* Heading */}
        <div className="text-center flex flex-col items-center gap-3">
          <TaglineBadge />
          <h2
            className="text-4xl md:text-5xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: C.dark }}
          >
            Everything you need,<br />
            <span style={{ color: C.coral }}>nothing you don&apos;t</span>
          </h2>
          <p className="text-base max-w-md" style={{ color: C.muted }}>
            From the first vendor call to the grand send-off — HoneyDo keeps your whole planning team in sync.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard
            emoji="✅"
            title="One list to rule them all"
            body="A beautiful, organized checklist covering every wedding task — from booking the venue 18 months out to packing the emergency kit the night before."
          />
          <FeatureCard
            emoji="💰"
            title="Budget that behaves"
            body="Track estimates vs. actuals, log deposits, set payment reminders. Know exactly where every dollar is going — no spreadsheet required."
          />
          <FeatureCard
            emoji="🕐"
            title="Day-of timeline"
            body="Generate your full day-of schedule from ceremony time. Hair & makeup through the grand send-off, automatically laid out and shareable with vendors."
          />
          <FeatureCard
            emoji="🌸"
            title="Vendor contacts in one place"
            body="Store every vendor's info, booking status, and notes. No more digging through emails to find your florist's phone number at 7 AM."
          />
          <FeatureCard
            emoji="🍯"
            title="Built for your whole team"
            body="Invite your partner, planner, or family members. Everyone sees the same plan, stays on the same page, and nothing falls through the cracks."
          />
          <FeatureCard
            emoji="🐝"
            title="Made by wedding pros"
            body="HoneyDo was built by real wedding venue professionals who've seen what goes wrong. It's designed to make your planning as sweet as the day itself."
          />
        </div>
      </div>
    </section>
  )
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CtaBanner() {
  return (
    <section
      className="relative overflow-hidden px-6 py-20 text-center"
      style={{ background: C.green }}
    >
      {/* Decorative blobs */}
      <div className="absolute pointer-events-none inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full opacity-20 blur-2xl"
             style={{ background: "#fff" }} />
        <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full opacity-15 blur-2xl"
             style={{ background: C.coral }} />
      </div>

      <div className="relative max-w-2xl mx-auto flex flex-col items-center gap-6">
        <div className="text-4xl" aria-hidden>🐝</div>
        <h2
          className="text-4xl md:text-5xl font-bold text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Ready to make planning sweet?
        </h2>
        <p className="text-lg text-white/80">
          Join couples planning the wedding of their dreams — without the stress.
        </p>
        <PillButton href="/register" variant="filled-coral" large>
          Start for free →
        </PillButton>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      className="px-6 md:px-10 py-14"
      style={{ background: C.dark }}
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-10">
        {/* Top row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-2">
            {/* App icon badge */}
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-2xl text-xl font-bold shrink-0"
                style={{
                  background: C.cream,
                  color: C.green,
                  fontFamily: "var(--font-display)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                }}
                aria-hidden
              >
                H
              </div>
              <Wordmark size="footer" />
            </div>
            <p
              className="text-sm italic ml-1"
              style={{ color: "#B8A28A", fontFamily: "var(--font-display)" }}
            >
              make planning sweet
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap gap-x-8 gap-y-2">
            {["About", "Privacy", "Contact"].map((label) => (
              <Link
                key={label}
                href={`/${label.toLowerCase()}`}
                className="text-sm font-medium transition-colors"
                style={{ color: "#B8A28A" }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "#6A6055" }}>
            © 2025 HoneyDo. Built with love for couples everywhere.
          </p>
          <p className="text-xs" style={{ color: "#6A6055" }}>
            Made by{" "}
            <span style={{ color: "#B8A28A" }}>The Hive Venue</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── LandingPage ──────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex-1">
        <Hero />
        <Features />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  )
}
