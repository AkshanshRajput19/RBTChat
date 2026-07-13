const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');

// Your Razorpay keys from .env
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create payment order
router.post('/create-order', async (req, res) => {
    try {
        const { amount } = req.body;
        
        const options = {
            amount: amount * 100, // ₹29 = 2900 paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };
        
        const order = await razorpay.orders.create(options);
        res.json(order);
        
    } catch (error) {
        console.error('Razorpay error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;