const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  permissions: {
    type: [String],
    default: []
  }
});

const tenantSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  subdomain: {
    type: String,
    trim: true,
    default: ""
  },
  customDomain: {
    type: String,
    trim: true,
    default: ""
  },
  smtpHost: {
    type: String,
    trim: true,
    default: ""
  },
  smtpPort: {
    type: Number,
    default: 587
  },
  smtpUser: {
    type: String,
    trim: true,
    default: ""
  },
  smtpPass: {
    type: String,
    trim: true,
    default: ""
  },
  smtpFrom: {
    type: String,
    trim: true,
    default: ""
  },
  twilioAccountSid: {
    type: String,
    trim: true,
    default: ""
  },
  twilioAuthToken: {
    type: String,
    trim: true,
    default: ""
  },
  twilioFrom: {
    type: String,
    trim: true,
    default: ""
  },
  roles: {
    type: [roleSchema],
    default: [
      { name: "admin", permissions: ["*"] },
      { name: "manager", permissions: ["read", "write", "manage-groups", "manage-users"] },
      { name: "user", permissions: ["read", "write"] },
      { name: "viewer", permissions: ["read"] }
    ]
  }
}, { timestamps: true });

module.exports = mongoose.model("Tenant", tenantSchema);
