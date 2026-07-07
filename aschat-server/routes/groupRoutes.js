const express = require("express");
const mongoose = require("mongoose");
const Group = require("../models/Group");
const Message = require("../models/Message");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const groups = await Group.find({ tenantId: req.tenantId, members: req.userId })
      .populate("members", "name")
      .populate("admins", "name")
      .sort({ updatedAt: -1 });

    return res.json({ success: true, groups });
  } catch (error) {
    console.error("List groups error:", error);
    return res.status(500).json({ success: false, message: "Unable to load groups." });
  }
});

router.post("/", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const memberIds = Array.isArray(req.body.members) ? req.body.members : [];

    if (!name) {
      return res.status(400).json({ success: false, message: "Group name is required." });
    }

    const uniqueMembers = Array.from(new Set([req.userId, ...memberIds]));
    const validMembers = await User.find({ _id: { $in: uniqueMembers }, tenantId: req.tenantId }).select("_id");
    const validMemberIds = validMembers.map((member) => member._id.toString());

    if (!validMemberIds.includes(req.userId)) {
      validMemberIds.push(req.userId);
    }

    const group = await Group.create({
      tenantId: req.tenantId,
      name,
      createdBy: req.userId,
      members: validMemberIds,
      admins: [req.userId],
    });

    const populated = await Group.findById(group._id).populate("members", "name").populate("admins", "name");
    return res.status(201).json({ success: true, group: populated });
  } catch (error) {
    console.error("Create group error:", error);
    return res.status(500).json({ success: false, message: "Unable to create group." });
  }
});

router.get("/:groupId/messages", async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.isValidObjectId(groupId)) {
      return res.status(400).json({ success: false, message: "Invalid group." });
    }

    const group = await Group.findOne({ _id: groupId, tenantId: req.tenantId });
    if (!group || !group.members.includes(req.userId)) {
      return res.status(403).json({ success: false, message: "You are not a member of this group." });
    }

    const messages = await Message.find({ group: groupId, tenantId: req.tenantId }).sort({ createdAt: 1 });
    return res.json({ success: true, messages });
  } catch (error) {
    console.error("Load group messages error:", error);
    return res.status(500).json({ success: false, message: "Unable to load group messages." });
  }
});

router.post("/:groupId/messages", async (req, res) => {
  try {
    const { groupId } = req.params;
    const text = String(req.body.text || "").trim();

    if (!mongoose.isValidObjectId(groupId)) {
      return res.status(400).json({ success: false, message: "Invalid group." });
    }

    if (!text || text.length > 2000) {
      return res.status(400).json({ success: false, message: "Message must be between 1 and 2000 characters." });
    }

    const group = await Group.findOne({ _id: groupId, tenantId: req.tenantId });
    if (!group || !group.members.includes(req.userId)) {
      return res.status(403).json({ success: false, message: "You are not a member of this group." });
    }

    const message = await Message.create({
      tenantId: req.tenantId,
      sender: req.userId,
      receiver: group.createdBy,
      group: groupId,
      type: "text",
      text,
    });

    group.lastMessageAt = new Date();
    await group.save();

    return res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("Send group message error:", error);
    return res.status(500).json({ success: false, message: "Unable to send group message." });
  }
});

router.post("/:groupId/members", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!mongoose.isValidObjectId(groupId) || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: "Invalid input." });
    }

    const group = await Group.findOne({ _id: groupId, tenantId: req.tenantId });
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    if (!group.admins.includes(req.userId)) {
      return res.status(403).json({ success: false, message: "Only admins can add members." });
    }

    const memberExists = await User.exists({ _id: userId, tenantId: req.tenantId });
    if (!memberExists) {
      return res.status(404).json({ success: false, message: "User not found or not part of this tenant." });
    }

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }

    return res.json({ success: true, group });
  } catch (error) {
    console.error("Add group member error:", error);
    return res.status(500).json({ success: false, message: "Unable to add member." });
  }
});

router.delete("/:groupId/members/:userId", async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    const group = await Group.findOne({ _id: groupId, tenantId: req.tenantId });
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    if (!group.admins.includes(req.userId)) {
      return res.status(403).json({ success: false, message: "Only admins can remove members." });
    }

    group.members = group.members.filter((memberId) => String(memberId) !== String(userId));
    group.admins = group.admins.filter((adminId) => String(adminId) !== String(userId));
    await group.save();

    return res.json({ success: true, group });
  } catch (error) {
    console.error("Remove group member error:", error);
    return res.status(500).json({ success: false, message: "Unable to remove member." });
  }
});

module.exports = router;
