const nodemailer = require("nodemailer");
const twilio = require("twilio");
const Tenant = require("../models/Tenant");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_TIMEOUT_MS = 10000;

const createOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const normalizeGmailAppPassword = (value) =>
  String(value || "")
    .replace(/\s+/g, "")
    .trim();

const createOtpEmailContent = (code) => ({
  subject: "RBTChat Verification Code",
  html: `<p>Your verification code is <strong>${code}</strong>.</p><p>This code expires in 10 minutes.</p>`,
  text: `Your verification code is ${code}. This code expires in 10 minutes.`,
});

const sendEmailWithResend = async ({
  apiKey,
  fromAddress,
  toAddress,
  subject,
  html,
  text,
}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "rbtchat-backend/1.0",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [toAddress],
        subject,
        html,
        text,
      }),
      signal: controller.signal,
    });

    const responseText = await response.text();
    let payload = null;

    if (responseText) {
      try {
        payload = JSON.parse(responseText);
      } catch {
        payload = responseText;
      }
    }

    if (!response.ok) {
      const error = new Error(
        `Resend request failed with status ${response.status}${
          payload ? `: ${typeof payload === "string" ? payload : JSON.stringify(payload)}` : ""
        }`
      );
      error.code = "RESEND_SEND_FAILED";
      throw error;
    }

    return payload;
  } finally {
    clearTimeout(timeoutId);
  }
};
const sendEmailWithBrevo = async ({
  apiKey,
  fromAddress,
  fromName,
  toAddress,
  subject,
  html,
  text,
}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: fromName || "RBTChat", email: fromAddress },
        to: [{ email: toAddress }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: controller.signal,
    });

    const responseText = await response.text();
    let payload = null;

    if (responseText) {
      try {
        payload = JSON.parse(responseText);
      } catch {
        payload = responseText;
      }
    }

    if (!response.ok) {
      const error = new Error(
        `Brevo request failed with status ${response.status}${
          payload ? `: ${typeof payload === "string" ? payload : JSON.stringify(payload)}` : ""
        }`
      );
      error.code = "BREVO_SEND_FAILED";
      throw error;
    }

    return payload;
  } finally {
    clearTimeout(timeoutId);
  }
};

const getTenantConfig = async (tenantId) => {
  const normalizedTenantId = String(tenantId || "default").trim() || "default";

  if (normalizedTenantId === "default") {
    return null;
  }

  try {
    return await Tenant.findOne({ tenantId: normalizedTenantId });
  } catch (error) {
    console.error("Unable to load tenant messaging config:", error);
    return null;
  }
};

const normalizePhoneNumber = (value) => {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return "";
  }

  if (/^\+\d{10,15}$/.test(rawValue)) {
    return rawValue;
  }

  const digits = rawValue.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return "";
};

const maskEmail = (value) => {
  const normalizedEmail = String(value || "").trim().toLowerCase();

  if (!emailPattern.test(normalizedEmail)) {
    return normalizedEmail;
  }

  const [localPart, domain] = normalizedEmail.split("@");

  if (localPart.length <= 2) {
    return `${localPart[0] || ""}*@${domain}`;
  }

  return `${localPart.slice(0, 2)}${"*".repeat(
    Math.max(localPart.length - 2, 1)
  )}@${domain}`;
};

const maskPhoneNumber = (value) => {
  const normalizedPhone = normalizePhoneNumber(value);

  if (!normalizedPhone) {
    return "";
  }

  const visibleTail = normalizedPhone.slice(-4);
  const maskedLength = Math.max(normalizedPhone.length - visibleTail.length, 0);

  return `${"*".repeat(maskedLength)}${visibleTail}`;
};

const sendOtpEmail = async (recipient, code) => {
  const email = String(recipient?.email || "").trim().toLowerCase();

  if (!emailPattern.test(email)) {
    return false;
  }

  const tenant = await getTenantConfig(recipient?.tenantId);
  const resendApiKey = String(process.env.RESEND_API_KEY || "").trim();
  const brevoApiKey = String(process.env.BREVO_API_KEY || "").trim();
  const brevoFrom = String(process.env.BREVO_FROM || "").trim();
  const resendFrom = String(process.env.RESEND_FROM || "").trim();
  const emailTransport = String(process.env.EMAIL_TRANSPORT || "auto")
    .trim()
    .toLowerCase();
  const host = tenant?.smtpHost || process.env.SMTP_HOST;
  const port = Number(tenant?.smtpPort || process.env.SMTP_PORT || 587);
  const user = tenant?.smtpUser || process.env.SMTP_USER;
  const pass = tenant?.smtpPass || process.env.SMTP_PASS;
  let fromAddress = tenant?.smtpFrom || process.env.SMTP_FROM || user;
  const emailContent = createOtpEmailContent(code);

  let transporterOptions;
  const hasResendConfig = Boolean(resendApiKey && resendFrom);
  const hasSmtpConfig = Boolean(host && user && pass);
  const gmailUser = String(process.env.GMAIL_USER || "").trim();
  const gmailPass = normalizeGmailAppPassword(process.env.GMAIL_PASS);
  const hasGmailConfig = Boolean(gmailUser && gmailPass);


  const hasBrevoConfig = Boolean(brevoApiKey && brevoFrom);

  if (
    (emailTransport === "auto" || emailTransport === "brevo") &&
    hasBrevoConfig
  ) {
    try {
      await sendEmailWithBrevo({
        apiKey: brevoApiKey,
        fromAddress: brevoFrom,
        fromName: "RBTChat",
        toAddress: email,
        ...emailContent,
      });
      return true;
    } catch (error) {
      console.error("========== OTP EMAIL API ERROR (Brevo) ==========");
      console.error(error);
      console.error("Code:", error.code);
      console.error("Message:", error.message);
      console.error("=========================================");

      if (emailTransport === "brevo") {
        return false;
      }
    }
  }

  if (
    (emailTransport === "auto" || emailTransport === "resend") &&
    hasResendConfig
  ) {
    try {
      await sendEmailWithResend({
        apiKey: resendApiKey,
        fromAddress: resendFrom,
        toAddress: email,
        ...emailContent,
      });
      return true;
    } catch (error) {
      console.error("========== OTP EMAIL API ERROR ==========");
      console.error(error);
      console.error("Code:", error.code);
      console.error("Message:", error.message);
      console.error("=========================================");

      if (emailTransport === "resend") {
        return false;
      }
    }
  }

  if ((emailTransport === "auto" || emailTransport === "smtp") && hasSmtpConfig) {
    transporterOptions = {
      host,
      port,
      secure: port === 465,
      requireTLS: true,
      auth: { user, pass },
    };
  } else if (
    (emailTransport === "auto" || emailTransport === "gmail") &&
    hasGmailConfig
  ) {
    transporterOptions = {
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    };
    fromAddress = process.env.SMTP_FROM || gmailUser;
  }

  if (!transporterOptions) {
    console.warn(
      `[OTP] Email delivery is not configured for ${email}. Transport=${emailTransport}, Resend config present=${hasResendConfig}, SMTP config present=${hasSmtpConfig}, Gmail config present=${hasGmailConfig}`
    );
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      ...transporterOptions,
      connectionTimeout: EMAIL_TIMEOUT_MS,
      greetingTimeout: EMAIL_TIMEOUT_MS,
      socketTimeout: EMAIL_TIMEOUT_MS,
      debug: true,
      logger: true,
    });

    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    return true;
  } catch (error) {
    console.error("========== OTP ERROR ==========");
    console.error(error);
    if (
      ["ETIMEDOUT", "ESOCKET", "ECONNECTION", "ENETUNREACH"].includes(
        String(error.code || "")
      )
    ) {
      console.error(
        "Hint: outbound SMTP is blocked on Render free web services. Use a paid web service or set EMAIL_TRANSPORT=resend with RESEND_API_KEY and RESEND_FROM."
      );
    }
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    console.error("Response:", error.response);
    console.error("Stack:", error.stack);
    console.error("================================");
    return false;
  }
};

const hasEmailOtpConfig = async (recipient) => {
  const tenant = await getTenantConfig(recipient?.tenantId);
  const resendApiKey = String(process.env.RESEND_API_KEY || "").trim();
  const resendFrom = String(process.env.RESEND_FROM || "").trim();
  const host = tenant?.smtpHost || process.env.SMTP_HOST;
  const user = tenant?.smtpUser || process.env.SMTP_USER;
  const pass = tenant?.smtpPass || process.env.SMTP_PASS;
  const gmailUser = String(process.env.GMAIL_USER || "").trim();
  const gmailPass = normalizeGmailAppPassword(process.env.GMAIL_PASS);

  return Boolean(
    (resendApiKey && resendFrom) || (host && user && pass) || (gmailUser && gmailPass)
  );
};

const sendOtpMobile = async (recipient, code) => {
  const phoneNumber = normalizePhoneNumber(recipient?.phoneNumber);
  const tenant = await getTenantConfig(recipient?.tenantId);
  const accountSid = tenant?.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = tenant?.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = tenant?.twilioFrom || process.env.TWILIO_FROM;

  if (!phoneNumber || !accountSid || !authToken || !fromNumber) {
    console.warn(
      `[OTP] Mobile delivery is not configured for ${phoneNumber || recipient?.phoneNumber || "unknown"}.`
    );
    return false;
  }

  try {
    const client = twilio(accountSid, authToken);

    await client.messages.create({
      body: `Your verification code is ${code}.`,
      from: fromNumber,
      to: phoneNumber,
    });

    return true;
  } catch (error) {
    console.error("OTP mobile delivery failed:", error);
    return false;
  }
};

const hasPhoneOtpConfig = async (recipient) => {
  const tenant = await getTenantConfig(recipient?.tenantId);
  const accountSid = tenant?.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = tenant?.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = tenant?.twilioFrom || process.env.TWILIO_FROM;
  const phoneNumber = normalizePhoneNumber(recipient?.phoneNumber);

  return Boolean(phoneNumber && accountSid && authToken && fromNumber);
};

module.exports = {
  createOtp,
  emailPattern,
  hasEmailOtpConfig,
  hasPhoneOtpConfig,
  maskEmail,
  maskPhoneNumber,
  normalizePhoneNumber,
  sendOtpEmail,
  sendOtpMobile,
};
