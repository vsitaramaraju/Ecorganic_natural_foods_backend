const crypto = require("crypto");

// Minimal Razorpay REST client (https://razorpay.com/docs/api/).
// Needs RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env (test keys start with "rzp_test_").
// RAZORPAY_API_BASE can point somewhere else for local testing.

const apiBase = () => process.env.RAZORPAY_API_BASE || "https://api.razorpay.com/v1";

const isRazorpayConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

class RazorpayError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = "RazorpayError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(method, path, body) {
  if (!isRazorpayConfigured()) {
    throw new RazorpayError("Online payments are not configured on the server.", { status: 503 });
  }
  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString("base64");

  let res;
  try {
    res = await fetch(apiBase() + path, {
      method,
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000)
    });
  } catch (error) {
    throw new RazorpayError(`Could not reach Razorpay: ${error.message}`, { status: 502 });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new RazorpayError(
      data?.error?.description || `Razorpay request failed (HTTP ${res.status})`,
      { status: res.status, code: data?.error?.code, details: data?.error }
    );
  }
  return data;
}

// Amounts are in paise (₹1 = 100).
const toPaise = rupees => Math.round(Number(rupees) * 100);

const createRazorpayOrder = ({ amountPaise, receipt, notes }) =>
  request("POST", "/orders", { amount: amountPaise, currency: "INR", receipt, notes });

const fetchRazorpayOrder = id => request("GET", `/orders/${encodeURIComponent(id)}`);

const fetchPayment = id => request("GET", `/payments/${encodeURIComponent(id)}`);

const capturePayment = (id, amountPaise) =>
  request("POST", `/payments/${encodeURIComponent(id)}/capture`, {
    amount: amountPaise,
    currency: "INR"
  });

const refundPayment = (paymentId, amountPaise, notes) =>
  request("POST", `/payments/${encodeURIComponent(paymentId)}/refund`, {
    amount: amountPaise,
    speed: "normal",
    notes
  });

const fetchRefund = id => request("GET", `/refunds/${encodeURIComponent(id)}`);

// Checks the signature Razorpay Checkout returns after a successful payment.
const isValidPaymentSignature = (razorpayOrderId, razorpayPaymentId, signature) => {
  if (!razorpayOrderId || !razorpayPaymentId || typeof signature !== "string") return false;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// Razorpay refund status -> our paymentStatus.
const refundStatusToPaymentStatus = refundStatus =>
  refundStatus === "processed" ? "REFUNDED" : "REFUND_PENDING";

module.exports = {
  RazorpayError,
  isRazorpayConfigured,
  toPaise,
  createRazorpayOrder,
  fetchRazorpayOrder,
  fetchPayment,
  capturePayment,
  refundPayment,
  fetchRefund,
  isValidPaymentSignature,
  refundStatusToPaymentStatus
};
