const STORAGE_PREFIX = "rbtchatSubscriptionManagement";
export const SUBSCRIPTION_MANAGEMENT_UPDATED_EVENT =
  "rbtchat:subscription-management-updated";

const DEFAULT_TENANT_ID = "default";
const DEFAULT_DNS_TARGET = "connect.rbtchat.app";
const DEFAULT_VERIFICATION_TOKEN = "rbtchat-verify-2026";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const createId = (prefix) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const addBillingCycle = (dateString, billingCycle) => {
  const nextDate = new Date(dateString);
  nextDate.setMonth(nextDate.getMonth() + (billingCycle === "yearly" ? 12 : 1));
  return nextDate.toISOString();
};

const createInvoiceNumber = () =>
  `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

const createSeedState = () => {
  const now = new Date("2026-07-28T09:00:00.000Z");
  const iso = (daysOffset) => {
    const date = new Date(now);
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString();
  };

  return {
    subscriptions: [
      {
        id: "sub_seed_1",
        customerName: "Aarav Mehta",
        businessName: "Northwind Sales",
        customerEmail: "aarav@northwind.in",
        mobileNumber: "9876543210",
        planName: "Pro",
        billingCycle: "monthly",
        amount: 699,
        status: "active",
        source: "website",
        startDate: iso(-34),
        renewalDate: iso(-4),
        seats: 8,
      },
      {
        id: "sub_seed_2",
        customerName: "Nisha Kapoor",
        businessName: "Zenloop Media",
        customerEmail: "nisha@zenloop.in",
        mobileNumber: "9123456780",
        planName: "Enterprise",
        billingCycle: "yearly",
        amount: 11988,
        status: "trial",
        source: "partner",
        startDate: iso(-12),
        renewalDate: iso(353),
        seats: 24,
      },
      {
        id: "sub_seed_3",
        customerName: "Rohan Singh",
        businessName: "Cityline Logistics",
        customerEmail: "rohan@cityline.in",
        mobileNumber: "9988776655",
        planName: "Starter",
        billingCycle: "monthly",
        amount: 399,
        status: "past_due",
        source: "sales-team",
        startDate: iso(-62),
        renewalDate: iso(-2),
        seats: 4,
      },
    ],
    requests: [
      {
        id: "req_seed_1",
        fullName: "Priya Verma",
        businessName: "Orchid Studio",
        businessType: "Agency",
        businessAddress: "Jaipur, Rajasthan",
        businessEmail: "priya@orchidstudio.in",
        mobileNumber: "9012345678",
        panCardNumber: "ABCDE1234F",
        planName: "Pro",
        billingCycle: "monthly",
        amount: 699,
        status: "pending",
        source: "website",
        submittedAt: iso(-1),
        paymentReference: "pay_seed_1",
      },
      {
        id: "req_seed_2",
        fullName: "Vikram Das",
        businessName: "BluePeak Health",
        businessType: "Healthcare",
        businessAddress: "Pune, Maharashtra",
        businessEmail: "vikram@bluepeak.in",
        mobileNumber: "9090909090",
        panCardNumber: "PQRSX6789Z",
        planName: "Enterprise",
        billingCycle: "yearly",
        amount: 11988,
        status: "pending",
        source: "website",
        submittedAt: iso(-3),
        paymentReference: "pay_seed_2",
      },
      {
        id: "req_seed_3",
        fullName: "Karan Shah",
        businessName: "GrowCart",
        businessType: "E-commerce",
        businessAddress: "Ahmedabad, Gujarat",
        businessEmail: "karan@growcart.in",
        mobileNumber: "9345678910",
        panCardNumber: "LMNOP4321Q",
        planName: "Starter",
        billingCycle: "monthly",
        amount: 399,
        status: "approved",
        source: "referral",
        submittedAt: iso(-9),
        paymentReference: "pay_seed_3",
      },
    ],
    plans: [
      {
        id: "plan_seed_1",
        name: "Starter",
        billingCycle: "monthly",
        price: 399,
        description: "Ideal for lean teams getting started with customer messaging.",
        features: [
          "Shared inbox",
          "Core chat workspace",
          "Basic onboarding support",
        ],
        status: "active",
        subscribers: 18,
        createdAt: iso(-160),
      },
      {
        id: "plan_seed_2",
        name: "Pro",
        billingCycle: "monthly",
        price: 699,
        description: "For growing teams that want automation and sharper operations.",
        features: [
          "Everything in Starter",
          "AI workflow support",
          "Priority onboarding",
        ],
        status: "active",
        subscribers: 42,
        createdAt: iso(-130),
      },
      {
        id: "plan_seed_3",
        name: "Enterprise",
        billingCycle: "yearly",
        price: 11988,
        description: "Annual plan with rollout help, deeper support, and scale controls.",
        features: [
          "Enterprise onboarding",
          "PWA rollout assistance",
          "Custom domain support",
        ],
        status: "active",
        subscribers: 9,
        createdAt: iso(-96),
      },
      {
        id: "plan_seed_4",
        name: "Campaign Plus",
        billingCycle: "monthly",
        price: 999,
        description: "High-touch plan for teams running campaigns with faster approvals.",
        features: ["Priority queue", "Faster verification", "Analytics snapshot export"],
        status: "archived",
        subscribers: 3,
        createdAt: iso(-74),
      },
    ],
    paymentHistory: [
      {
        id: "payment_seed_1",
        customerName: "Aarav Mehta",
        customerEmail: "aarav@northwind.in",
        planName: "Pro",
        billingCycle: "monthly",
        amount: 699,
        status: "captured",
        method: "Razorpay",
        paidAt: iso(-4),
        reference: "pay_seed_1",
        invoiceNumber: "INV-20260724-4102",
      },
      {
        id: "payment_seed_2",
        customerName: "Nisha Kapoor",
        customerEmail: "nisha@zenloop.in",
        planName: "Enterprise",
        billingCycle: "yearly",
        amount: 11988,
        status: "captured",
        method: "Razorpay",
        paidAt: iso(-7),
        reference: "pay_seed_2",
        invoiceNumber: "INV-20260721-5827",
      },
      {
        id: "payment_seed_3",
        customerName: "Rohan Singh",
        customerEmail: "rohan@cityline.in",
        planName: "Starter",
        billingCycle: "monthly",
        amount: 399,
        status: "failed",
        method: "Razorpay",
        paidAt: iso(-2),
        reference: "pay_seed_3",
        invoiceNumber: "INV-20260726-9314",
      },
    ],
    pwaSettings: {
      appName: "RBTChat Workspace",
      shortName: "RBTChat",
      startUrl: "/dashboard",
      display: "standalone",
      themeColor: "#151a22",
      backgroundColor: "#f4efe7",
      offlineMode: true,
      pushNotifications: true,
      installPrompt: true,
      updatedAt: iso(-5),
    },
    customDomain: {
      hostname: "app.realbell.in",
      provider: "Cloudflare",
      dnsTarget: DEFAULT_DNS_TARGET,
      verificationToken: DEFAULT_VERIFICATION_TOKEN,
      status: "connected",
      lastChecked: iso(-1),
      updatedAt: iso(-7),
    },
  };
};

const getStorageKey = (tenantId = DEFAULT_TENANT_ID) =>
  `${STORAGE_PREFIX}:${tenantId || DEFAULT_TENANT_ID}`;

const parseSession = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem("rbtchatSession"));
  } catch {
    return null;
  }
};

export const getActiveTenantId = () => {
  const session = parseSession();
  return session?.user?.tenantId || DEFAULT_TENANT_ID;
};

const emitStoreUpdate = (tenantId) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(SUBSCRIPTION_MANAGEMENT_UPDATED_EVENT, {
      detail: { tenantId },
    })
  );
};

const normalizeState = (state) => {
  const seedState = createSeedState();

  return {
    subscriptions: Array.isArray(state?.subscriptions)
      ? state.subscriptions
      : seedState.subscriptions,
    requests: Array.isArray(state?.requests) ? state.requests : seedState.requests,
    plans: Array.isArray(state?.plans) ? state.plans : seedState.plans,
    paymentHistory: Array.isArray(state?.paymentHistory)
      ? state.paymentHistory
      : seedState.paymentHistory,
    pwaSettings: {
      ...seedState.pwaSettings,
      ...(state?.pwaSettings || {}),
    },
    customDomain: {
      ...seedState.customDomain,
      ...(state?.customDomain || {}),
    },
  };
};

export const formatSubscriptionCurrency = (value) =>
  currencyFormatter.format(Number(value) || 0);

export const formatSubscriptionDate = (value) => {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return dateFormatter.format(date);
};

export const getSubscriptionManagementState = (
  tenantId = DEFAULT_TENANT_ID
) => {
  if (typeof window === "undefined") {
    return createSeedState();
  }

  const storageKey = getStorageKey(tenantId);
  const savedState = window.localStorage.getItem(storageKey);

  if (!savedState) {
    const seedState = createSeedState();
    window.localStorage.setItem(storageKey, JSON.stringify(seedState));
    return seedState;
  }

  try {
    return normalizeState(JSON.parse(savedState));
  } catch {
    const seedState = createSeedState();
    window.localStorage.setItem(storageKey, JSON.stringify(seedState));
    return seedState;
  }
};

export const saveSubscriptionManagementState = (
  tenantId = DEFAULT_TENANT_ID,
  state
) => {
  const normalizedState = normalizeState(state);

  if (typeof window === "undefined") {
    return normalizedState;
  }

  window.localStorage.setItem(
    getStorageKey(tenantId),
    JSON.stringify(normalizedState)
  );
  emitStoreUpdate(tenantId);
  return normalizedState;
};

const updateState = (tenantId, updater) => {
  const currentState = getSubscriptionManagementState(tenantId);
  const nextState = updater(currentState);
  return saveSubscriptionManagementState(tenantId, nextState);
};

const getPlanAmount = (state, planName, billingCycle, fallbackAmount) => {
  const matchingPlan = state.plans.find(
    (plan) =>
      plan.name.toLowerCase() === String(planName).toLowerCase() &&
      plan.billingCycle === billingCycle
  );

  return matchingPlan?.price || Number(fallbackAmount) || 0;
};

const createSubscriptionFromRequest = (request) => ({
  id: createId("sub"),
  customerName: request.fullName,
  businessName: request.businessName,
  customerEmail: request.businessEmail,
  mobileNumber: request.mobileNumber,
  planName: request.planName,
  billingCycle: request.billingCycle,
  amount: request.amount,
  status: "active",
  source: request.source,
  startDate: new Date().toISOString(),
  renewalDate: addBillingCycle(new Date().toISOString(), request.billingCycle),
  seats: request.planName === "Enterprise" ? 20 : request.planName === "Pro" ? 8 : 3,
});

export const approveSubscriptionRequest = (
  requestId,
  tenantId = getActiveTenantId()
) =>
  updateState(tenantId, (state) => {
    const request = state.requests.find((item) => item.id === requestId);

    if (!request) {
      return state;
    }

    const subscriptions = state.subscriptions.some(
      (subscription) =>
        subscription.customerEmail === request.businessEmail &&
        subscription.planName === request.planName &&
        subscription.billingCycle === request.billingCycle
    )
      ? state.subscriptions.map((subscription) =>
          subscription.customerEmail === request.businessEmail
            ? {
                ...subscription,
                planName: request.planName,
                billingCycle: request.billingCycle,
                amount: request.amount,
                status: "active",
                renewalDate: addBillingCycle(
                  new Date().toISOString(),
                  request.billingCycle
                ),
              }
            : subscription
        )
      : [createSubscriptionFromRequest(request), ...state.subscriptions];

    return {
      ...state,
      subscriptions,
      requests: state.requests.map((item) =>
        item.id === requestId ? { ...item, status: "approved" } : item
      ),
    };
  });

export const rejectSubscriptionRequest = (
  requestId,
  tenantId = getActiveTenantId()
) =>
  updateState(tenantId, (state) => ({
    ...state,
    requests: state.requests.map((item) =>
      item.id === requestId ? { ...item, status: "rejected" } : item
    ),
  }));

export const toggleSubscriptionStatus = (
  subscriptionId,
  tenantId = getActiveTenantId()
) =>
  updateState(tenantId, (state) => ({
    ...state,
    subscriptions: state.subscriptions.map((subscription) => {
      if (subscription.id !== subscriptionId) {
        return subscription;
      }

      const nextStatus =
        subscription.status === "active" || subscription.status === "trial"
          ? "suspended"
          : "active";

      return {
        ...subscription,
        status: nextStatus,
      };
    }),
  }));

export const savePlan = (planDraft, tenantId = getActiveTenantId()) =>
  updateState(tenantId, (state) => {
    const normalizedPlan = {
      id: planDraft.id || createId("plan"),
      name: String(planDraft.name || "").trim(),
      billingCycle: planDraft.billingCycle || "monthly",
      price: Number(planDraft.price) || 0,
      description: String(planDraft.description || "").trim(),
      features: Array.isArray(planDraft.features)
        ? planDraft.features
        : String(planDraft.features || "")
            .split(",")
            .map((feature) => feature.trim())
            .filter(Boolean),
      status: planDraft.status || "active",
      subscribers: Number(planDraft.subscribers) || 0,
      createdAt: planDraft.createdAt || new Date().toISOString(),
    };

    const alreadyExists = state.plans.some((plan) => plan.id === normalizedPlan.id);

    return {
      ...state,
      plans: alreadyExists
        ? state.plans.map((plan) =>
            plan.id === normalizedPlan.id ? normalizedPlan : plan
          )
        : [normalizedPlan, ...state.plans],
    };
  });

export const togglePlanStatus = (
  planId,
  tenantId = getActiveTenantId()
) =>
  updateState(tenantId, (state) => ({
    ...state,
    plans: state.plans.map((plan) =>
      plan.id === planId
        ? {
            ...plan,
            status: plan.status === "active" ? "archived" : "active",
          }
        : plan
    ),
  }));

export const savePwaSettings = (
  settingsDraft,
  tenantId = getActiveTenantId()
) =>
  updateState(tenantId, (state) => ({
    ...state,
    pwaSettings: {
      ...state.pwaSettings,
      ...settingsDraft,
      updatedAt: new Date().toISOString(),
    },
  }));

export const saveCustomDomainSettings = (
  settingsDraft,
  tenantId = getActiveTenantId()
) =>
  updateState(tenantId, (state) => ({
    ...state,
    customDomain: {
      ...state.customDomain,
      ...settingsDraft,
      dnsTarget: settingsDraft.dnsTarget || state.customDomain.dnsTarget || DEFAULT_DNS_TARGET,
      verificationToken:
        settingsDraft.verificationToken ||
        state.customDomain.verificationToken ||
        DEFAULT_VERIFICATION_TOKEN,
      updatedAt: new Date().toISOString(),
    },
  }));

export const verifyCustomDomain = (tenantId = getActiveTenantId()) =>
  updateState(tenantId, (state) => {
    const hasHostname = Boolean(String(state.customDomain.hostname || "").trim());

    return {
      ...state,
      customDomain: {
        ...state.customDomain,
        status: hasHostname ? "connected" : "pending",
        lastChecked: new Date().toISOString(),
      },
    };
  });

export const recordPublicSubscriptionRequest = (
  details,
  tenantId = getActiveTenantId()
) =>
  updateState(tenantId, (state) => {
    const amount = getPlanAmount(
      state,
      details.planName,
      details.billingCycle,
      details.amount
    );
    const submittedAt = new Date().toISOString();
    const requestId = createId("req");
    const paymentReference =
      details.paymentId || details.orderId || details.paymentReference || createId("pay");

    return {
      ...state,
      requests: [
        {
          id: requestId,
          fullName: details.fullName,
          businessName: details.businessName,
          businessType: details.businessType,
          businessAddress: details.businessAddress,
          businessEmail: details.businessEmail,
          mobileNumber: details.mobileNumber,
          panCardNumber: details.panCardNumber,
          planName: details.planName,
          billingCycle: details.billingCycle,
          amount,
          status: "pending",
          source: "website",
          submittedAt,
          paymentReference,
        },
        ...state.requests,
      ],
      paymentHistory: [
        {
          id: createId("payment"),
          customerName: details.fullName,
          customerEmail: details.businessEmail,
          planName: details.planName,
          billingCycle: details.billingCycle,
          amount,
          status: "captured",
          method: "Razorpay",
          paidAt: submittedAt,
          reference: paymentReference,
          invoiceNumber: createInvoiceNumber(),
        },
        ...state.paymentHistory,
      ],
    };
  });

export const recordWorkspacePlanPayment = (
  details,
  tenantId = getActiveTenantId()
) =>
  updateState(tenantId, (state) => {
    const paidAt = new Date().toISOString();
    const amount = Number(details.amount) || 0;
    const customerEmail = details.customerEmail || "workspace@rbtchat.local";
    const matchingSubscription = state.subscriptions.find(
      (subscription) => subscription.customerEmail === customerEmail
    );

    const nextSubscription = matchingSubscription
      ? {
          ...matchingSubscription,
          customerName: details.customerName || matchingSubscription.customerName,
          businessName: details.businessName || matchingSubscription.businessName,
          planName: details.planName,
          billingCycle: details.billingCycle || "monthly",
          amount,
          status: amount > 0 ? "active" : "trial",
          startDate: paidAt,
          renewalDate: addBillingCycle(
            paidAt,
            details.billingCycle || "monthly"
          ),
        }
      : {
          id: createId("sub"),
          customerName: details.customerName || "Workspace Owner",
          businessName: details.businessName || "RBTChat Workspace",
          customerEmail,
          mobileNumber: details.mobileNumber || "",
          planName: details.planName,
          billingCycle: details.billingCycle || "monthly",
          amount,
          status: amount > 0 ? "active" : "trial",
          source: "dashboard",
          startDate: paidAt,
          renewalDate: addBillingCycle(
            paidAt,
            details.billingCycle || "monthly"
          ),
          seats: details.planName === "Enterprise" ? 50 : details.planName === "Premium" ? 15 : 5,
        };

    return {
      ...state,
      subscriptions: matchingSubscription
        ? state.subscriptions.map((subscription) =>
            subscription.customerEmail === customerEmail
              ? nextSubscription
              : subscription
          )
        : [nextSubscription, ...state.subscriptions],
      paymentHistory:
        amount > 0
          ? [
              {
                id: createId("payment"),
                customerName: details.customerName || "Workspace Owner",
                customerEmail,
                planName: details.planName,
                billingCycle: details.billingCycle || "monthly",
                amount,
                status: "captured",
                method: "Razorpay",
                paidAt,
                reference:
                  details.paymentId || details.orderId || createId("payref"),
                invoiceNumber: createInvoiceNumber(),
              },
              ...state.paymentHistory,
            ]
          : state.paymentHistory,
    };
  });
