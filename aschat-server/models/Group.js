const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    trim: true
  },

  name: {
    type: String,
    trim: true,
    required: true,
    maxlength: 60,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model("Group", groupSchema);
