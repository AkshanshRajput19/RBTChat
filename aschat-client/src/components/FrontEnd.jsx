import { useEffect, useMemo, useState } from "react";
import "./FrontEnd.css";

const SECTION_LABELS = {
  pricing: "Pricing",
  platform: "Platform",
  workflow: "Workflow",
  security: "Security",
  review: "Review",
  faq: "FAQ",
  appearance: "Appearance",
  login: "Login",
};

const DEFAULT_CONFIG = {
  pricing: {
    headline: "Flexible plans for every team",
    description: "Customize pricing, billing cycles, and feature tiers from this editor.",
    price: "$49",
    buttonLabel: "Start Free Trial",
    features: "Unlimited projects, Team analytics, Priority support",
  },
  platform: {
    headline: "Platform-ready experience",
    description: "Showcase the tools and integrations your team needs.",
    items: ["Web dashboard", "Mobile support", "API access"],
  },
  workflow: {
    headline: "Streamlined workflow",
    steps: [
      "Connect your team",
      "Automate approvals",
      "Track activity in real time",
    ],
  },
  security: {
    headline: "Built with enterprise security",
    bullets: [
      "End-to-end encryption",
      "Role-based access control",
      "Continuous monitoring",
    ],
  },
  review: {
    name: "Jessica Lee",
    role: "Product Manager",
    quote: "The frontend editor makes it easy to tailor appearance and content in real time.",
    rating: 5,
  },
  faq: {
    questions: [
      { question: "Can I edit pricing directly?", answer: "Yes, simply update the pricing section fields and the preview will refresh." },
      { question: "Does this affect the actual product?", answer: "This preview simulates frontend customization for design validation." },
      { question: "Can I change the site appearance?", answer: "Yes, use the Appearance tab to change accent and background styling." },
    ],
  },
  appearance: {
    accentColor: "#4f46e5",
    backgroundColor: "#ffffff",
    cardStyle: "Rounded cards",
    buttonStyle: "Solid button",
  },
  login: {
    headline: "Secure team sign in",
    subtext: "Access your workspace with email and password.",
    emailPlaceholder: "Email address",
    passwordPlaceholder: "Password",
    buttonLabel: "Sign in",
  },
};

const STORAGE_KEY = "rbtchatFrontendConfig";

function formatList(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function FrontEnd() {
  const [activeSection, setActiveSection] = useState("pricing");
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch {
      // ignore malformed local storage
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const sectionKeys = useMemo(() => Object.keys(SECTION_LABELS), []);

  const updateSection = (section, updates) => {
    setConfig((current) => ({
      ...current,
      [section]: {
        ...current[section],
        ...updates,
      },
    }));
  };

  const activeConfig = config[activeSection];

  const renderSectionForm = () => {
    switch (activeSection) {
      case "pricing":
        return (
          <>
            <label>
              Headline
              <input
                value={activeConfig.headline}
                onChange={(event) => updateSection("pricing", { headline: event.target.value })}
              />
            </label>
            <label>
              Description
              <textarea
                value={activeConfig.description}
                onChange={(event) => updateSection("pricing", { description: event.target.value })}
              />
            </label>
            <label>
              Price label
              <input
                value={activeConfig.price}
                onChange={(event) => updateSection("pricing", { price: event.target.value })}
              />
            </label>
            <label>
              Button text
              <input
                value={activeConfig.buttonLabel}
                onChange={(event) => updateSection("pricing", { buttonLabel: event.target.value })}
              />
            </label>
            <label>
              Feature list (comma separated)
              <input
                value={activeConfig.features}
                onChange={(event) => updateSection("pricing", { features: event.target.value })}
              />
            </label>
          </>
        );
      case "platform":
        return (
          <>
            <label>
              Headline
              <input
                value={activeConfig.headline}
                onChange={(event) => updateSection("platform", { headline: event.target.value })}
              />
            </label>
            <label>
              Description
              <textarea
                value={activeConfig.description}
                onChange={(event) => updateSection("platform", { description: event.target.value })}
              />
            </label>
            <label>
              Platform items (comma separated)
              <input
                value={activeConfig.items.join(", ")}
                onChange={(event) => updateSection("platform", { items: formatList(event.target.value) })}
              />
            </label>
          </>
        );
      case "workflow":
        return (
          <>
            <label>
              Headline
              <input
                value={activeConfig.headline}
                onChange={(event) => updateSection("workflow", { headline: event.target.value })}
              />
            </label>
            <label>
              Workflow steps (one per line)
              <textarea
                value={activeConfig.steps.join("\n")}
                onChange={(event) => updateSection("workflow", { steps: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })}
              />
            </label>
          </>
        );
      case "security":
        return (
          <>
            <label>
              Headline
              <input
                value={activeConfig.headline}
                onChange={(event) => updateSection("security", { headline: event.target.value })}
              />
            </label>
            {activeConfig.bullets.map((bullet, index) => (
              <label key={index}>
                Security bullet {index + 1}
                <input
                  value={bullet}
                  onChange={(event) => {
                    const nextBullets = [...activeConfig.bullets];
                    nextBullets[index] = event.target.value;
                    updateSection("security", { bullets: nextBullets });
                  }}
                />
              </label>
            ))}
          </>
        );
      case "review":
        return (
          <>
            <label>
              Reviewer name
              <input
                value={activeConfig.name}
                onChange={(event) => updateSection("review", { name: event.target.value })}
              />
            </label>
            <label>
              Role / title
              <input
                value={activeConfig.role}
                onChange={(event) => updateSection("review", { role: event.target.value })}
              />
            </label>
            <label>
              Quote
              <textarea
                value={activeConfig.quote}
                onChange={(event) => updateSection("review", { quote: event.target.value })}
              />
            </label>
            <label>
              Rating (1-5)
              <input
                type="number"
                min="1"
                max="5"
                value={activeConfig.rating}
                onChange={(event) => updateSection("review", { rating: Number(event.target.value) })}
              />
            </label>
          </>
        );
      case "faq":
        return (
          <>
            {activeConfig.questions.map((item, index) => (
              <div className="faq-row" key={index}>
                <label>
                  Question {index + 1}
                  <input
                    value={item.question}
                    onChange={(event) => {
                      const nextQuestions = [...activeConfig.questions];
                      nextQuestions[index] = { ...nextQuestions[index], question: event.target.value };
                      updateSection("faq", { questions: nextQuestions });
                    }}
                  />
                </label>
                <label>
                  Answer {index + 1}
                  <textarea
                    value={item.answer}
                    onChange={(event) => {
                      const nextQuestions = [...activeConfig.questions];
                      nextQuestions[index] = { ...nextQuestions[index], answer: event.target.value };
                      updateSection("faq", { questions: nextQuestions });
                    }}
                  />
                </label>
              </div>
            ))}
          </>
        );
      case "appearance":
        return (
          <>
            <label>
              Accent color
              <input
                type="color"
                value={activeConfig.accentColor}
                onChange={(event) => updateSection("appearance", { accentColor: event.target.value })}
              />
            </label>
            <label>
              Background color
              <input
                type="color"
                value={activeConfig.backgroundColor}
                onChange={(event) => updateSection("appearance", { backgroundColor: event.target.value })}
              />
            </label>
            <label>
              Card style
              <select
                value={activeConfig.cardStyle}
                onChange={(event) => updateSection("appearance", { cardStyle: event.target.value })}
              >
                <option>Rounded cards</option>
                <option>Soft shadows</option>
                <option>Sharp edges</option>
              </select>
            </label>
            <label>
              Button style
              <select
                value={activeConfig.buttonStyle}
                onChange={(event) => updateSection("appearance", { buttonStyle: event.target.value })}
              >
                <option>Solid button</option>
                <option>Outlined button</option>
                <option>Ghost button</option>
              </select>
            </label>
          </>
        );
      case "login":
        return (
          <>
            <label>
              Headline
              <input
                value={activeConfig.headline}
                onChange={(event) => updateSection("login", { headline: event.target.value })}
              />
            </label>
            <label>
              Subtext
              <textarea
                value={activeConfig.subtext}
                onChange={(event) => updateSection("login", { subtext: event.target.value })}
              />
            </label>
            <label>
              Email placeholder
              <input
                value={activeConfig.emailPlaceholder}
                onChange={(event) => updateSection("login", { emailPlaceholder: event.target.value })}
              />
            </label>
            <label>
              Password placeholder
              <input
                value={activeConfig.passwordPlaceholder}
                onChange={(event) => updateSection("login", { passwordPlaceholder: event.target.value })}
              />
            </label>
            <label>
              Button label
              <input
                value={activeConfig.buttonLabel}
                onChange={(event) => updateSection("login", { buttonLabel: event.target.value })}
              />
            </label>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="frontend-editor"
      style={{
        ["--fe-accent"]: config.appearance.accentColor,
        ["--fe-bg"]: config.appearance.backgroundColor,
      }}
    >
      <div className="frontend-header">
        <div>
          <h1>Frontend Customizer</h1>
          <p>Use the sections below to update pricing, platform, workflow, security, reviews, FAQ, appearance, and login content.</p>
        </div>
      </div>

      <div className="frontend-body">
        <aside className="frontend-sidebar">
          <div className="section-tabs">
            {sectionKeys.map((key) => (
              <button
                key={key}
                type="button"
                className={activeSection === key ? "active" : ""}
                onClick={() => setActiveSection(key)}
              >
                {SECTION_LABELS[key]}
              </button>
            ))}
          </div>
        </aside>

        <main className="frontend-controls">
          <div className="section-header">
            <h2>{SECTION_LABELS[activeSection]}</h2>
            <p>Customize the {SECTION_LABELS[activeSection].toLowerCase()} section content and preview the changes live.</p>
          </div>
          <div className="section-form">{renderSectionForm()}</div>
        </main>

        <section className="frontend-preview">
          <div className="preview-card">
            <div className="preview-hero">
              <div>
                <span className="preview-tag">Live preview</span>
                <h2>{config.pricing.headline}</h2>
                <p>{config.pricing.description}</p>
              </div>
              <div className="preview-price-card">
                <strong>{config.pricing.price}</strong>
                <p>{config.pricing.buttonLabel}</p>
              </div>
            </div>

            <div className="preview-block">
              <h3>{config.platform.headline}</h3>
              <p>{config.platform.description}</p>
              <ul>
                {config.platform.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="preview-block preview-split">
              <div>
                <h3>{config.workflow.headline}</h3>
                <ol>
                  {config.workflow.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
              <div>
                <h3>{config.security.headline}</h3>
                <ul>
                  {config.security.bullets.map((bullet, index) => (
                    <li key={index}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="preview-block preview-review">
              <strong>{config.review.rating} / 5</strong>
              <p>“{config.review.quote}”</p>
              <span>{config.review.name}, {config.review.role}</span>
            </div>

            <div className="preview-block preview-faq">
              <h3>FAQ</h3>
              {config.faq.questions.map((item, index) => (
                <div className="faq-item" key={index}>
                  <strong>{item.question}</strong>
                  <p>{item.answer}</p>
                </div>
              ))}
            </div>

            <div className="preview-card preview-login-card">
              <h3>{config.login.headline}</h3>
              <p>{config.login.subtext}</p>
              <div className="login-fields">
                <input value={config.login.emailPlaceholder} disabled />
                <input value={config.login.passwordPlaceholder} disabled />
                <button>{config.login.buttonLabel}</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default FrontEnd;
