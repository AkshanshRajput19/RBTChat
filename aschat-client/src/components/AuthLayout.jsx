import "./Auth.css";

function AuthLayout({
  mode,
  setShowLogin,
  onReturnHome,
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
      <div className="auth-noise" aria-hidden="true" />
      <div className="auth-glow auth-glow--left" aria-hidden="true" />
      <div className="auth-glow auth-glow--right" aria-hidden="true" />

      <header className="auth-header">
        <div className="auth-brand">
          <div className="auth-brand-mark">
            <span />
            <span />
          </div>
          <div className="auth-brand-copy">
            <strong>RBTChat</strong>
            <span>Secure conversations with launch-screen energy and fast team access.</span>
          </div>
        </div>

        <div className="auth-header-actions">
          <button type="button" className="auth-home-btn" onClick={onReturnHome}>
            Back to home
          </button>

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
        </div>
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
