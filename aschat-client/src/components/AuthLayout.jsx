import "./Auth.css";

function AuthLayout({
  mode,
  setShowLogin,
  eyebrow,
  heroTitle,
  heroText,
  highlights = [],
  cardEyebrow,
  cardTitle,
  cardDescription,
  children,
}) {
  const isLogin = mode === "login";

  return (
    <div className={`auth-page auth-page--${mode}`}>
      <div className="auth-orb auth-orb--left" aria-hidden="true" />
      <div className="auth-orb auth-orb--right" aria-hidden="true" />
      <div className="auth-landscape auth-landscape--far" aria-hidden="true" />
      <div className="auth-landscape auth-landscape--mid" aria-hidden="true" />
      <div className="auth-landscape auth-landscape--front" aria-hidden="true" />

      <header className="auth-header">
        <div className="auth-brand">
          <div className="auth-brand-mark">R</div>
          <div className="auth-brand-copy">
            <strong>RBTChat</strong>
            <span>Secure conversations with stories, calls, and AI support.</span>
          </div>
        </div>

        <nav className="auth-nav" aria-label="Authentication">
          <button
            type="button"
            className={`auth-nav-btn${isLogin ? " auth-nav-btn--active" : ""}`}
            onClick={() => setShowLogin(true)}
            aria-pressed={isLogin}
          >
            Login
          </button>

          <button
            type="button"
            className={`auth-nav-btn${!isLogin ? " auth-nav-btn--active" : ""}`}
            onClick={() => setShowLogin(false)}
            aria-pressed={!isLogin}
          >
            Register
          </button>
        </nav>
      </header>

      <main className="auth-main">
        <section className="auth-copy">
          <p className="auth-eyebrow">{eyebrow}</p>
          <h1>{heroTitle}</h1>
          <p className="auth-description">{heroText}</p>

          <div className="auth-highlights">
            {highlights.map((highlight) => (
              <span key={highlight}>{highlight}</span>
            ))}
          </div>
        </section>

        <section className="auth-panel">
          <article className="auth-card">
            <p className="auth-card-eyebrow">{cardEyebrow}</p>
            <h2>{cardTitle}</h2>
            <p className="auth-card-description">{cardDescription}</p>
            {children}
          </article>
        </section>
      </main>
    </div>
  );
}

export default AuthLayout;
