import React, { useState } from 'react';

function PaymentButton({ amount, planName }) {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        try {
            // 1. Create order
            const response = await fetch('http://localhost:5000/api/payments/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            }); 
            
            const order = await response.json();
            
            // 2. Open Razorpay
            const options = {
                key: 'rzp_test_TCHYStjIcvKx19', // ← PUT YOUR KEY ID HERE!
                amount: order.amount,
                currency: 'INR',
                name: 'RBTChat',
                description: `${planName} Plan`,
                order_id: order.id,
                handler: function(response) {
                    alert('✅ Payment Successful! 🎉');
                },
                theme: { color: '#4f46e5' }
            };
            
            const rzp = new window.Razorpay(options);
            rzp.open();
            
        } catch (error) {
            alert('❌ Payment failed. Try again.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <button 
            className="plan-btn"
            onClick={handlePayment}
            disabled={loading}
        >
            {loading ? '⏳ Processing...' : '💰 Upgrade to ' + planName}
        </button>
    );
}

export default PaymentButton;