import { useState } from "react";
import { recordWorkspacePlanPayment } from "./subscriptionManagementStore";
import {
  openRazorpayCheckout,
  verifyRazorpayPayment,
} from "../utils/razorpayCheckout";

const getSessionUser = () => {
  try {
    const session = JSON.parse(window.localStorage.getItem("rbtchatSession"));
    return session?.user || null;
  } catch {
    return null;
  }
};

function PaymentButton({ amount, planName, billingCycle = "monthly" }) {
  const [loading, setLoading] = useState(false);
  const normalizedAmount = planName === "Free" ? 0 : Number(amount) || 0;

  const handlePayment = async () => {
    setLoading(true);

    try {
      const sessionUser = getSessionUser();

      if (normalizedAmount <= 0) {
        recordWorkspacePlanPayment({
          planName,
          amount: 0,
          billingCycle,
          customerName: sessionUser?.name,
          customerEmail: sessionUser?.email,
          businessName: "RBTChat Workspace",
        });
        setLoading(false);
        window.alert("Free plan activated successfully.");
        return;
      }

      await openRazorpayCheckout({
        orderPayload: {
          amount: normalizedAmount,
          source: "dashboard",
          planName,
          billingCycle,
          businessName: "RBTChat Workspace",
        },
        description: `${planName} plan`,
        themeColor: "#4f46e5",
        onSuccess: async (paymentResponse, order) => {
          await verifyRazorpayPayment({
            orderId: order.id,
            paymentId: paymentResponse?.razorpay_payment_id,
            signature: paymentResponse?.razorpay_signature,
          });

          recordWorkspacePlanPayment({
            planName,
            amount: normalizedAmount,
            billingCycle,
            customerName: sessionUser?.name,
            customerEmail: sessionUser?.email,
            businessName: "RBTChat Workspace",
            paymentId: paymentResponse?.razorpay_payment_id,
            orderId: order.id,
          });
          setLoading(false);
          window.alert("Payment successful.");
        },
        onDismiss: () => {
          setLoading(false);
        },
        onFailure: (message) => {
          setLoading(false);
          window.alert(`Payment failed. ${message}`);
        },
      });
    } catch (error) {
      setLoading(false);
      console.error("Payment Error:", error);
      window.alert(`Payment failed. ${error.message}`);
    }
  };

  return (
    <button className="plan-btn" onClick={handlePayment} disabled={loading}>
      {loading
        ? "Processing..."
        : normalizedAmount <= 0
          ? "Activate Free"
          : `Upgrade to ${planName}`}
    </button>
  );
}

export default PaymentButton;
