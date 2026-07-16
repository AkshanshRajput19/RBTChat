const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    trim: true
  },

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function requireReceiver() {
      return !this.group;
    }
  },

  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: function requireGroup() {
      return this.type === "text" && this.receiver == null;
    }
  },

  type: {
    type: String,
    enum: ["text", "voice", "video", "image", "document", "location", "sticker", "gif"],
    default: "text",
    required: true
  },

  text: {
    type: String,
    trim: true,
    maxlength: 2000,
    required: function requireText() {
      return ["text", "location", "sticker", "gif"].includes(this.type);
    }
  },

  mediaUrl: {
    type: String,
    required: function requireMedia() {
      return ["voice", "video", "image", "document"].includes(this.type);
    }
  },

  fileName: {
    type: String,
    trim: true
  },

  mimeType: {
    type: String,
    trim: true
  },

  fileSize: {
    type: Number,
    min: 0
  },

  read: {
    type: Boolean,
    default: false
  },

  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  deletedForEveryone: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
