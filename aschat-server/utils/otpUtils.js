const nodemailer = require("nodemailer");
const twilio = require("twilio");
const Tenant = require("../models/Tenant");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const normalizeGmailAppPassword = (value) =>
  String(value || "")
    .replace(/\s+/g, "")
    .trim();

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
  const host = tenant?.smtpHost || process.env.SMTP_HOST;
  const port = Number(tenant?.smtpPort || process.env.SMTP_PORT || 587);
  const user = tenant?.smtpUser || process.env.SMTP_USER;
  const pass = tenant?.smtpPass || process.env.SMTP_PASS;
  let fromAddress = tenant?.smtpFrom || process.env.SMTP_FROM || user;

  let transporterOptions;
  const hasSmtpConfig = Boolean(host && user && pass);
  const gmailUser = String(process.env.GMAIL_USER || "").trim();
  const gmailPass = normalizeGmailAppPassword(process.env.GMAIL_PASS);
  const hasGmailConfig = Boolean(gmailUser && gmailPass);

  if (hasSmtpConfig) {
    transporterOptions = {
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    };
  } else if (hasGmailConfig) {
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
      `[OTP] Email delivery is not configured for ${email}. SMTP config present=${hasSmtpConfig}, Gmail config present=${hasGmailConfig}`
    );
    return false;
  }

  try {
    const transporter = nodemailer.createTransport(transporterOptions);

    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: "RBTChat Verification Code",
      html: `<p>Your verification code is <strong>${code}</strong>.</p><p>This code expires in 10 minutes.</p>`,
    });

    return true;
  } catch (error) {
    console.error(
      "OTP email delivery failed:",
      error?.response || error?.message || error
    );
    return false;
  }
};

const hasEmailOtpConfig = async (recipient) => {
  const tenant = await getTenantConfig(recipient?.tenantId);
  const host = tenant?.smtpHost || process.env.SMTP_HOST;
  const user = tenant?.smtpUser || process.env.SMTP_USER;
  const pass = tenant?.smtpPass || process.env.SMTP_PASS;
  const gmailUser = String(process.env.GMAIL_USER || "").trim();
  const gmailPass = normalizeGmailAppPassword(process.env.GMAIL_PASS);

  return Boolean((host && user && pass) || (gmailUser && gmailPass));
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
