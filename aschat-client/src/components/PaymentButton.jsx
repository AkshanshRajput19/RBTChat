import React, { useState } from "react";

function PaymentButton({ amount, planName }) {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);

        try {
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

            if (!response.ok) {
                throw new Error("Failed to create order");
            }

            const order = await response.json();

            if (!order.id) {
                throw new Error(order.message || "Order creation failed");
            }

            const options = {
                key: "rzp_test_TCHYStjIcvKx19",
                amount: order.amount,
                currency: "INR",
                name: "RBTChat",
                description: `${planName} Plan`,
                order_id: order.id,

                handler: function (response) {
                    console.log(response);
                    alert("✅ Payment Successful!");
                },

                theme: {
                    color: "#4f46e5",
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("Payment Error:", err);
            alert("❌ Payment failed. " + err.message);
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
            {loading ? "⏳ Processing..." : `💰 Upgrade to ${planName}`}
        </button>
    );
}

export default PaymentButton;