const path = require("path");

const uploadsRoot = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, "..", "uploads");

const storiesUploadsDirectory = path.join(uploadsRoot, "stories");

module.exports = {
  uploadsRoot,
  storiesUploadsDirectory,
};
