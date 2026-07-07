const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const twilio = require("twilio");
const User = require("../models/User");
const Tenant = require("../models/Tenant");

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const loginAttempts = new Map();
const otpLoginEnabled = process.env.OTP_LOGIN_ENABLED !== "false";

const createOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const getClientKey = (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
    return req.ip || "unknown";
};

const rateLimitAuth = (req, res, next) => {
    const key = getClientKey(req);
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;
    const maxRequests = 8;

    const attempts = loginAttempts.get(key) || [];
    const recent = attempts.filter((timestamp) => timestamp > now - windowMs);

    if (recent.length >= maxRequests) {
        return res.status(429).json({
            success: false,
            message: "Too many login attempts. Please try again in a few minutes."
        });
    }

    recent.push(now);
    loginAttempts.set(key, recent);
    next();
};

const createToken = (userId, role, tenantId) => {
    const secret = process.env.JWT_SECRET || "rbtchat-local-development-secret";

    if (!process.env.JWT_SECRET) {
        console.warn("Warning: JWT_SECRET is not set. Using development secret.");
    }

    return jwt.sign({ userId, role, tenantId }, secret, { expiresIn: "7d" });
};

const sendOtpEmail = async (userDoc, code) => {
    const tenant = await Tenant.findOne({ tenantId: userDoc.tenantId });
    const host = tenant?.smtpHost || process.env.SMTP_HOST;
    const port = Number(tenant?.smtpPort || process.env.SMTP_PORT || 587);
    const user = tenant?.smtpUser || process.env.SMTP_USER;
    const pass = tenant?.smtpPass || process.env.SMTP_PASS;
    let fromAddress = tenant?.smtpFrom || process.env.SMTP_FROM || user;

    let transporterOptions;
    const hasSmtpConfig = Boolean(host && user && pass);
    const gmailUser = String(process.env.GMAIL_USER || "").trim();
    const gmailPass = String(process.env.GMAIL_PASS || "").trim();
    const hasGmailConfig = Boolean(gmailUser && gmailPass);

    if (hasSmtpConfig) {
        transporterOptions = {
            host,
            port,
            secure: port === 465,
            auth: { user, pass }
        };
    } else if (hasGmailConfig) {
        transporterOptions = {
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: gmailUser,
                pass: gmailPass
            }
        };
        fromAddress = process.env.SMTP_FROM || gmailUser;
    }

    if (!transporterOptions) {
        console.warn(`[2FA] SMTP not configured for ${userDoc.email}. SMTP config present=${hasSmtpConfig}, Gmail config present=${hasGmailConfig}`);
        return false;
    }

    try {
        const transporter = nodemailer.createTransport(transporterOptions);

        await transporter.sendMail({
            from: fromAddress,
            to: userDoc.email,
            subject: "RBTChat Verification Code",
            html: `<p>Your verification code is <strong>${code}</strong>.</p><p>This code expires in 10 minutes.</p>`
        });

        return true;
    } catch (error) {
        console.error("OTP email delivery failed:", error?.response || error?.message || error);
        return false;
    }
};

const sendOtpMobile = async (userDoc, code) => {
    const tenant = await Tenant.findOne({ tenantId: userDoc.tenantId });
    const accountSid = tenant?.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID;
    const authToken = tenant?.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = tenant?.twilioFrom || process.env.TWILIO_FROM;

    if (!userDoc.phoneNumber || !accountSid || !authToken || !fromNumber) {
        console.warn(`[2FA] Mobile OTP provider not configured. Mobile OTP for ${userDoc.phoneNumber}: ${code}`);
        return false;
    }

    try {
        const client = twilio(accountSid, authToken);
        await client.messages.create({
            body: `Your verification code is ${code}.`,
            from: fromNumber,
            to: userDoc.phoneNumber
        });
        return true;
    } catch (error) {
        console.error("OTP mobile delivery failed:", error);
        return false;
    }
};

router.post("/register", async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");
        const phoneNumber = String(req.body.phoneNumber || "").trim();

        if (name.length < 2 || name.length > 50) {
            return res.status(400).json({
                success: false,
                message: "Name must be between 2 and 50 characters."
            });
        }

        if (!emailPattern.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        const tenantId = req.body.tenantId ? String(req.body.tenantId).trim() : "default";
        const tenant = tenantId === "default" ? null : await Tenant.findOne({ tenantId });
        if (tenantId !== "default" && !tenant) {
            return res.status(400).json({
                success: false,
                message: "Invalid tenant ID."
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({
            name,
            email,
            password: passwordHash,
            phoneNumber: phoneNumber || "",
            tenantId,
            twoFactorEnabled: false
        });

        return res.status(201).json({
            success: true,
            message: "Account created successfully.",
            token: createToken(user._id.toString(), user.role, user.tenantId),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId
            }
        });
 
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        console.error("Register error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to create account right now."
        });
    }
});

router.post("/login", rateLimitAuth, async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        if (!emailPattern.test(email) || !password) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid email and password."
            });
        }

        const user = await User.findOne({ email }).select("+password +otpCode +otpExpiresAt");

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                success: false,
                message: "Email or password is incorrect."
            });
        }

        const otpEnabledForUser = otpLoginEnabled || user.twoFactorEnabled;

        if (!otpEnabledForUser) {
            return res.json({
                success: true,
                message: "Login successful.",
                token: createToken(user._id.toString(), user.role, user.tenantId),
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    tenantId: user.tenantId
                }
            });
        }

        const otp = createOtp();
        user.otpCode = otp;
        user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        const emailSent = await sendOtpEmail(user, otp);
        const mobileSent = await sendOtpMobile(user, otp);

        return res.json({
            success: true,
            requiresTwoFactor: true,
            message: emailSent
                ? "A verification code has been sent to your email."
                : "A verification code was prepared. Check the server console because email delivery is not configured yet.",
            mobileConfigured: Boolean(user.phoneNumber) && mobileSent
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to log in right now."
        });
    }
});

router.post("/verify-otp", rateLimitAuth, async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const otp = String(req.body.otp || "").trim();

        if (!emailPattern.test(email) || !otp) {
            return res.status(400).json({
                success: false,
                message: "Provide a valid email and verification code."
            });
        }

        const user = await User.findOne({ email }).select("+otpCode +otpExpiresAt");

        if (!user || !user.otpCode || !user.otpExpiresAt) {
            return res.status(401).json({
                success: false,
                message: "No verification code is pending."
            });
        }

        if (user.otpExpiresAt < new Date()) {
            user.otpCode = undefined;
            user.otpExpiresAt = undefined;
            await user.save();
            return res.status(401).json({
                success: false,
                message: "The verification code has expired."
            });
        }

        if (user.otpCode !== otp) {
            return res.status(401).json({
                success: false,
                message: "The verification code is incorrect."
            });
        }

        user.otpCode = undefined;
        user.otpExpiresAt = undefined;
        await user.save();

        return res.json({
        success: true,
        message: "Two-factor verification successful.",
        token: createToken(user._id.toString(), user.role, user.tenantId),
        user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
    }
});
    } catch (error) {
        console.error("OTP verify error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to verify the code right now."
        });
    }
});

router.post("/2fa/enable", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const enable = Boolean(req.body.enable);
        const phoneNumber = String(req.body.phoneNumber || "").trim();

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        user.twoFactorEnabled = enable;
        user.phoneNumber = phoneNumber;
        await user.save();

        return res.json({
            success: true,
            twoFactorEnabled: user.twoFactorEnabled,
            phoneNumber: user.phoneNumber || null
        });
    } catch (error) {
        console.error("2FA enable error:", error);
        return res.status(500).json({ success: false, message: "Unable to update 2FA." });
    }
});

router.get("/users", authMiddleware, async (req, res) => {
    const users = await User.find({ tenantId: req.tenantId }).select("name email role tenantId");

    res.json({
        success: true,
        users: users
    });
});

module.exports = router;
