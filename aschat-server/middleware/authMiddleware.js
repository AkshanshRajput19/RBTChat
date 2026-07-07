const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      success: false,
      message: "Please log in."
    });
  }

  const token = authorization.split(" ")[1];
  const secret =
    process.env.JWT_SECRET || "rbtchat-local-development-secret";

  try {
    const decoded = jwt.verify(token, secret);

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.tenantId = decoded.tenantId;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired login."
    });
  }
};

const requireRole = (role) => (req, res, next) => {
  const roleLevels = {
    viewer: 1,
    user: 2,
    manager: 3,
    admin: 4
  };

  const requiredLevel = roleLevels[role];
  const userLevel = roleLevels[req.userRole];

  if (!requiredLevel || !userLevel || userLevel < requiredLevel) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: insufficient role privileges."
    });
  }

  next();
};

const requirePermission = (permission) => async (req, res, next) => {
  const Tenant = require("../models/Tenant");
  const tenant = await Tenant.findOne({ tenantId: req.tenantId });

  if (!tenant) {
    return res.status(403).json({
      success: false,
      message: "Tenant not found."
    });
  }

  const roleConfig = tenant.roles.find((role) => role.name === req.userRole);
  const permissions = roleConfig ? roleConfig.permissions : [];

  if (!permissions.includes("*") && !permissions.includes(permission)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: insufficient permission."
    });
  }

  next();
};

module.exports = { authMiddleware, requireRole, requirePermission };