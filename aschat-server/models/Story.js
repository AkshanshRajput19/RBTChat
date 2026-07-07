const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    trim: true
  },

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  filter: {
    type: String,
    default: "neon",
  },
  caption: {
    type: String,
    trim: true,
    maxlength: 120,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
}, { timestamps: true });

module.exports = mongoose.model("Story", storySchema);
