const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 4,
        maxlength: 50
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true,
        select: false
    },

    twoFactorEnabled: {
        type: Boolean,
        default: false
    },

    phoneNumber: {
        type: String,
        trim: true,
        default: ""
    },

    tenantId: {
        type: String,
        required: true,
        trim: true,
        default: "default"
    },

    role: {
        type: String,
        enum: ["user", "admin", "manager", "viewer"],
        default: "user"
    },

    otpCode: {
        type: String,
        select: false
    },

    otpExpiresAt: {
        type: Date,
        select: false
    }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);

