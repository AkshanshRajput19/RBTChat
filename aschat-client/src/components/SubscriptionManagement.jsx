import { useEffect, useMemo, useState } from "react";
import "./SubscriptionManagement.css";
import {
  SUBSCRIPTION_MANAGEMENT_UPDATED_EVENT,
  approveSubscriptionRequest,
  formatSubscriptionCurrency,
  formatSubscriptionDate,
  getSubscriptionManagementState,
  rejectSubscriptionRequest,
  saveCustomDomainSettings,
  savePlan,
  savePwaSettings,
  togglePlanStatus,
  toggleSubscriptionStatus,
  verifyCustomDomain,
} from "./subscriptionManagementStore";

const PLAN_FORM_DEFAULTS = {
  id: "",
  name: "",
  billingCycle: "monthly",
  price: "",
  description: "",
  features: "",
  status: "active",
};

const statusClassNames = {
  active: "is-active",
  approved: "is-approved",
  archived: "is-archived",
  captured: "is-approved",
  connected: "is-active",
  failed: "is-danger",
  past_due: "is-warning",
  pending: "is-warning",
  rejected: "is-danger",
  suspended: "is-muted",
  trial: "is-info",
};

const statusLabels = {
  active: "Active",
  approved: "Approved",
  archived: "Archived",
  captured: "Captured",
  connected: "Connected",
  failed: "Failed",
  past_due: "Past due",
  pending: "Pending",
  rejected: "Rejected",
  suspended: "Suspended",
  trial: "Trial",
};

const createPlanFormState = (plan) =>
  plan
    ? {
        id: plan.id,
        name: plan.name,
        billingCycle: plan.billingCycle,
        price: String(plan.price),
        description: plan.description,
        features: plan.features.join(", "),
        status: plan.status,
      }
    : { ...PLAN_FORM_DEFAULTS };

const csvEscape = (value) => {
  const safeValue = String(value ?? "");
  return `"${safeValue.replace(/"/g, "\"\"")}"`;
};

const countRevenuePerMonth = (subscriptions) =>
  subscriptions
    .filter((subscription) =>
      ["active", "trial", "past_due"].includes(subscription.status)
    )
    .reduce((total, subscription) => {
      if (subscription.billingCycle === "yearly") {
        return total + subscription.amount / 12;
      }
      return total + subscription.amount;
    }, 0);

function SubscriptionManagement({ currentUser, activePage, onNavigate }) {
  const tenantId = currentUser?.tenantId || "default";
  const [managementState, setManagementState] = useState(() =>
    getSubscriptionManagementState(tenantId)
  );
  const [subscriptionSearch, setSubscriptionSearch] = useState("");
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState("all");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [planForm, setPlanForm] = useState(() => createPlanFormState());
  const [pwaForm, setPwaForm] = useState(() => managementState.pwaSettings);
  const [domainForm, setDomainForm] = useState(() => managementState.customDomain);
  const [notice, setNotice] = useState(null);

  const syncManagementState = (nextState) => {
    setManagementState(nextState);
    setPwaForm(nextState.pwaSettings);
    setDomainForm(nextState.customDomain);
  };

  useEffect(() => {
    const nextState = getSubscriptionManagementState(tenantId);
    syncManagementState(nextState);
    setPlanForm(createPlanFormState());
  }, [tenantId]);

  useEffect(() => {
    const handleStoreUpdate = (event) => {
      if (event.detail?.tenantId && event.detail.tenantId !== tenantId) {
        return;
      }

      syncManagementState(getSubscriptionManagementState(tenantId));
    };

    window.addEventListener(
      SUBSCRIPTION_MANAGEMENT_UPDATED_EVENT,
      handleStoreUpdate
    );

    return () => {
      window.removeEventListener(
        SUBSCRIPTION_MANAGEMENT_UPDATED_EVENT,
        handleStoreUpdate
      );
    };
  }, [tenantId]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const activeSubscriptions = useMemo(
    () =>
      managementState.subscriptions.filter((subscription) =>
        ["active", "trial"].includes(subscription.status)
      ),
    [managementState.subscriptions]
  );

  const pendingRequests = useMemo(
    () =>
      managementState.requests.filter((request) => request.status === "pending"),
    [managementState.requests]
  );

  const monthlyRecurringRevenue = useMemo(
    () => countRevenuePerMonth(managementState.subscriptions),
    [managementState.subscriptions]
  );

  const collectionRate = useMemo(() => {
    if (!managementState.paymentHistory.length) {
      return 0;
    }

    const capturedPayments = managementState.paymentHistory.filter(
      (payment) => payment.status === "captured"
    ).length;
    return Math.round(
      (capturedPayments / managementState.paymentHistory.length) * 100
    );
  }, [managementState.paymentHistory]);

  const filteredSubscriptions = useMemo(() => {
    const searchTerm = subscriptionSearch.trim().toLowerCase();

    return managementState.subscriptions.filter((subscription) => {
      const matchesStatus =
        subscriptionStatusFilter === "all" ||
        subscription.status === subscriptionStatusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      return [
        subscription.customerName,
        subscription.businessName,
        subscription.customerEmail,
        subscription.planName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm);
    });
  }, [
    managementState.subscriptions,
    subscriptionSearch,
    subscriptionStatusFilter,
  ]);

  const filteredPayments = useMemo(() => {
    const searchTerm = paymentSearch.trim().toLowerCase();

    return managementState.paymentHistory.filter((payment) => {
      const matchesStatus =
        paymentStatusFilter === "all" || payment.status === paymentStatusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      return [payment.customerName, payment.customerEmail, payment.planName]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm);
    });
  }, [managementState.paymentHistory, paymentSearch, paymentStatusFilter]);

  const latestRequests = useMemo(
    () =>
      [...managementState.requests].sort(
        (left, right) =>
          new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime()
      ),
    [managementState.requests]
  );

  const showNotice = (text, tone = "success") => {
    setNotice({ text, tone });
  };

  const handleApproveRequest = (request) => {
    const nextState = approveSubscriptionRequest(request.id, tenantId);
    syncManagementState(nextState);
    showNotice(`${request.fullName} is now an active subscription.`);
  };

  const handleRejectRequest = (request) => {
    const nextState = rejectSubscriptionRequest(request.id, tenantId);
    syncManagementState(nextState);
    showNotice(`${request.fullName}'s request was marked as rejected.`, "warning");
  };

  const handleToggleSubscription = (subscription) => {
    const nextState = toggleSubscriptionStatus(subscription.id, tenantId);
    syncManagementState(nextState);
    const isBeingSuspended =
      subscription.status === "active" || subscription.status === "trial";

    showNotice(
      isBeingSuspended
        ? `${subscription.customerName}'s subscription is now suspended.`
        : `${subscription.customerName}'s subscription is active again.`
    );
  };

  const handleEditPlan = (plan) => {
    setPlanForm(createPlanFormState(plan));
    onNavigate?.("addPlan");
  };

  const handlePlanStatusToggle = (plan) => {
    const nextState = togglePlanStatus(plan.id, tenantId);
    syncManagementState(nextState);
    showNotice(
      plan.status === "active"
        ? `${plan.name} was archived.`
        : `${plan.name} is active again.`
    );
  };

  const handlePlanFieldChange = (field) => (event) => {
    setPlanForm((currentPlanForm) => ({
      ...currentPlanForm,
      [field]: event.target.value,
    }));
  };

  const handleSavePlan = (event) => {
    event.preventDefault();

    if (!planForm.name.trim()) {
      showNotice("Plan name is required.", "warning");
      return;
    }

    if (!Number(planForm.price)) {
      showNotice("Please enter a valid plan price.", "warning");
      return;
    }

    const nextState = savePlan(
      {
        ...planForm,
        price: Number(planForm.price),
      },
      tenantId
    );

    syncManagementState(nextState);
    setPlanForm(createPlanFormState());
    showNotice("Plan saved successfully.");
    onNavigate?.("plans");
  };

  const handleSavePwaSettings = (event) => {
    event.preventDefault();
    const nextState = savePwaSettings(pwaForm, tenantId);
    syncManagementState(nextState);
    showNotice("PWA settings updated.");
  };

  const handleSaveCustomDomain = (event) => {
    event.preventDefault();
    const nextState = saveCustomDomainSettings(domainForm, tenantId);
    syncManagementState(nextState);
    showNotice("Custom domain settings saved.");
  };

  const handleVerifyDomain = () => {
    if (!String(domainForm.hostname || "").trim()) {
      showNotice("Add a hostname before verifying the domain.", "warning");
      return;
    }

    const savedState = saveCustomDomainSettings(domainForm, tenantId);
    syncManagementState(savedState);
    const verifiedState = verifyCustomDomain(tenantId);
    syncManagementState(verifiedState);
    showNotice("Domain verification completed.");
  };

  const handleExportPayments = () => {
    const csvRows = [
      [
        "Customer",
        "Email",
        "Plan",
        "Billing Cycle",
        "Amount",
        "Status",
        "Method",
        "Paid At",
        "Reference",
        "Invoice",
      ].join(","),
      ...filteredPayments.map((payment) =>
        [
          payment.customerName,
          payment.customerEmail,
          payment.planName,
          payment.billingCycle,
          payment.amount,
          payment.status,
          payment.method,
          formatSubscriptionDate(payment.paidAt),
          payment.reference,
          payment.invoiceNumber,
        ]
          .map(csvEscape)
          .join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `subscription-payments-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
    showNotice("Payment history exported as CSV.");
  };

  const renderStatusPill = (status) => (
    <span
      className={`subscription-admin-pill ${
        statusClassNames[status] || "is-muted"
      }`}
    >
      {statusLabels[status] || status}
    </span>
  );

  const renderOverviewPage = () => (
    <div className="subscription-admin-stack">
      <section className="subscription-admin-grid subscription-admin-grid--cards">
        <article className="subscription-admin-card subscription-admin-card--metric">
          <span>Active subscriptions</span>
          <strong>{activeSubscriptions.length}</strong>
          <small>Live accounts currently running on your tenant.</small>
        </article>
        <article className="subscription-admin-card subscription-admin-card--metric">
          <span>Pending requests</span>
          <strong>{pendingRequests.length}</strong>
          <small>Requests waiting for approval after payment capture.</small>
        </article>
        <article className="subscription-admin-card subscription-admin-card--metric">
          <span>Monthly recurring revenue</span>
          <strong>{formatSubscriptionCurrency(monthlyRecurringRevenue)}</strong>
          <small>Yearly plans are normalized into monthly value here.</small>
        </article>
        <article className="subscription-admin-card subscription-admin-card--metric">
          <span>Collection rate</span>
          <strong>{collectionRate}%</strong>
          <small>Captured payments versus every recorded payment attempt.</small>
        </article>
      </section>

      <section className="subscription-admin-grid subscription-admin-grid--two">
        <article className="subscription-admin-card">
          <div className="subscription-admin-card-head">
            <div>
              <h3>Quick actions</h3>
              <p>Jump straight into the areas that need attention.</p>
            </div>
          </div>

          <div className="subscription-admin-quick-actions">
            <button type="button" onClick={() => onNavigate?.("pendingRequests")}>
              <strong>Review Requests</strong>
              <span>{pendingRequests.length} pending approvals</span>
            </button>
            <button type="button" onClick={() => onNavigate?.("plans")}>
              <strong>Manage Plans</strong>
              <span>{managementState.plans.length} plans in catalog</span>
            </button>
            <button type="button" onClick={() => onNavigate?.("paymentHistory")}>
              <strong>Open Payment History</strong>
              <span>{managementState.paymentHistory.length} recorded payments</span>
            </button>
            <button type="button" onClick={() => onNavigate?.("customDomain")}>
              <strong>Configure Domain</strong>
              <span>{managementState.customDomain.hostname || "No hostname saved"}</span>
            </button>
          </div>
        </article>

        <article className="subscription-admin-card">
          <div className="subscription-admin-card-head">
            <div>
              <h3>Workspace status</h3>
              <p>Critical configuration signals from the subscription setup.</p>
            </div>
          </div>

          <div className="subscription-admin-detail-list">
            <div>
              <span>PWA display mode</span>
              <strong>{managementState.pwaSettings.display}</strong>
            </div>
            <div>
              <span>Push notifications</span>
              <strong>
                {managementState.pwaSettings.pushNotifications ? "Enabled" : "Disabled"}
              </strong>
            </div>
            <div>
              <span>Custom domain</span>
              <strong>
                {managementState.customDomain.hostname || "Not configured"}
              </strong>
            </div>
            <div>
              <span>Domain status</span>
              <strong>{statusLabels[managementState.customDomain.status]}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="subscription-admin-card">
        <div className="subscription-admin-card-head">
          <div>
            <h3>Latest requests</h3>
            <p>New subscription signups flow here after a successful payment.</p>
          </div>
          <button
            type="button"
            className="subscription-admin-link"
            onClick={() => onNavigate?.("pendingRequests")}
          >
            View all
          </button>
        </div>

        <div className="subscription-admin-list">
          {latestRequests.slice(0, 4).map((request) => (
            <article key={request.id} className="subscription-admin-list-item">
              <div>
                <strong>{request.fullName}</strong>
                <span>
                  {request.businessName} · {request.planName} ({request.billingCycle})
                </span>
              </div>
              <div className="subscription-admin-list-meta">
                {renderStatusPill(request.status)}
                <small>{formatSubscriptionDate(request.submittedAt)}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  const renderAllSubscriptionsPage = () => (
    <div className="subscription-admin-stack">
      <section className="subscription-admin-card">
        <div className="subscription-admin-toolbar">
          <div>
            <h3>All subscriptions</h3>
            <p>Search by customer, company, email, or plan, then adjust status in place.</p>
          </div>

          <div className="subscription-admin-toolbar-controls">
            <input
              type="search"
              placeholder="Search subscriptions"
              value={subscriptionSearch}
              onChange={(event) => setSubscriptionSearch(event.target.value)}
            />
            <select
              value={subscriptionStatusFilter}
              onChange={(event) => setSubscriptionStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="past_due">Past due</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </section>

      <section className="subscription-admin-table">
        <div className="subscription-admin-table-head">
          <span>Customer</span>
          <span>Plan</span>
          <span>Billing</span>
          <span>Renewal</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {filteredSubscriptions.map((subscription) => (
          <article key={subscription.id} className="subscription-admin-table-row">
            <div>
              <strong>{subscription.customerName}</strong>
              <span>{subscription.customerEmail}</span>
            </div>
            <div>
              <strong>{subscription.planName}</strong>
              <span>{subscription.businessName}</span>
            </div>
            <div>
              <strong>{formatSubscriptionCurrency(subscription.amount)}</strong>
              <span>{subscription.billingCycle}</span>
            </div>
            <div>
              <strong>{formatSubscriptionDate(subscription.renewalDate)}</strong>
              <span>{subscription.seats} seats</span>
            </div>
            <div>{renderStatusPill(subscription.status)}</div>
            <div>
              <button
                type="button"
                className="subscription-admin-small-btn"
                onClick={() => handleToggleSubscription(subscription)}
              >
                {subscription.status === "active" || subscription.status === "trial"
                  ? "Suspend"
                  : "Activate"}
              </button>
            </div>
          </article>
        ))}

        {!filteredSubscriptions.length ? (
          <div className="subscription-admin-empty">No subscriptions match your filters.</div>
        ) : null}
      </section>
    </div>
  );

  const renderPendingRequestsPage = () => (
    <section className="subscription-admin-stack">
      <div className="subscription-admin-card">
        <div className="subscription-admin-card-head">
          <div>
            <h3>Pending requests</h3>
            <p>Approve requests to turn paid signups into active subscriptions.</p>
          </div>
        </div>
      </div>

      {!pendingRequests.length ? (
        <div className="subscription-admin-empty">
          No pending requests right now. New successful payments will land here.
        </div>
      ) : null}

      <div className="subscription-admin-grid subscription-admin-grid--two">
        {pendingRequests.map((request) => (
          <article key={request.id} className="subscription-admin-card">
            <div className="subscription-admin-card-head">
              <div>
                <h3>{request.fullName}</h3>
                <p>
                  {request.businessName} · {request.businessType}
                </p>
              </div>
              {renderStatusPill(request.status)}
            </div>

            <div className="subscription-admin-detail-list">
              <div>
                <span>Plan</span>
                <strong>
                  {request.planName} ({request.billingCycle})
                </strong>
              </div>
              <div>
                <span>Amount</span>
                <strong>{formatSubscriptionCurrency(request.amount)}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{request.businessEmail}</strong>
              </div>
              <div>
                <span>Submitted</span>
                <strong>{formatSubscriptionDate(request.submittedAt)}</strong>
              </div>
            </div>

            <div className="subscription-admin-actions">
              <button
                type="button"
                className="subscription-admin-primary-btn"
                onClick={() => handleApproveRequest(request)}
              >
                Approve
              </button>
              <button
                type="button"
                className="subscription-admin-secondary-btn"
                onClick={() => handleRejectRequest(request)}
              >
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );

  const renderPlansPage = () => (
    <section className="subscription-admin-stack">
      <div className="subscription-admin-card">
        <div className="subscription-admin-card-head">
          <div>
            <h3>Plans and packages</h3>
            <p>Keep your public pricing catalog aligned with what the dashboard can manage.</p>
          </div>
          <button
            type="button"
            className="subscription-admin-primary-btn"
            onClick={() => {
              setPlanForm(createPlanFormState());
              onNavigate?.("addPlan");
            }}
          >
            Add plan
          </button>
        </div>
      </div>

      <div className="subscription-admin-grid subscription-admin-grid--three">
        {managementState.plans.map((plan) => (
          <article key={plan.id} className="subscription-admin-card">
            <div className="subscription-admin-card-head">
              <div>
                <h3>{plan.name}</h3>
                <p>
                  {formatSubscriptionCurrency(plan.price)} · {plan.billingCycle}
                </p>
              </div>
              {renderStatusPill(plan.status)}
            </div>

            <p className="subscription-admin-copy">{plan.description}</p>

            <div className="subscription-admin-tag-list">
              {plan.features.map((feature) => (
                <span key={feature}>{feature}</span>
              ))}
            </div>

            <div className="subscription-admin-detail-list">
              <div>
                <span>Subscribers</span>
                <strong>{plan.subscribers}</strong>
              </div>
              <div>
                <span>Created</span>
                <strong>{formatSubscriptionDate(plan.createdAt)}</strong>
              </div>
            </div>

            <div className="subscription-admin-actions">
              <button
                type="button"
                className="subscription-admin-primary-btn"
                onClick={() => handleEditPlan(plan)}
              >
                Edit
              </button>
              <button
                type="button"
                className="subscription-admin-secondary-btn"
                onClick={() => handlePlanStatusToggle(plan)}
              >
                {plan.status === "active" ? "Archive" : "Restore"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );

  const renderAddPlanPage = () => (
    <section className="subscription-admin-stack">
      <article className="subscription-admin-card">
        <div className="subscription-admin-card-head">
          <div>
            <h3>{planForm.id ? "Edit plan" : "Add plan"}</h3>
            <p>Create or update a plan that the pricing and management views can use.</p>
          </div>
        </div>

        <form className="subscription-admin-form" onSubmit={handleSavePlan}>
          <label>
            <span>Plan name</span>
            <input
              type="text"
              placeholder="Pro Plus"
              value={planForm.name}
              onChange={handlePlanFieldChange("name")}
            />
          </label>

          <label>
            <span>Billing cycle</span>
            <select
              value={planForm.billingCycle}
              onChange={handlePlanFieldChange("billingCycle")}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>

          <label>
            <span>Price (INR)</span>
            <input
              type="number"
              min="0"
              placeholder="699"
              value={planForm.price}
              onChange={handlePlanFieldChange("price")}
            />
          </label>

          <label>
            <span>Status</span>
            <select value={planForm.status} onChange={handlePlanFieldChange("status")}>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label className="is-wide">
            <span>Description</span>
            <textarea
              rows={4}
              placeholder="What makes this plan useful?"
              value={planForm.description}
              onChange={handlePlanFieldChange("description")}
            />
          </label>

          <label className="is-wide">
            <span>Features</span>
            <textarea
              rows={4}
              placeholder="Comma separated features"
              value={planForm.features}
              onChange={handlePlanFieldChange("features")}
            />
          </label>

          <div className="subscription-admin-actions subscription-admin-actions--form">
            <button type="submit" className="subscription-admin-primary-btn">
              {planForm.id ? "Update plan" : "Save plan"}
            </button>
            <button
              type="button"
              className="subscription-admin-secondary-btn"
              onClick={() => setPlanForm(createPlanFormState())}
            >
              Clear
            </button>
          </div>
        </form>
      </article>
    </section>
  );

  const renderPwaSettingsPage = () => (
    <section className="subscription-admin-stack">
      <article className="subscription-admin-card">
        <div className="subscription-admin-card-head">
          <div>
            <h3>PWA settings</h3>
            <p>Keep your installable app details aligned with the subscription workspace.</p>
          </div>
        </div>

        <form className="subscription-admin-form" onSubmit={handleSavePwaSettings}>
          <label>
            <span>App name</span>
            <input
              type="text"
              value={pwaForm.appName}
              onChange={(event) =>
                setPwaForm((currentForm) => ({
                  ...currentForm,
                  appName: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Short name</span>
            <input
              type="text"
              value={pwaForm.shortName}
              onChange={(event) =>
                setPwaForm((currentForm) => ({
                  ...currentForm,
                  shortName: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Start URL</span>
            <input
              type="text"
              value={pwaForm.startUrl}
              onChange={(event) =>
                setPwaForm((currentForm) => ({
                  ...currentForm,
                  startUrl: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Display mode</span>
            <select
              value={pwaForm.display}
              onChange={(event) =>
                setPwaForm((currentForm) => ({
                  ...currentForm,
                  display: event.target.value,
                }))
              }
            >
              <option value="standalone">Standalone</option>
              <option value="minimal-ui">Minimal UI</option>
              <option value="browser">Browser</option>
            </select>
          </label>

          <label>
            <span>Theme color</span>
            <input
              type="color"
              value={pwaForm.themeColor}
              onChange={(event) =>
                setPwaForm((currentForm) => ({
                  ...currentForm,
                  themeColor: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Background color</span>
            <input
              type="color"
              value={pwaForm.backgroundColor}
              onChange={(event) =>
                setPwaForm((currentForm) => ({
                  ...currentForm,
                  backgroundColor: event.target.value,
                }))
              }
            />
          </label>

          <label className="subscription-admin-checkbox">
            <input
              type="checkbox"
              checked={pwaForm.offlineMode}
              onChange={(event) =>
                setPwaForm((currentForm) => ({
                  ...currentForm,
                  offlineMode: event.target.checked,
                }))
              }
            />
            <span>Enable offline mode cache</span>
          </label>

          <label className="subscription-admin-checkbox">
            <input
              type="checkbox"
              checked={pwaForm.pushNotifications}
              onChange={(event) =>
                setPwaForm((currentForm) => ({
                  ...currentForm,
                  pushNotifications: event.target.checked,
                }))
              }
            />
            <span>Enable push notifications</span>
          </label>

          <label className="subscription-admin-checkbox">
            <input
              type="checkbox"
              checked={pwaForm.installPrompt}
              onChange={(event) =>
                setPwaForm((currentForm) => ({
                  ...currentForm,
                  installPrompt: event.target.checked,
                }))
              }
            />
            <span>Show install prompt</span>
          </label>

          <div className="subscription-admin-actions subscription-admin-actions--form">
            <button type="submit" className="subscription-admin-primary-btn">
              Save settings
            </button>
          </div>
        </form>
      </article>
    </section>
  );

  const renderPaymentHistoryPage = () => (
    <section className="subscription-admin-stack">
      <article className="subscription-admin-card">
        <div className="subscription-admin-toolbar">
          <div>
            <h3>Payment history</h3>
            <p>Search recorded transactions and export the filtered list as CSV.</p>
          </div>

          <div className="subscription-admin-toolbar-controls">
            <input
              type="search"
              placeholder="Search payments"
              value={paymentSearch}
              onChange={(event) => setPaymentSearch(event.target.value)}
            />
            <select
              value={paymentStatusFilter}
              onChange={(event) => setPaymentStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="captured">Captured</option>
              <option value="failed">Failed</option>
            </select>
            <button
              type="button"
              className="subscription-admin-primary-btn"
              onClick={handleExportPayments}
            >
              Export CSV
            </button>
          </div>
        </div>
      </article>

      <section className="subscription-admin-table">
        <div className="subscription-admin-table-head">
          <span>Customer</span>
          <span>Plan</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Reference</span>
          <span>Paid at</span>
        </div>

        {filteredPayments.map((payment) => (
          <article key={payment.id} className="subscription-admin-table-row">
            <div>
              <strong>{payment.customerName}</strong>
              <span>{payment.customerEmail}</span>
            </div>
            <div>
              <strong>{payment.planName}</strong>
              <span>{payment.billingCycle}</span>
            </div>
            <div>
              <strong>{formatSubscriptionCurrency(payment.amount)}</strong>
              <span>{payment.invoiceNumber}</span>
            </div>
            <div>{renderStatusPill(payment.status)}</div>
            <div>
              <strong>{payment.reference}</strong>
              <span>{payment.method}</span>
            </div>
            <div>
              <strong>{formatSubscriptionDate(payment.paidAt)}</strong>
              <span>Recorded</span>
            </div>
          </article>
        ))}

        {!filteredPayments.length ? (
          <div className="subscription-admin-empty">No payments match your filters.</div>
        ) : null}
      </section>
    </section>
  );

  const renderCustomDomainPage = () => (
    <section className="subscription-admin-stack">
      <article className="subscription-admin-card">
        <div className="subscription-admin-card-head">
          <div>
            <h3>Custom domain</h3>
            <p>Save hostname details, then verify the DNS handoff for your workspace.</p>
          </div>
          {renderStatusPill(managementState.customDomain.status)}
        </div>

        <form className="subscription-admin-form" onSubmit={handleSaveCustomDomain}>
          <label>
            <span>Hostname</span>
            <input
              type="text"
              placeholder="app.realbell.in"
              value={domainForm.hostname}
              onChange={(event) =>
                setDomainForm((currentForm) => ({
                  ...currentForm,
                  hostname: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>DNS provider</span>
            <input
              type="text"
              placeholder="Cloudflare"
              value={domainForm.provider}
              onChange={(event) =>
                setDomainForm((currentForm) => ({
                  ...currentForm,
                  provider: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>CNAME target</span>
            <input
              type="text"
              value={domainForm.dnsTarget}
              onChange={(event) =>
                setDomainForm((currentForm) => ({
                  ...currentForm,
                  dnsTarget: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Verification token</span>
            <input
              type="text"
              value={domainForm.verificationToken}
              onChange={(event) =>
                setDomainForm((currentForm) => ({
                  ...currentForm,
                  verificationToken: event.target.value,
                }))
              }
            />
          </label>

          <div className="subscription-admin-inline-note">
            <strong>DNS checklist</strong>
            <span>
              Point your hostname to <code>{domainForm.dnsTarget}</code> and keep the TXT
              token <code>{domainForm.verificationToken}</code> available while verifying.
            </span>
          </div>

          <div className="subscription-admin-actions subscription-admin-actions--form">
            <button type="submit" className="subscription-admin-primary-btn">
              Save domain
            </button>
            <button
              type="button"
              className="subscription-admin-secondary-btn"
              onClick={handleVerifyDomain}
            >
              Verify DNS
            </button>
          </div>
        </form>

        <div className="subscription-admin-detail-list subscription-admin-detail-list--split">
          <div>
            <span>Last checked</span>
            <strong>{formatSubscriptionDate(managementState.customDomain.lastChecked)}</strong>
          </div>
          <div>
            <span>Updated</span>
            <strong>{formatSubscriptionDate(managementState.customDomain.updatedAt)}</strong>
          </div>
        </div>
      </article>
    </section>
  );

  const renderActivePage = () => {
    switch (activePage) {
      case "allSubscriptions":
        return renderAllSubscriptionsPage();
      case "pendingRequests":
        return renderPendingRequestsPage();
      case "plans":
        return renderPlansPage();
      case "addPlan":
        return renderAddPlanPage();
      case "pwaSettings":
        return renderPwaSettingsPage();
      case "paymentHistory":
        return renderPaymentHistoryPage();
      case "customDomain":
        return renderCustomDomainPage();
      case "subscription":
      default:
        return renderOverviewPage();
    }
  };

  return (
    <div className="subscription-admin-shell">
      {notice ? (
        <div className={`subscription-admin-notice ${notice.tone || "success"}`}>
          {notice.text}
        </div>
      ) : null}

      {renderActivePage()}
    </div>
  );
}

export default SubscriptionManagement;
