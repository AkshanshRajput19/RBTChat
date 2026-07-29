const crypto = require("crypto");
const express = require("express");
const Razorpay = require("razorpay");
const {
  createOtp,
  emailPattern,
  hasEmailOtpConfig,
  hasPhoneOtpConfig,
  maskEmail,
  maskPhoneNumber,
  normalizePhoneNumber,
  sendOtpEmail,
  sendOtpMobile,
} = require("../utils/otpUtils");

const router = express.Router();

const rateLimitStore = new Map();
const publicVerificationStore = new Map();
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const VERIFIED_SESSION_MS = 30 * 60 * 1000;
const isDevelopmentOtpFallbackEnabled =
  process.env.NODE_ENV !== "production" &&
  String(process.env.ALLOW_DEV_OTP_FALLBACK || "true").toLowerCase() !== "false";

const getRazorpayClient = () => {
  const keyId = String(process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();

  if (!keyId || !keySecret) {
    const error = new Error("Razorpay is not configured on the server.");
    error.statusCode = 503;
    throw error;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

const getRazorpaySecret = () => {
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();

  if (!keySecret) {
    const error = new Error("Razorpay is not configured on the server.");
    error.statusCode = 503;
    throw error;
  }

  return keySecret;
};

const getClientKey = (req) => {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }

  return req.ip || "unknown";
};

const rateLimitVerification = (req, res, next) => {
  const key = getClientKey(req);
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxRequests = 10;
  const attempts = rateLimitStore.get(key) || [];
  const recentAttempts = attempts.filter((timestamp) => timestamp > now - windowMs);

  if (recentAttempts.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: "Too many verification attempts. Please try again in a few minutes.",
    });
  }

  recentAttempts.push(now);
  rateLimitStore.set(key, recentAttempts);
  next();
};

const cleanupVerificationStore = () => {
  const now = Date.now();

  for (const [verificationId, verification] of publicVerificationStore.entries()) {
    const isExpired = !verification.verified && verification.expiresAt <= now;
    const isVerifiedSessionExpired =
      verification.verified &&
      verification.verifiedAt &&
      verification.verifiedAt + VERIFIED_SESSION_MS <= now;

    if (isExpired || isVerifiedSessionExpired) {
      publicVerificationStore.delete(verificationId);
    }
  }
};

const sanitizeNote = (value) => String(value || "").trim().slice(0, 255);

const storeVerificationRequest = ({
  verificationId,
  channel,
  code,
  target,
  maskedDestination,
}) => {
  publicVerificationStore.set(verificationId, {
    channel,
    code,
    target,
    maskedDestination,
    attempts: 0,
    verified: false,
    createdAt: Date.now(),
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    verifiedAt: null,
  });
};

router.post("/request-otp", rateLimitVerification, async (req, res) => {
  cleanupVerificationStore();

  try {
    const channel = String(req.body.channel || "").trim().toLowerCase();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phoneNumber = String(req.body.phoneNumber || "").trim();

    if (channel !== "email" && channel !== "phone") {
      return res.status(400).json({
        success: false,
        message: "Choose email or phone verification.",
      });
    }

    if (channel === "email" && !emailPattern.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address before requesting OTP.",
      });
    }

    const normalizedPhoneNumber =
      channel === "phone" ? normalizePhoneNumber(phoneNumber) : "";

    if (channel === "phone" && !normalizedPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid phone number before requesting OTP.",
      });
    }

    const verificationId = crypto.randomUUID();
    const code = createOtp();
    const target = channel === "email" ? email : normalizedPhoneNumber;
    const maskedDestination =
      channel === "email" ? maskEmail(target) : maskPhoneNumber(target);

    const recipient =
      channel === "email"
        ? { email, tenantId: "default" }
        : { phoneNumber: normalizedPhoneNumber, tenantId: "default" };
    const channelConfigured =
      channel === "email"
        ? await hasEmailOtpConfig(recipient)
        : await hasPhoneOtpConfig(recipient);

    if (!channelConfigured) {
      if (isDevelopmentOtpFallbackEnabled) {
        storeVerificationRequest({
          verificationId,
          channel,
          code,
          target,
          maskedDestination,
        });

        return res.json({
          success: true,
          verificationId,
          channel,
          maskedDestination,
          deliveryMode: "development-fallback",
          message: `OTP delivery is unavailable locally. Use this development OTP: ${code}`,
        });
      }

      return res.status(503).json({
        success: false,
        message:
          channel === "email"
            ? "Email OTP is not configured on the server yet."
            : "Phone OTP is not configured on the server yet.",
      });
    }

    const sent =
      channel === "email"
        ? await sendOtpEmail(recipient, code)
        : await sendOtpMobile(recipient, code);

    if (!sent) {
      if (isDevelopmentOtpFallbackEnabled) {
        storeVerificationRequest({
          verificationId,
          channel,
          code,
          target,
          maskedDestination,
        });

        return res.json({
          success: true,
          verificationId,
          channel,
          maskedDestination,
          deliveryMode: "development-fallback",
          message: `OTP delivery failed locally. Use this development OTP: ${code}`,
        });
      }

      return res.status(502).json({
        success: false,
        message:
          channel === "email"
            ? "Unable to send email OTP right now. Please try again shortly."
            : "Unable to send phone OTP right now. Please try again shortly.",
      });
    }

    storeVerificationRequest({
      verificationId,
      channel,
      code,
      target,
      maskedDestination,
    });

    return res.json({
      success: true,
      verificationId,
      channel,
      maskedDestination,
      message: `Verification code sent to ${maskedDestination}.`,
    });
  } catch (error) {
    console.error("OTP request error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to send verification code right now.",
    });
  }
});

router.post("/verify-otp", rateLimitVerification, async (req, res) => {
  cleanupVerificationStore();

  try {
    const verificationId = String(req.body.verificationId || "").trim();
    const otp = String(req.body.otp || "").trim();

    if (!verificationId || !otp) {
      return res.status(400).json({
        success: false,
        message: "Provide the OTP request ID and verification code.",
      });
    }

    const verification = publicVerificationStore.get(verificationId);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "This verification request was not found. Please request a new code.",
      });
    }

    if (verification.expiresAt <= Date.now()) {
      publicVerificationStore.delete(verificationId);
      return res.status(410).json({
        success: false,
        message: "This verification code has expired. Please request a new one.",
      });
    }

    if (verification.verified) {
      return res.json({
        success: true,
        verified: true,
        verificationId,
        channel: verification.channel,
        maskedDestination: verification.maskedDestination,
        message: "Verification already completed.",
      });
    }

    if (verification.code !== otp) {
      verification.attempts += 1;

      if (verification.attempts >= 5) {
        publicVerificationStore.delete(verificationId);
        return res.status(429).json({
          success: false,
          message: "Too many incorrect OTP attempts. Please request a new code.",
        });
      }

      return res.status(401).json({
        success: false,
        message: "The verification code is incorrect.",
      });
    }

    verification.verified = true;
    verification.verifiedAt = Date.now();
    verification.expiresAt = Date.now() + VERIFIED_SESSION_MS;
    verification.code = "";

    return res.json({
      success: true,
      verified: true,
      verificationId,
      channel: verification.channel,
      maskedDestination: verification.maskedDestination,
      message: "Verification successful. You can continue to payment.",
    });
  } catch (error) {
    console.error("OTP verify error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to verify the code right now.",
    });
  }
});

router.post("/verify-payment", async (req, res) => {
  try {
    const orderId = String(req.body.orderId || "").trim();
    const paymentId = String(req.body.paymentId || "").trim();
    const signature = String(req.body.signature || "").trim();

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay payment verification details.",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", getRazorpaySecret())
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: "Razorpay payment signature verification failed.",
      });
    }

    return res.json({
      success: true,
      message: "Razorpay payment verified successfully.",
    });
  } catch (error) {
    console.error("Razorpay verify error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to verify Razorpay payment.",
    });
  }
});

router.post("/create-order", async (req, res) => {
  cleanupVerificationStore();

  try {
    const amount = Number(req.body.amount);
    const amountInPaise = Math.round(amount * 100);
    const source =
      String(req.body.source || "").trim().toLowerCase() === "website"
        ? "website"
        : "dashboard";

    if (!Number.isFinite(amount) || amount <= 0 || amountInPaise <= 0) {
      return res.status(400).json({
        error: "Provide a valid payment amount.",
      });
    }

    if (source === "website") {
      const verificationId = String(req.body.verificationId || "").trim();

      if (!verificationId) {
        return res.status(400).json({
          error: "Complete OTP verification before starting payment.",
        });
      }

      const verification = publicVerificationStore.get(verificationId);

      if (!verification || !verification.verified) {
        return res.status(403).json({
          error: "Your OTP verification is incomplete. Please verify and try again.",
        });
      }

      if (
        !verification.verifiedAt ||
        verification.verifiedAt + VERIFIED_SESSION_MS <= Date.now()
      ) {
        publicVerificationStore.delete(verificationId);
        return res.status(410).json({
          error: "Your verification session expired. Please verify again.",
        });
      }

      if (verification.channel === "email") {
        const customerEmail = String(req.body.customerEmail || "")
          .trim()
          .toLowerCase();

        if (!emailPattern.test(customerEmail) || customerEmail !== verification.target) {
          return res.status(400).json({
            error: "The verified email no longer matches the payment details.",
          });
        }
      }

      if (verification.channel === "phone") {
        const customerPhone = normalizePhoneNumber(req.body.customerPhone);

        if (!customerPhone || customerPhone !== verification.target) {
          return res.status(400).json({
            error: "The verified phone number no longer matches the payment details.",
          });
        }
      }
    }

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        source,
        plan_name: sanitizeNote(req.body.planName),
        billing_cycle: sanitizeNote(req.body.billingCycle),
        business_name: sanitizeNote(req.body.businessName),
      },
    };

    if (source === "website") {
      const verification = publicVerificationStore.get(String(req.body.verificationId || "").trim());
      options.notes.verification_channel = sanitizeNote(verification?.channel);
      options.notes.verification_target = sanitizeNote(verification?.maskedDestination);
    }

    const order = await getRazorpayClient().orders.create(options);
    return res.json(order);
  } catch (error) {
    console.error("Razorpay error:", error);
    return res.status(error.statusCode || 500).json({
      error: error.message || "Unable to create the payment order.",
    });
  }
});

module.exports = router;
