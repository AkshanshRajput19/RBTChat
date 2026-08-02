import {
  FaWhatsapp,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaXTwitter,
  FaEnvelope,
  FaPhone,
} from "react-icons/fa6";
import { useState } from "react";
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

const featureCards = [
  {
    eyebrow: "Unified inbox",
    title: "Bring support, sales, and community conversations into one command surface.",
    text: "Messages, calls, updates, and AI summaries stay organized so teams can respond faster without looking scattered.",
  },
  {
    eyebrow: "Executive visibility",
    title: "Turn daily conversation volume into clean business signals.",
    text: "Track message momentum, team responsiveness, and customer trends from the same place your work already happens.",
  },
  {
    eyebrow: "Human + AI",
    title: "Use AI to draft replies, surface insights, and reduce repetitive effort.",
    text: "Keep the human voice in front while AI quietly handles summaries, next steps, and pattern detection in the background.",
  },
];

const workflowSteps = [
  {
    label: "01",
    title: "Welcome visitors with a polished first impression",
    text: "Lead with a professional homepage before authentication so the product feels credible from the first click.",
  },
  {
    label: "02",
    title: "Move seamlessly into secure access",
    text: "Guide people from landing to login or registration without breaking the visual rhythm of the experience.",
  },
  {
    label: "03",
    title: "Keep conversations, calls, and insight connected",
    text: "Once inside, the same platform continues as a cohesive workspace instead of feeling like a different app.",
  },
];

const faqItems = [
  {
    question: "Who is RBTChat built for?",
    answer: "Teams that want messaging, live support, stories, and AI help in one more professional customer-facing experience.",
  },
  {
    question: "Can the landing page stay separate from login and registration?",
    answer: "Yes. The homepage now sits before authentication, while login and registration remain focused screens behind the main call to action.",
  },
  {
    question: "Does the new style work on mobile too?",
    answer: "Yes. The layout is responsive, the navigation compresses cleanly, and the main hero stack adapts for smaller screens.",
  },
];

const pricingPlans = {
  monthly: [
    {
      name: "Starter",
      price: 399,
      cadence: "/ month",
      badge: "For lean teams",
      description: "A clean starting point for small teams that need a more polished customer-facing communication layer.",
      features: ["Secure login and registration", "Core messaging workspace", "Professional public landing page"],
    },
    {
      name: "Pro",
      price: 699,
      cadence: "/ month",
      badge: "Most popular",
      featured: true,
      description: "Built for growing teams that want stronger day-to-day collaboration with AI support and a sharper brand experience.",
      features: ["Everything in Starter", "AI-assisted workflow", "Priority product experience"],
    },
    {
      name: "Enterprise",
      price: ENTERPRISE_MONTHLY_PRICE,
      cadence: "/ month",
      badge: "Scale confidently",
      description: "For larger organizations that need a premium arrival experience, broader operations support, and deeper rollout control.",
      features: ["Enterprise onboarding", "Expanded team rollout", "Advanced support coordination"],
    },
  ],
  yearly: [
    {
      name: "Starter",
      price: 4070,
      cadence: "/ year",
      badge: "Annual value",
      description: "A lower-commitment yearly plan for teams that want the same polished public experience at a better annual rate.",
      features: ["Secure login and registration", "Core messaging workspace", "Professional public landing page"],
    },
    {
      name: "Pro",
      price: 8388,
      cadence: "/ year",
      badge: "Best for growth",
      featured: true,
      description: "A focused annual plan for teams using RBTChat as their more serious, always-on communication surface.",
      features: ["Everything in Starter", "AI-assisted workflow", "Priority product experience"],
    },
    {
      name: "Enterprise",
      price: ENTERPRISE_YEARLY_PRICE,
      cadence: "/ year",
      badge: "Enterprise rollout",
      description: "An annual plan for large-scale teams that want a premium first impression, reliable access flow, and stronger operational support.",
      features: ["Enterprise onboarding", "Expanded team rollout", "Advanced support coordination"],
    },
  ],
};

const reviewItems = [
  {
    name: "Aarav Mehta",
    role: "Operations Lead",
    company: "Client support team",
    rating: "4.9 / 5",
    quote: "The new public homepage makes the product feel much more credible before login, and the transition into the workspace now feels polished.",
  },
  {
    name: "Nisha Kapoor",
    role: "Growth Manager",
    company: "Digital services brand",
    rating: "5.0 / 5",
    quote: "It finally feels like one product from top to bottom. Visitors land on something professional, and our team gets a cleaner flow into daily work.",
  },
  {
    name: "Rohan Singh",
    role: "Founder",
    company: "Startup communication stack",
    rating: "4.8 / 5",
    quote: "The darker premium theme gives the platform a more serious look, and the pricing layout is much easier to understand at a glance.",
  },
];

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function PublicLanding({ onLogin, onRegister }) {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] = useState("Starter");

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

  return (
    <div className="public-page">
      <div className="public-noise" aria-hidden="true" />
      <div className="public-glow public-glow--left" aria-hidden="true" />
      <div className="public-glow public-glow--right" aria-hidden="true" />

      <header className="public-nav-shell">
        <div className="public-nav">
          <div className="public-brand">
            <div className="public-brand-mark">
              <img src="/image.png" alt="Company logo" />
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
            <p className="public-eyebrow">Unified messaging platform // launch sequence</p>
            
            <h1>   One Platform
                   Every Conversation
            </h1>
            <p className="public-description">
              RBTChat now opens like a digital launch poster: bolder visuals, stronger motion,
              and a sharper path from public discovery into conversations, calls, stories, and AI support.
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
                <strong>LIVE</strong>
                <span>Public launch screen before auth</span>
              </div>
              <div className="public-proof-card">
                <strong>AI</strong>
                <span>Summaries, prompts, and guided replies</span>
              </div>
              <div className="public-proof-card">
                <strong>SYNC</strong>
                <span>Conversations, stories, and calls in one system</span>
              </div>
            </div>
          </div>
          <div className="public-dashboard">

    <div className="dashboard-header">
        <div className="dashboard-live">
            <span className="live-dot"></span>
            LIVE
        </div>

         <strong>RBTCHAT</strong>
         <div className="dashboard-actions">
       
    </div>
    </div>

    <div className="dashboard-search">
        🔍 Search conversations...
    </div>

    <div className="dashboard-chat">
        <div className="chat-avatar">R</div>

        <div className="chat-content">
            <strong>Rahul Sharma</strong>
            <p>Need Enterprise pricing.</p>
        </div>

        <span className="online"></span>
    </div>

    <div className="dashboard-ai">
        <div className="ai-icon">🤖</div>

        <div>
            <h4>AI Assistant</h4>

            <p>
                Customer is interested in Enterprise.
                Generate proposal?
            </p>

            <div className="ai-progress">
                <div className="ai-progress-fill"></div>
            </div>
        </div>
    </div>

    <div className="dashboard-stats">

        <div>
            <h2>1248</h2>
            <span>Messages</span>
        </div>

        <div>
            <h2>342</h2>
            <span>Users</span>
        </div>

        <div>
            <h2>99.9%</h2>
            <span>Uptime</span>
        </div>

    </div>

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
            <h2>A more credible first impression without losing the speed of your current app.</h2>
          </div>

          <div className="public-feature-grid">
            {featureCards.map((card) => (
              <article key={card.title} className="public-feature-card">
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
            <h2>Designed to feel intentional from first visit to active conversation.</h2>
          </div>

          <div className="public-workflow-list">
            {workflowSteps.map((step) => (
              <article key={step.label} className="public-workflow-card">
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
              <h2>Simple rupee pricing with monthly and yearly billing options.</h2>
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
              <h2>Secure access stays clear and simple once visitors are ready to continue.</h2>
              <p>
                The new public layer improves presentation, while login and registration remain
                direct, focused, and aligned with the same visual system.
              </p>
            </div>

            <div className="public-security-points">
              <div>
                <strong>Focused authentication</strong>
                <span>Login and registration keep their existing logic and now sit behind a stronger front page.</span>
              </div>
              <div>
                <strong>Consistent visual language</strong>
                <span>Dark neutrals, rounded chrome, and quiet motion carry across the entire public flow.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="public-reviews-section" id="reviews">
          <div className="public-section-copy">
            <p className="public-section-eyebrow">Reviews</p>
            <h2>Teams respond better when the product already feels trustworthy before sign-in.</h2>
          </div>

          <div className="public-review-grid">
            {reviewItems.map((review) => (
              <article key={review.name} className="public-review-card">
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
            <h2>Short answers for the public experience.</h2>
          </div>

          <div className="public-faq-grid">
            {faqItems.map((item) => (
              <article key={item.question} className="public-faq-card">
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
        <div className="public-footer-logo-box">
          <img src="/image.png" alt="Company logo" />
        </div>
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
