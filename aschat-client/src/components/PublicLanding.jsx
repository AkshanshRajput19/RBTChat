import {
  FaWhatsapp,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaXTwitter,
  FaEnvelope,
  FaPhone,
} 
from "react-icons/fa6";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useFrontendConfig } from "../frontendConfig";
import "./PublicLanding.css";
import SubscriptionModal from "./SubscriptionModal";

const ENTERPRISE_YEARLY_PRICE = 11988;
const ENTERPRISE_MONTHLY_PRICE = Math.round(ENTERPRISE_YEARLY_PRICE / 12);

const navItems = [
  { label: "Pricing", id: "pricing" },
  { label: "Platform", id: "features" },
  { label: "Workflow", id: "workflow" },
  { label: "Security", id: "security" },
  { label: "Reviews", id: "reviews" },
  { label: "FAQ", id: "faq" },
];

const featureCards = ({ items, description }) =>
  items.map((item, index) => ({
    eyebrow: item,
    title: item,
    text: description,
    key: `feature-${index}`,
  }));

const workflowStepsFromConfig = (steps) =>
  steps.map((step, index) => ({
    label: `${index + 1}`.padStart(2, "0"),
    title: step,
    text: step,
    key: `workflow-${index}`,
  }));

const faqItemsFromConfig = (questions) =>
  questions.map((item, index) => ({
    ...item,
    key: `faq-${index}`,
  }));

const reviewItemsFromConfig = (review) => [
  {
    name: review.name,
    role: review.role,
    company: review.company || "RBTChat user",
    rating: `${review.rating} / 5`,
    quote: review.quote,
    key: "review-0",
  },
];

const pricingPlans = {
  monthly: [
    {
      name: "Try For Free",
      price: 2,
      cadence: "/ week",
      badge: "Autopay trial",
      description: "Free for 1 week with a refundable ₹2 Autopay setup hold.",
      features: ["7-day free trial", "₹2 refundable setup", "Autopay onboarding"],
    },
    {
      name: "Starter",
      price: 399,
      cadence: "/ month",
      badge: "For lean teams",
      description: "Core messaging and basic support tools.",
      features: ["Messaging", "Public landing"],
    },
    {
      name: "Pro",
      price: 699,
      cadence: "/ month",
      badge: "Most popular",
      featured: true,
      description: "AI features and priority support.",
      features: ["AI assists", "Priority support"],
    },
    {
      name: "Enterprise",
      price: ENTERPRISE_MONTHLY_PRICE,
      cadence: "/ month",
      badge: "Scale confidently",
      description: "Advanced controls and rollout support.",
      features: ["Onboarding", "Enterprise support"],
    },
  ],
  yearly: [
    {
      name: "Try For Free",
      price: 2,
      cadence: "/ week",
      badge: "Autopay trial",
      description: "Free for 1 week with a refundable ₹2 Autopay setup hold.",
      features: ["7-day free trial", "₹2 refundable setup", "Autopay onboarding"],
    },
    {
      name: "Starter",
      price: 4070,
      cadence: "/ year",
      badge: "Annual value",
      description: "Core messaging with annual pricing.",
      features: ["Messaging", "Public landing"],
    },
    {
      name: "Pro",
      price: 8388,
      cadence: "/ year",
      badge: "Best for growth",
      featured: true,
      description: "AI and priority support for growing teams.",
      features: ["AI assists", "Priority support"],
    },
    {
      name: "Enterprise",
      price: ENTERPRISE_YEARLY_PRICE,
      cadence: "/ year",
      badge: "Enterprise rollout",
      description: "Full enterprise features and rollout support.",
      features: ["Onboarding", "Enterprise support"],
    },
  ],
};

const reviewItems = [
  {
    name: "Aarav Mehta",
    role: "Operations Lead",
    company: "Client support team",
    rating: "4.9 / 5",
    quote: "The homepage feels credible and professional.",
  },
  {
    name: "Nisha Kapoor",
    role: "Growth Manager",
    company: "Digital services brand",
    rating: "5.0 / 5",
    quote: "Cleaner flow from landing into product.",
  },
  {
    name: "Rohan Singh",
    role: "Founder",
    company: "Startup communication stack",
    rating: "4.8 / 5",
    quote: "Premium look and clearer pricing.",
  },
];

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function PublicLanding({ onLogin, onRegister, theme, onThemeChange }) {
  const { config } = useFrontendConfig();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] = useState("Starter");
  const [showAppearanceMenu, setShowAppearanceMenu] = useState(false);
  const appearanceRef = useRef(null);
  const buttonRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const openSubscriptionModal = (planName) => {
    setSelectedSubscriptionPlan(planName);
    setIsSubscriptionOpen(true);
  };

  useEffect(() => {
    function handleOutsideClick(e) {
      if (!showAppearanceMenu) return;
      // If click is inside the menu or on the button, do nothing
      if (appearanceRef.current && appearanceRef.current.contains(e.target)) return;
      if (buttonRef.current && buttonRef.current.contains(e.target)) return;

      setShowAppearanceMenu(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showAppearanceMenu]);

  // Normalize heading text inside the landing page to title case
  useEffect(() => {
    try {
      const headings = document.querySelectorAll(
        ".public-page h1, .public-page h2, .public-page h3, .public-page h4, .public-page h5, .public-page h6"
      );

      headings.forEach((h) => {
        // Preserve any non-text children by only transforming text nodes
        const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);

        textNodes.forEach((node) => {
          const txt = node.nodeValue || "";
          const transformed = txt
            .toLowerCase()
            .replace(/\b(\p{L})/gu, (m) => m.toUpperCase());
          node.nodeValue = transformed;
        });
      });
    } catch (err) {
      // if anything goes wrong, fail silently to avoid breaking the page
      // console.warn(err);
    }
  }, []);

  return (
    <div className="public-page">
      <div className="public-noise" aria-hidden="true" />
      <div className="public-glow public-glow--left" aria-hidden="true" />
      <div className="public-glow public-glow--right" aria-hidden="true" />

      <header className="public-nav-shell">
        <div className="public-nav">
          <div className="public-brand">
            <div className="public-brand-mark">
              <span />
              <span />
            </div>
          <div className="public-brand-copy">
            <strong>RBTChat</strong>
            <span>Signal-first conversations for teams that want impact on first view.</span>
          </div>
          </div>

          <nav className="public-nav-links" aria-label="Landing page sections">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="public-nav-link"
                onClick={() => scrollToSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="public-nav-actions">
            <div className="appearance-wrapper">
              <button
                ref={buttonRef}
                type="button"
                className="appearance-button"
                onClick={() => {
                  if (showAppearanceMenu) {
                    setShowAppearanceMenu(false);
                    return;
                  }

                  const rect = buttonRef.current && buttonRef.current.getBoundingClientRect();
                  setMenuPosition({
                    top: rect ? rect.bottom + window.scrollY + 8 : 0,
                    left: rect ? rect.left + window.scrollX : 0,
                  });
                  setShowAppearanceMenu(true);
                }}
                aria-expanded={showAppearanceMenu}
                aria-haspopup="menu"
                title="Appearance"
              >
                Appearance
              </button>

              {showAppearanceMenu &&
                createPortal(
                  <div
                    ref={appearanceRef}
                    className="appearance-menu"
                    role="menu"
                    style={{ position: "absolute", top: menuPosition.top, left: menuPosition.left }}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className={`appearance-menu-item ${theme === "light" ? "active" : ""}`}
                      onClick={() => {
                        onThemeChange && onThemeChange("light");
                        setShowAppearanceMenu(false);
                      }}
                    >
                      ☀️ Light
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      className={`appearance-menu-item ${theme === "dark" ? "active" : ""}`}
                      onClick={() => {
                        onThemeChange && onThemeChange("dark");
                        setShowAppearanceMenu(false);
                      }}
                    >
                      🌙 Dark
                    </button>
                  </div>,
                  document.body
                )}
            </div>

            <button type="button" className="public-login-btn" onClick={onLogin}>
              Login
            </button>
            <button type="button" className="public-primary-btn" onClick={onRegister}>
              Get Started
            </button>
          </div>
        </div>
      </header>
                
      <main className="public-main">
        <section className="public-hero">
          <div className="public-copy">
            <p className="public-eyebrow">Unified messaging platform</p>

            <h1>One Platform Every Conversation</h1>
            <p className="public-description">
              A single app for messaging, calls, and AI-assisted replies.
            </p>

           <div className="public-cta-row">
              <button type="button" className="public-primary-btn" onClick={onRegister}>
                Start Free
              </button>
              <button type="button" className="public-secondary-btn" onClick={onLogin}>
                Open Login
              </button>
            </div>

            <div className="public-proof-grid">
              <div className="public-proof-card">
                <strong>10k+</strong>
                <span>Conversations handled monthly</span>
              </div>
              <div className="public-proof-card">
                <strong>98%</strong>
                <span>Customer satisfaction score</span>
              </div>
              <div className="public-proof-card">
                <strong>24/7</strong>
                <span>AI-assisted support coverage</span>
              </div>
            </div>
          </div>
          <div className="public-visual">
            <p className="public-eyebrow">Why teams switch</p>
            <h2 style={{ maxWidth: "30ch", lineHeight: 1.15, margin: "1rem 0" }}>
              "We stopped losing conversations the day we moved to RBTChat."
            </h2>
            <p className="public-description">
              One inbox for every channel, AI drafts that sound like your team,
              and a support workflow that finally keeps up with real customers.
            </p>
          </div>
         
          
          


         
        </section>
        
        <section className="public-status-strip" aria-label="Product focus">
          <div>
            <span>Audience</span>
            <strong>Support, sales, and modern client teams</strong>
          </div>
          <div>
            <span>Experience</span>
            <strong>Purple glitch-event visuals with a sharper launch feel</strong>
          </div>
          <div>
            <span>Flow</span>
            <strong>Homepage first, authentication second, workspace always connected</strong>
          </div>
          
        </section>

        <section className="public-feature-section" id="features">
          <div className="public-section-copy">
            <p className="public-section-eyebrow">Platform</p>
            <h2>{config.platform.headline}</h2>
            <p>{config.platform.description}</p>
          </div>

          <div className="public-feature-grid">
            {featureCards(config.platform).map((card) => (
              <article key={card.key} className="public-feature-card">
                <p>{card.eyebrow}</p>
                <h3>{card.title}</h3>
                <span>{card.text}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="public-workflow-section" id="workflow">
          <div className="public-section-copy">
            <p className="public-section-eyebrow">Workflow</p>
            <h2>{config.workflow.headline}</h2>
          </div>

          <div className="public-workflow-list">
            {workflowStepsFromConfig(config.workflow.steps).map((step) => (
              <article key={step.key} className="public-workflow-card">
                <span>{step.label}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-pricing-section" id="pricing">
          <div className="public-section-copy public-section-copy--with-toggle">
            <div>
              <p className="public-section-eyebrow">Pricing</p>
              <h2>{config.pricing.headline}</h2>
              <p>{config.pricing.description}</p>
            </div>

            <div className="public-pricing-toggle" role="tablist" aria-label="Pricing cadence">
              {["monthly", "yearly"].map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  role="tab"
                  aria-selected={billingCycle === cycle}
                  className={`public-pricing-toggle-btn${billingCycle === cycle ? " is-active" : ""}`}
                  onClick={() => setBillingCycle(cycle)}
                >
                  {cycle === "monthly" ? "Monthly" : "Yearly"}
                </button>
              ))}
            </div>
          </div>

          <div className="public-pricing-grid">
            {pricingPlans[billingCycle].map((plan) => (
              <article
                key={`${billingCycle}-${plan.name}`}
                className={`public-plan-card${plan.featured ? " public-plan-card--featured" : ""}`}
              >
                <div className="public-plan-topline">
                  <span>{plan.badge}</span>
                  <strong>{plan.name}</strong>
                </div>

                <div className="public-plan-price">
                  <h3>{formatPrice(plan.price)}</h3>
                  <p>{plan.cadence}</p>
                </div>

                <p className="public-plan-description">{plan.description}</p>

                <div className="public-plan-features">
                  {plan.features.map((feature) => (
                    <span key={feature}>{feature}</span>
                  ))}
                </div>

                <button
                  type="button"
                  className="public-plan-action"
                  onClick={() => openSubscriptionModal(plan.name)}
                >
                  Choose {plan.name}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="public-security-section" id="security">
          <div className="public-security-panel">
            <div className="public-security-copy">
              <p className="public-section-eyebrow">Security</p>
              <h2>{config.security.headline}</h2>
              <p>{config.security.description || "A clear public homepage that keeps login and registration focused and secure."}</p>
            </div>

            <div className="public-security-points">
              {config.security.bullets.map((bullet, index) => (
                <div key={index}>
                  <strong>{bullet}</strong>
                  <span>&nbsp;</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="public-reviews-section" id="reviews">
          <div className="public-section-copy">
            <p className="public-section-eyebrow">Reviews</p>
            <h2>Teams respond better when the product already feels trustworthy before sign-in</h2>
          </div>

          <div className="public-review-grid">
            {reviewItemsFromConfig(config.review).map((review) => (
              <article key={review.key} className="public-review-card">
                <div className="public-review-rating">{review.rating}</div>
                <p className="public-review-quote">&ldquo;{review.quote}&rdquo;</p>
                <div className="public-review-meta">
                  <strong>{review.name}</strong>
                  <span>{review.role}</span>
                  <span>{review.company}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="public-faq-section" id="faq">
          <div className="public-section-copy">
            <p className="public-section-eyebrow">FAQ</p>
            <h2>Short answers for the public experience</h2>
          </div>

          <div className="public-faq-grid">
            {faqItemsFromConfig(config.faq.questions).map((item) => (
              <article key={item.key} className="public-faq-card">
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer className="public-footer">

  <div className="public-footer-container">

    <div className="public-footer-about">

      <div className="public-footer-logo">
        <div className="public-footer-logo-box">RB</div>
        <div>
          <h2>REALBELL</h2>
          <span>Campaign Platform</span>
        </div>
      </div>

      <p>
        REALBELL Campaign helps businesses automate customer
        engagement, AI conversations, WhatsApp messaging and
        customer support from one powerful platform.
      </p>

      <div className="public-footer-social">
        <a href="#"><FaWhatsapp /></a>
        <a href="#"><FaInstagram /></a>
        <a href="#"><FaXTwitter /></a>
        <a href="#"><FaLinkedin /></a>
        <a href="#"><FaYoutube /></a>
      </div>

    </div>

    <div className="public-footer-links">
      <h3>Product</h3>
      <a href="#">Features</a>
      <a href="#">Pricing</a>
      <a href="#">Campaigns</a>
      <a href="#">Automation</a>
      <a href="#">Analytics</a>
    </div>

    <div className="public-footer-links">
      <h3>Company</h3>
      <a href="#">About</a>
      <a href="#">Blog</a>
      <a href="#">Careers</a>
      <a href="#">Partners</a>
      <a href="#">Contact</a>
    </div>

    <div className="public-footer-links">
      <h3>Support</h3>
      <a href="#">Help Center</a>
      <a href="#">Documentation</a>
      <a href="#">Privacy Policy</a>
      <a href="#">Terms & Conditions</a>
      <a href="#">FAQs</a>
    </div>

    <div className="public-footer-contact">
      <h3>Contact</h3>
      <div className="public-footer-contact-item">
        <FaEnvelope />
        <span>akshansh.singh@realbell.in</span>
      </div>
      <div className="public-footer-contact-item">
        <FaPhone />
        <span>+91 6377425973</span>
      </div>
      <p className="public-footer-desc">
        Empowering businesses with AI-powered messaging,
        automation and customer engagement solutions.
      </p>
    </div>
  </div>

  <div className="public-footer-bottom">
    <p>
      © {new Date().getFullYear()} REALBELL Campaign. All Rights Reserved.
    </p>
    <div className="public-footer-bottom-links">
      <a href="#">Privacy</a>
      <a href="#">Terms</a>
      <a href="#">Cookies</a>
    </div>
  </div>
</footer>
    
   
    
      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
        initialPlanName={selectedSubscriptionPlan}
        initialBillingCycle={billingCycle}
        pricingPlans={pricingPlans}
      />
    </div>
  );
}

export default PublicLanding;
