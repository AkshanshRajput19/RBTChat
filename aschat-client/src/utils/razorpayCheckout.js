import api from "../api";

const RAZORPAY_KEY_ID =
  import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TCHYStjIcvKx19";

export const openRazorpayCheckout = async ({
  orderPayload,
  description,
  prefill,
  notes,
  themeColor = "#d1c9be",
  name = "RBTChat",
  onSuccess,
  onDismiss,
  onFailure,
}) => {
  if (!window.Razorpay) {
    throw new Error("Razorpay is not available right now.");
  }

  const response = await api.post("/payments/create-order", orderPayload);
  const order = response.data;

  if (!order?.id) {
    throw new Error("Unable to create the payment order.");
  }

  const options = {
    key: RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: "INR",
    name,
    description,
    order_id: order.id,
    prefill,
    notes,
    theme: {
      color: themeColor,
    },
    modal: {
      ondismiss: () => {
        onDismiss?.();
      },
    },
    handler: async (paymentResponse) => {
      try {
        await onSuccess?.(paymentResponse, order);
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Payment verification failed.";

        onFailure?.(message, error, order);
      }
    },
  };

  const razorpayInstance = new window.Razorpay(options);

  razorpayInstance.on("payment.failed", (event) => {
    const message =
      event?.error?.description || "Payment failed. Please try again.";

    onFailure?.(message, event, order);
  });

  razorpayInstance.open();
  return order;
};

export const verifyRazorpayPayment = async ({
  orderId,
  paymentId,
  signature,
}) => {
  const response = await api.post("/payments/verify-payment", {
    orderId,
    paymentId,
    signature,
  });

  return response.data;
};
