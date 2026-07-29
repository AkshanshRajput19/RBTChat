import { useEffect, useMemo, useState } from "react";
import api from "../api";
import {
  openRazorpayCheckout,
  verifyRazorpayPayment,
} from "../utils/razorpayCheckout";
import { recordPublicSubscriptionRequest } from "./subscriptionManagementStore";
import "./SubscriptionModal.css";

const BUSINESS_TYPE_OPTIONS = [
  "Startup",
  "Agency",
  "E-commerce",
  "Education",
  "Healthcare",
  "Hospitality",
  "Manufacturing",
  "Professional Services",
  "Other",
];

const VERIFICATION_METHOD_OPTIONS = [
  {
    id: "email",
    label: "Email OTP",
    description: "Send the code to your business email address.",
  },
  {
    id: "phone",
    label: "Phone OTP",
    description: "Send the code to your mobile number.",
  },
];

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const getInitialFormState = (initialPlanName, initialBillingCycle) => ({
  planName: initialPlanName,
  billingCycle: initialBillingCycle,
  fullName: "",
  mobileNumber: "",
  businessName: "",
  businessType: "",
  businessAddress: "",
  businessEmail: "",
  panCardNumber: "",
  password: "",
});

const getValidationErrors = (formData) => {
  const nextErrors = {};

  if (!formData.planName) {
    nextErrors.planName = "Please select a plan.";
  }

  if (!formData.billingCycle) {
    nextErrors.billingCycle = "Please select a billing cycle.";
  }

  if (!formData.fullName.trim()) {
    nextErrors.fullName = "Please enter your full name.";
  }

  if (!/^\d{10}$/.test(formData.mobileNumber.trim())) {
    nextErrors.mobileNumber = "Enter a valid 10-digit mobile number.";
  }

  if (!formData.businessName.trim()) {
    nextErrors.businessName = "Please enter your business name.";
  }

  if (!formData.businessType) {
    nextErrors.businessType = "Please select a business type.";
  }

  if (!formData.businessAddress.trim()) {
    nextErrors.businessAddress = "Please enter your business address.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.businessEmail.trim())) {
    nextErrors.businessEmail = "Enter a valid business email address.";
  }

  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(formData.panCardNumber.trim())) {
    nextErrors.panCardNumber = "Enter a valid PAN card number.";
  }

  if (formData.password.trim().length < 6) {
    nextErrors.password = "Password must be at least 6 characters.";
  }

  return nextErrors;
};

function SubscriptionModal({
  isOpen,
  onClose,
  initialPlanName,
  initialBillingCycle,
  pricingPlans,
}) {
  const [formData, setFormData] = useState(
    getInitialFormState(initialPlanName, initialBillingCycle)
  );
  const [errors, setErrors] = useState({});
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [verificationMethod, setVerificationMethod] = useState("email");
  const [verificationId, setVerificationId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [verificationDestination, setVerificationDestination] = useState("");
  const [verifiedChannel, setVerifiedChannel] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const planNames = useMemo(() => {
    const uniqueNames = new Set();

    Object.values(pricingPlans).forEach((plans) => {
      plans.forEach((plan) => uniqueNames.add(plan.name));
    });

    return Array.from(uniqueNames);
  }, [pricingPlans]);

  const selectedPlan = useMemo(
    () =>
      pricingPlans[formData.billingCycle]?.find(
        (plan) => plan.name === formData.planName
      ) ?? null,
    [formData.billingCycle, formData.planName, pricingPlans]
  );

  const normalizedBusinessEmail = useMemo(
    () => String(formData.businessEmail || "").trim().toLowerCase(),
    [formData.businessEmail]
  );

  const normalizedMobileNumber = useMemo(
    () => String(formData.mobileNumber || "").trim(),
    [formData.mobileNumber]
  );

  const selectedVerificationValue =
    verificationMethod === "email"
      ? normalizedBusinessEmail
      : normalizedMobileNumber;

  const validateForm = () => {
    const nextErrors = getValidationErrors(formData);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    setFormData(getInitialFormState(initialPlanName, initialBillingCycle));
    setErrors({});
    setPaymentSuccess(false);
    setPaymentMessage("");
    setCurrentStep(1);
    setIsPaying(false);
    setVerificationMethod("email");
    setVerificationId("");
    setVerificationCode("");
    setVerificationMessage("");
    setVerificationError("");
    setVerificationDestination("");
    setVerifiedChannel("");
    setIsVerified(false);
    setIsSendingOtp(false);
    setIsVerifyingOtp(false);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [initialBillingCycle, initialPlanName, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape" && !isPaying) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isPaying, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setVerificationId("");
    setVerificationCode("");
    setVerificationMessage("");
    setVerificationError("");
    setVerificationDestination("");
    setVerifiedChannel("");
    setIsVerified(false);
    setIsSendingOtp(false);
    setIsVerifyingOtp(false);
  }, [isOpen, verificationMethod, normalizedBusinessEmail, normalizedMobileNumber]);

  if (!isOpen) {
    return null;
  }

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }));

    setErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleSendOtp = async () => {
    if (!validateForm()) {
      return;
    }

    setPaymentMessage("");
    setVerificationError("");
    setVerificationMessage("");
    setIsVerified(false);
    setVerifiedChannel("");
    setVerificationCode("");
    setVerificationId("");
    setVerificationDestination("");

    try {
      setIsSendingOtp(true);

      const response = await api.post("/payments/request-otp", {
        channel: verificationMethod,
        email: normalizedBusinessEmail,
        phoneNumber: normalizedMobileNumber,
      });

      setVerificationId(response.data?.verificationId || "");
      setVerificationDestination(response.data?.maskedDestination || "");
      setVerificationMessage(
        response.data?.message || "Verification code sent successfully."
      );
    } catch (error) {
      setVerificationError(
        error.response?.data?.message ||
          "Unable to send the verification code right now."
      );
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!verificationId) {
      setVerificationError("Request an OTP before verifying.");
      return;
    }

    if (!/^\d{4,8}$/.test(verificationCode.trim())) {
      setVerificationError("Enter the OTP you received.");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      setVerificationError("");

      const response = await api.post("/payments/verify-otp", {
        verificationId,
        otp: verificationCode.trim(),
      });

      setIsVerified(true);
      setVerifiedChannel(response.data?.channel || verificationMethod);
      setVerificationDestination(
        response.data?.maskedDestination || verificationDestination
      );
      setVerificationMessage(
        response.data?.message || "Verification successful."
      );
      setCurrentStep(3);
    } catch (error) {
      setIsVerified(false);
      setVerifiedChannel("");
      setVerificationError(
        error.response?.data?.message ||
          "Unable to verify the OTP right now."
      );
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleContinueToVerification = () => {
    if (!validateForm()) {
      return;
    }

    setPaymentMessage("");
    setCurrentStep(2);
  };

  const handleBackToDetails = () => {
    if (isSendingOtp || isVerifyingOtp || isPaying) {
      return;
    }

    setCurrentStep(1);
  };

  const handleBackToVerification = () => {
    if (isPaying) {
      return;
    }

    setCurrentStep(2);
  };

  const handlePayment = async () => {
    if (!validateForm() || !selectedPlan) {
      return;
    }

    if (!isVerified || !verificationId) {
      setVerificationError("Complete OTP verification before payment.");
      return;
    }

    try {
      setIsPaying(true);
      setPaymentMessage("");

      await openRazorpayCheckout({
        orderPayload: {
          amount: selectedPlan.price,
          source: "website",
          verificationId,
          customerEmail: normalizedBusinessEmail,
          customerPhone: normalizedMobileNumber,
          planName: formData.planName,
          billingCycle: formData.billingCycle,
          businessName: formData.businessName.trim(),
        },
        description: `${formData.planName} (${formData.billingCycle}) subscription`,
        prefill: {
          name: formData.fullName,
          email: normalizedBusinessEmail,
          contact: normalizedMobileNumber,
        },
        notes: {
          plan_name: formData.planName,
          billing_cycle: formData.billingCycle,
          business_name: formData.businessName,
          business_type: formData.businessType,
          verification_channel: verifiedChannel || verificationMethod,
        },
        onSuccess: async (paymentResponse, order) => {
          await verifyRazorpayPayment({
            orderId: order.id,
            paymentId: paymentResponse?.razorpay_payment_id,
            signature: paymentResponse?.razorpay_signature,
          });

          try {
            recordPublicSubscriptionRequest({
              ...formData,
              businessEmail: normalizedBusinessEmail,
              mobileNumber: normalizedMobileNumber,
              verificationChannel: verifiedChannel || verificationMethod,
              verifiedContact: verificationDestination,
              amount: selectedPlan.price,
              orderId: order.id,
              paymentId: paymentResponse?.razorpay_payment_id,
              paymentReference:
                paymentResponse?.razorpay_payment_id ||
                paymentResponse?.razorpay_order_id,
            });
            setPaymentSuccess(true);
            setPaymentMessage(
              "Payment completed successfully. Your subscription request is now captured."
            );
          } finally {
            setIsPaying(false);
          }
        },
        onDismiss: () => {
          setIsPaying(false);
        },
        onFailure: (message) => {
          setIsPaying(false);
          setPaymentMessage(message);
        },
      });
    } catch (error) {
      setIsPaying(false);
      setPaymentMessage(
        error.response?.data?.error ||
          error.message ||
          "Unable to start payment right now."
      );
    }
  };

  const stepChips = [
    {
      label: "1. Details",
      state: currentStep === 1 ? "active" : "complete",
    },
    {
      label: "2. Verification",
      state:
        currentStep === 2
          ? "active"
          : currentStep > 2 || isVerified
            ? "complete"
            : "pending",
    },
    {
      label: "3. Payment",
      state:
        paymentSuccess
          ? "complete"
          : currentStep === 3
            ? "active"
            : "pending",
    },
  ];

  return (
    <div
      className="subscription-modal-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isPaying) {
          onClose();
        }
      }}
    >
      <div
        className="subscription-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-modal-title"
      >
        <div className="subscription-modal-header">
          <div>
            <p className="subscription-modal-eyebrow">Subscription form</p>
            <h2 id="subscription-modal-title">Subscribe to RBTChat</h2>
            <span>
              Complete your business details, verify by email or phone OTP, and
              finish the payment from the same popup.
            </span>
          </div>

          <button
            type="button"
            className="subscription-modal-close"
            onClick={onClose}
            disabled={isPaying}
            aria-label="Close subscription form"
          >
            &times;
          </button>
        </div>

        <div className="subscription-section-chips" aria-hidden="true">
          {stepChips.map((stepChip) => (
            <span
              key={stepChip.label}
              className={`subscription-section-chip subscription-section-chip--${stepChip.state}`}
            >
              {stepChip.label}
            </span>
          ))}
        </div>

        <div className="subscription-modal-body">
          {currentStep === 1 ? (
            <section className="subscription-section">
              <div className="subscription-section-heading">
                <span className="subscription-section-step">Step 1</span>
                <h3>Details</h3>
                <p>
                  Share the business details we need before verification and
                  payment.
                </p>
              </div>

              <div className="subscription-form-grid">
                <label className="subscription-field">
                  <span>Select plan</span>
                  <select value={formData.planName} onChange={handleFieldChange("planName")}>
                    {planNames.map((planName) => (
                      <option key={planName} value={planName}>
                        {planName}
                      </option>
                    ))}
                  </select>
                  {errors.planName ? <small>{errors.planName}</small> : null}
                </label>

                <label className="subscription-field">
                  <span>Billing cycle</span>
                  <select
                    value={formData.billingCycle}
                    onChange={handleFieldChange("billingCycle")}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  {errors.billingCycle ? <small>{errors.billingCycle}</small> : null}
                </label>

                <label className="subscription-field">
                  <span>Full name</span>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleFieldChange("fullName")}
                  />
                  {errors.fullName ? <small>{errors.fullName}</small> : null}
                </label>

                <label className="subscription-field">
                  <span>Mobile number</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    value={formData.mobileNumber}
                    onChange={handleFieldChange("mobileNumber")}
                  />
                  {errors.mobileNumber ? <small>{errors.mobileNumber}</small> : null}
                </label>

                <label className="subscription-field">
                  <span>Business name</span>
                  <input
                    type="text"
                    placeholder="Enter your business name"
                    value={formData.businessName}
                    onChange={handleFieldChange("businessName")}
                  />
                  {errors.businessName ? <small>{errors.businessName}</small> : null}
                </label>

                <label className="subscription-field">
                  <span>Business type</span>
                  <select
                    value={formData.businessType}
                    onChange={handleFieldChange("businessType")}
                  >
                    <option value="">Select business type</option>
                    {BUSINESS_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.businessType ? <small>{errors.businessType}</small> : null}
                </label>

                <label className="subscription-field subscription-field--wide">
                  <span>Business address</span>
                  <textarea
                    rows={4}
                    placeholder="Enter your business address"
                    value={formData.businessAddress}
                    onChange={handleFieldChange("businessAddress")}
                  />
                  {errors.businessAddress ? <small>{errors.businessAddress}</small> : null}
                </label>

                <label className="subscription-field">
                  <span>Business email</span>
                  <input
                    type="email"
                    placeholder="business@example.com"
                    value={formData.businessEmail}
                    onChange={handleFieldChange("businessEmail")}
                  />
                  {errors.businessEmail ? <small>{errors.businessEmail}</small> : null}
                </label>

                <label className="subscription-field">
                  <span>PAN card details</span>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={formData.panCardNumber}
                    onChange={handleFieldChange("panCardNumber")}
                  />
                  {errors.panCardNumber ? <small>{errors.panCardNumber}</small> : null}
                </label>

                <label className="subscription-field subscription-field--wide">
                  <span>Password</span>
                  <input
                    type="password"
                    placeholder="Create your password"
                    value={formData.password}
                    onChange={handleFieldChange("password")}
                  />
                  {errors.password ? <small>{errors.password}</small> : null}
                </label>
              </div>

              <div className="subscription-section-actions">
                <button
                  type="button"
                  className="subscription-secondary-btn"
                  onClick={onClose}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="subscription-primary-btn"
                  onClick={handleContinueToVerification}
                >
                  Continue to Verification
                </button>
              </div>
            </section>
          ) : null}

          {currentStep === 2 ? (
            <section className="subscription-section">
              <div className="subscription-section-heading">
                <span className="subscription-section-step">Step 2</span>
                <h3>Verification</h3>
                <p>
                  Choose whether you want OTP verification on your business email
                  or mobile number.
                </p>
              </div>

              <div className="subscription-verification-card">
                <div className="subscription-verification-methods">
                  {VERIFICATION_METHOD_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`subscription-verification-method${
                        verificationMethod === option.id ? " is-active" : ""
                      }`}
                      onClick={() => setVerificationMethod(option.id)}
                      disabled={isSendingOtp || isVerifyingOtp || isPaying}
                    >
                      <strong>{option.label}</strong>
                      <span>{option.description}</span>
                    </button>
                  ))}
                </div>

                <div className="subscription-verification-summary">
                  <strong>
                    {selectedVerificationValue || "Fill the matching contact field in Details"}
                  </strong>
                  <span>
                    {verificationMethod === "email"
                      ? "OTP will be sent to the business email from Step 1."
                      : "OTP will be sent to the mobile number from Step 1."}
                  </span>
                </div>

                {verificationMessage ? (
                  <div
                    className={`subscription-inline-message ${
                      isVerified
                        ? "subscription-inline-message--success"
                        : "subscription-inline-message--info"
                    }`}
                  >
                    {verificationMessage}
                  </div>
                ) : null}

                {verificationError ? (
                  <div className="subscription-inline-message subscription-inline-message--error">
                    {verificationError}
                  </div>
                ) : null}

                <div className="subscription-verification-actions">
                  <button
                    type="button"
                    className="subscription-secondary-btn"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || isVerifyingOtp || isPaying}
                  >
                    {isSendingOtp
                      ? "Sending OTP..."
                      : verificationId
                        ? "Resend OTP"
                        : "Send OTP"}
                  </button>
                </div>

                <div className="subscription-verification-form">
                  <label className="subscription-field">
                    <span>Enter OTP</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      placeholder="Enter verification code"
                      value={verificationCode}
                      onChange={(event) =>
                        setVerificationCode(
                          event.target.value.replace(/\D/g, "").slice(0, 8)
                        )
                      }
                    />
                  </label>

                  <button
                    type="button"
                    className="subscription-primary-btn"
                    onClick={handleVerifyOtp}
                    disabled={
                      isSendingOtp ||
                      isVerifyingOtp ||
                      isPaying ||
                      !verificationId
                    }
                  >
                    {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
                  </button>
                </div>

                {isVerified ? (
                  <div className="subscription-verification-status">
                    Verified via {verifiedChannel === "phone" ? "phone" : "email"} at{" "}
                    {verificationDestination}.
                  </div>
                ) : null}
              </div>

              <div className="subscription-section-actions">
                <button
                  type="button"
                  className="subscription-secondary-btn"
                  onClick={handleBackToDetails}
                  disabled={isSendingOtp || isVerifyingOtp || isPaying}
                >
                  Back to Details
                </button>
              </div>
            </section>
          ) : null}

          {currentStep === 3 ? (
            <section className="subscription-section">
              <div className="subscription-section-heading">
                <span className="subscription-section-step">Step 3</span>
                <h3>Payment</h3>
                <p>
                  Review the subscription summary and continue to Razorpay after
                  OTP verification is complete.
                </p>
              </div>

              <div className="subscription-payment-card">
                <div className="subscription-payment-row">
                  <span>Selected plan</span>
                  <strong>{formData.planName}</strong>
                </div>

                <div className="subscription-payment-row">
                  <span>Billing cycle</span>
                  <strong>{formData.billingCycle}</strong>
                </div>

                <div className="subscription-payment-row">
                  <span>Verification</span>
                  <strong>
                    {isVerified
                      ? `Verified via ${verifiedChannel === "phone" ? "phone" : "email"}`
                      : "Pending OTP verification"}
                  </strong>
                </div>

                <div className="subscription-payment-row">
                  <span>Amount</span>
                  <strong>{selectedPlan ? formatPrice(selectedPlan.price) : "N/A"}</strong>
                </div>

                <div className="subscription-payment-row subscription-payment-row--note">
                  <span>
                    {isVerified
                      ? `Payment prefill will use ${verificationDestination} along with your submitted details.`
                      : "Finish the verification section first, then the Razorpay payment button will complete the signup."}
                  </span>
                </div>

                {paymentSuccess ? (
                  <div className="subscription-payment-success">{paymentMessage}</div>
                ) : null}

                {!paymentSuccess && paymentMessage ? (
                  <div className="subscription-inline-message subscription-inline-message--error">
                    {paymentMessage}
                  </div>
                ) : null}

                <div className="subscription-payment-actions">
                  <button
                    type="button"
                    className="subscription-secondary-btn"
                    onClick={paymentSuccess ? onClose : handleBackToVerification}
                    disabled={isPaying}
                  >
                    {paymentSuccess ? "Close" : "Back to Verification"}
                  </button>

                  <button
                    type="button"
                    className="subscription-primary-btn"
                    onClick={handlePayment}
                    disabled={
                      isPaying || paymentSuccess || !isVerified || !selectedPlan
                    }
                  >
                    {isPaying
                      ? "Opening payment..."
                      : paymentSuccess
                        ? "Payment completed"
                        : !isVerified
                          ? "Verify to continue"
                          : `Pay ${selectedPlan ? formatPrice(selectedPlan.price) : ""}`}
                  </button>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default SubscriptionModal;
