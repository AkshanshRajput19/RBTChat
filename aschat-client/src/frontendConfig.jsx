import React, { createContext, useContext, useEffect, useState } from "react";

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
    steps: ["Connect your team", "Automate approvals", "Track activity in real time"],
  },
  security: {
    headline: "Built with enterprise security",
    bullets: ["End-to-end encryption", "Role-based access control", "Continuous monitoring"],
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
  footer: {
    brandName: "REALBELL Campaign",
    brandShort: "RB",
    tagline: "Campaign Platform",
    description: "REALBELL Business Campaign AI Platform empowers businesses to automate customer engagement and scale seamlessly.",
    email: "realbelltechnologies@gmail.com",
    phone: "+91 63774 25973",
    productLinks: ["Features", "Pricing", "API Docs", "Changelog"],
    companyLinks: ["About Us", "Blog", "Careers", "Contact"],
    supportLinks: ["Help Center", "Tutorials", "Community"],
    bottomText: "© 2026–2030 REALBELL TECHNOLOGIES. All Rights Reserved.",
  },
};

const STORAGE_KEY = "rbtchatFrontendConfig";

const FrontendConfigContext = createContext(null);

export function FrontendConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setConfig((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      // ignore
    }
  }, [config]);

  return (
    <FrontendConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </FrontendConfigContext.Provider>
  );
}

export function useFrontendConfig() {
  const ctx = useContext(FrontendConfigContext);
  if (!ctx) {
    throw new Error("useFrontendConfig must be used within FrontendConfigProvider");
  }
  return ctx;
}

export { DEFAULT_CONFIG };
