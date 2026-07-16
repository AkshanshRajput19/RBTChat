const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

[".env.local", ".env"].forEach((fileName) => {
  const filePath = path.join(__dirname, fileName);
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath });
  }
});
const express = require("express");
const cors = require("cors");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const groupRoutes = require("./routes/groupRoutes");
const storyRoutes = require("./routes/storyRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();
const httpServer = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET || "rbtchat-local-development-secret";

connectDB();

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/payments", require("./routes/paymentRoutes"));
// ===== ANALYTICS ROUTES =====
try {
  app.use("/api/analytics", require("./routes/analytics"));
  console.log("✅ Analytics routes loaded");
} catch (err) {
  console.log("⚠️ Analytics routes not found:", err.message);
}

app.get("/", (req, res) => {
  res.send("RBTChat Backend Running Successfully....");
});

app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Backend Connected Successfully" });
});

const io = new Server(httpServer, { cors: { origin: CLIENT_URL } });
const onlineUsers = new Map();

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch {
    next(new Error("Unauthorized socket connection"));
  }
});

io.on("connection", (socket) => {
  const userId = String(socket.userId);
  socket.join(`user:${userId}`);

  const connectionCount = onlineUsers.get(userId) || 0;
  onlineUsers.set(userId, connectionCount + 1);
  io.emit("online-users", Array.from(onlineUsers.keys()));

  socket.on("get-online-users", () => {
    socket.emit("online-users", Array.from(onlineUsers.keys()));
  });

  const sendToUser = (eventName, data = {}) => {
    const { to, ...callData } = data;
    if (!to) return;
    io.to(`user:${to}`).emit(eventName, { ...callData, from: userId });
  };

  socket.on("call-user", (data) => {
    if (!onlineUsers.has(String(data.to))) {
      socket.emit("user-unavailable", { userId: data.to });
      return;
    }
    sendToUser("incoming-call", data);
  });

  socket.on("accept-call", (data) => sendToUser("call-accepted", data));
  socket.on("reject-call", (data) => sendToUser("call-rejected", data));
  socket.on("webrtc-offer", (data) => sendToUser("webrtc-offer", data));
  socket.on("webrtc-answer", (data) => sendToUser("webrtc-answer", data));
  socket.on("ice-candidate", (data) => sendToUser("ice-candidate", data));
  socket.on("end-call", (data) => sendToUser("call-ended", data));

  socket.on("disconnect", () => {
    const remaining = (onlineUsers.get(userId) || 1) - 1;
    if (remaining <= 0) onlineUsers.delete(userId);
    else onlineUsers.set(userId, remaining);
    io.emit("online-users", Array.from(onlineUsers.keys()));
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server Running On Port ${PORT}`);
});
