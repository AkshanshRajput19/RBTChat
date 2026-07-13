const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Story = require("../models/Story");
const { storiesUploadsDirectory } = require("../config/uploads");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

const uploadsDirectory = storiesUploadsDirectory;
fs.mkdirSync(uploadsDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDirectory,
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      return callback(new Error("Only image files are supported for stories."));
    }
    callback(null, true);
  },
});

router.get("/", async (req, res) => {
  try {
    const stories = await Story.find({ tenantId: req.tenantId, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    return res.json({ success: true, stories });
  } catch (error) {
    console.error("List stories error:", error);
    return res.status(500).json({ success: false, message: "Unable to load stories." });
  }
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Choose an image for your story." });
    }

    const story = await Story.create({
      tenantId: req.tenantId,
      sender: req.userId,
      imageUrl: `/uploads/stories/${req.file.filename}`,
      filter: String(req.body.filter || "neon"),
      caption: String(req.body.caption || "").trim(),
    });

    return res.status(201).json({ success: true, story });
  } catch (error) {
    console.error("Create story error:", error);
    return res.status(500).json({ success: false, message: "Unable to create story." });
  }
});

router.use((error, req, res, next) => {
  if (error) {
    return res.status(400).json({ success: false, message: error.message || "Story upload failed." });
  }
  return next();
});

module.exports = router;
