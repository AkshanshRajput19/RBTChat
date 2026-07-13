const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Message = require("../models/Message");
const User = require("../models/User");
const { uploadsRoot } = require("../config/uploads");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();
const uploadsDirectory = uploadsRoot;

const getTenantId = (req) => String(req.tenantId || "").trim() || "default";

const tenantScopeQuery = (tenantId) => ({
  $or: [
    { tenantId },
    { tenantId: "default" },
    { tenantId: { $exists: false } },
    { tenantId: null }
  ]
});

const visibleUserQuery = (userId, tenantId) => ({
  _id: userId,
  ...tenantScopeQuery(tenantId)
});

fs.mkdirSync(uploadsDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDirectory,
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${extension}`;

    callback(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    const isAudio = file.mimetype.startsWith("audio/");
    const isVideo = file.mimetype.startsWith("video/");
    const isImage = file.mimetype.startsWith("image/");
    const isDocument =
      file.mimetype.startsWith("application/") ||
      file.mimetype.startsWith("text/") ||
      file.mimetype === "application/octet-stream";

    if (!isAudio && !isVideo && !isImage && !isDocument) {
      return callback(new Error("Only supported image, audio, video, and document files are allowed."));
    }

    return callback(null, true);
  }
});

router.use(authMiddleware);

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const tenantId = getTenantId(req);

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user."
      });
    }

    const receiverUser = await User.findOne(visibleUserQuery(userId, tenantId));
    if (!receiverUser) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    const messages = await Message.find({
      $and: [
        tenantScopeQuery(tenantId),
        {
          $or: [
            { sender: req.userId, receiver: userId },
            { sender: userId, receiver: req.userId }
          ]
        }
      ]
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      {
        $and: [
          tenantScopeQuery(tenantId),
          { sender: userId, receiver: req.userId, read: false }
        ]
      },
      { $set: { read: true } }
    );

    return res.json({ success: true, messages });
  } catch (error) {
    console.error("Load messages error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load messages."
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const receiver = String(req.body.receiver || "");
    const text = String(req.body.text || "").trim();
    const messageType = String(req.body.type || "text");

    if (!mongoose.isValidObjectId(receiver)) {
      return res.status(400).json({
        success: false,
        message: "Invalid receiver."
      });
    }

    if (!text || text.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message must be between 1 and 2000 characters."
      });
    }

    if (!['text', 'location'].includes(messageType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message type."
      });
    }

    if (receiver === req.userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot message yourself."
      });
    }

    const receiverExists = await User.exists(visibleUserQuery(receiver, tenantId));

    if (!receiverExists) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    const message = await Message.create({
      tenantId,
      sender: req.userId,
      receiver,
      type: messageType,
      text
    });

    return res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to send message."
    });
  }
});

router.post("/media", upload.single("media"), async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const receiver = String(req.body.receiver || "");
    const mediaType = String(req.body.mediaType || "");

    if (!mongoose.isValidObjectId(receiver) || receiver === req.userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid receiver."
      });
    }

    if (!["voice", "video", "image", "document"].includes(mediaType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid media message type."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Choose a file to share."
      });
    }

    const mimeMatchesType =
      (mediaType === "voice" && req.file.mimetype.startsWith("audio/")) ||
      (mediaType === "video" && req.file.mimetype.startsWith("video/")) ||
      (mediaType === "image" && req.file.mimetype.startsWith("image/")) ||
      (mediaType === "document" && (
        req.file.mimetype.startsWith("application/") ||
        req.file.mimetype.startsWith("text/") ||
        req.file.mimetype === "application/octet-stream"
      ));

    if (!mimeMatchesType) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        success: false,
        message: `The selected file is not a valid ${mediaType} file.`
      });
    }

    const receiverExists = await User.exists(visibleUserQuery(receiver, tenantId));

    if (!receiverExists) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    const message = await Message.create({
      tenantId,
      sender: req.userId,
      receiver,
      type: mediaType,
      mediaUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size
    });

    return res.status(201).json({ success: true, message });
  } catch (error) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }

    console.error("Send media message error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to send media message."
    });
  }
});

router.delete("/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const scope = String(req.query.scope || "me");
    const tenantId = getTenantId(req);

    if (!mongoose.isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message."
      });
    }

    if (!['me', 'all'].includes(scope)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delete scope."
      });
    }

    const message = await Message.findOne({
      $and: [{ _id: messageId }, tenantScopeQuery(tenantId)]
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found."
      });
    }

    const currentUserId = req.userId;
    const isSender = String(message.sender) === currentUserId;
    const isReceiver = String(message.receiver) === currentUserId;

    if (!isSender && !isReceiver) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete this message."
      });
    }

    if (scope === "all") {
      if (!isSender) {
        return res.status(403).json({
          success: false,
          message: "Only the sender can delete a message for everyone."
        });
      }

      message.deletedForEveryone = true;
      message.deletedFor = [message.sender, message.receiver];
    } else {
      const deletedFor = new Set(message.deletedFor || []);
      deletedFor.add(currentUserId);
      message.deletedFor = Array.from(deletedFor);
    }

    await message.save();
    return res.json({ success: true, message });
  } catch (error) {
    console.error("Delete message error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete message."
    });
  }
});

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "Media files must be smaller than 25 MB."
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Media upload failed."
    });
  }

  return next();
});

module.exports = router;
