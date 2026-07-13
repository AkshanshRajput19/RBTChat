import React, { useState } from "react";

function PaymentButton({ amount, planName }) {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);

        try {
            // Create order using deployed backend
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/payments/create-order`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ amount }),
                }
            );

            const order = await response.json();

            const options = {
                key: "rzp_test_TCHYStjIcvKx19",
                amount: order.amount,
                currency: "INR",
                name: "RBTChat",
                description: `${planName} Plan`,
                order_id: order.id,
                handler: function () {
                    alert("✅ Payment Successful!");
                },
                theme: {
                    color: "#4f46e5",
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error(error);
            alert("❌ Payment failed. Try again.");
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
            {loading ? "⏳ Processing..." : "💰 Upgrade to " + planName}
        </button>
    );
}

export default PaymentButton;