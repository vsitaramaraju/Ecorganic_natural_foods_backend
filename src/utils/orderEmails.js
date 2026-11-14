const { Resend } = require("resend");
const prisma = require("./prisma");
const { parsePriceUnit } = require("./priceUnit");

// Order emails sent to the customer:
//   "confirmed"        - right after an order is placed (orders are auto-confirmed)
//   "shipped"          - when an admin hands the parcel to a courier (with tracking)
//   "outForDelivery"   - when an admin sets the order to OUT_FOR_DELIVERY
// They are sent after the API has responded and never throw, so an email problem
// can't block or fail an order. Failures are only logged.

const STORE_NAME = "EcOrganic Natural Foods";
const STORE_PHONE = "+91 9182536959";
const BRAND = { dark: "#1b4332", main: "#2d6a4f", light: "#d8f3dc", muted: "#5a7a5a", line: "#d5e8d7" };

const PAYMENT_METHOD_TEXT = {
  COD: "Cash on Delivery",
  RAZORPAY: "Paid online (Razorpay)",
  UPI: "UPI",
  CARD: "Card",
  NETBANKING: "Net Banking"
};

let resendClient = null;
const getResend = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key || key.startsWith("re_your_")) return null; // not configured
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
};

const fromAddress = () =>
  process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

const siteUrl = () => (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

// Customer-entered text (names, addresses, product names) goes into HTML: escape it.
const esc = value =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const rupees = amount => {
  const n = Math.round(Number(amount || 0) * 100) / 100;
  return `₹${Number.isInteger(n) ? n : n.toFixed(2)}`;
};

const formatDate = date =>
  new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

const packLabel = priceUnit => {
  const parsed = parsePriceUnit(priceUnit);
  return parsed ? `${parsed.value}${parsed.unit} pack` : "";
};

const firstName = name => String(name || "").trim().split(/\s+/)[0] || "there";

const addressBlock = address =>
  address
    ? [
        `<strong>${esc(address.name)}</strong>`,
        esc(address.street),
        `${esc(address.city)}, ${esc(address.state)} ${esc(address.pincode)}`,
        address.phone ? `📞 ${esc(address.phone)}` : ""
      ]
        .filter(Boolean)
        .join("<br/>")
    : "—";

const itemsTable = items => {
  const rows = items
    .map(item => {
      const pack = packLabel(item.product?.priceUnit);
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${BRAND.line};font-size:14px;color:#1a2e1a;">
            ${esc(item.product?.name || "Product")}
            ${pack ? `<div style="font-size:12px;color:${BRAND.muted};">${esc(pack)}</div>` : ""}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};font-size:14px;color:#1a2e1a;text-align:center;">× ${item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid ${BRAND.line};font-size:14px;color:#1a2e1a;text-align:right;white-space:nowrap;">${rupees(item.price * item.quantity)}</td>
        </tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${rows}</table>`;
};

const totalRow = (label, value, { bold = false, color = BRAND.muted } = {}) => `
  <tr>
    <td style="padding:4px 0;font-size:${bold ? 16 : 14}px;color:${bold ? BRAND.dark : color};${bold ? "font-weight:700;" : ""}">${label}</td>
    <td style="padding:4px 0;font-size:${bold ? 16 : 14}px;color:${bold ? BRAND.dark : color};text-align:right;${bold ? "font-weight:700;" : ""}">${value}</td>
  </tr>`;

const totalsTable = order => {
  const subtotal =
    Number(order.subtotalAmount) ||
    order.items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);
  const delivery = Number(order.deliveryFee || 0);
  const discount = Number(order.discountAmount || 0);
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:12px;">
      ${totalRow("Subtotal", rupees(subtotal))}
      ${totalRow("Delivery", delivery > 0 ? rupees(delivery) : "FREE")}
      ${discount > 0 ? totalRow(`Discount${order.couponCode ? ` (${esc(order.couponCode)})` : ""}`, `−${rupees(discount)}`, { color: "#059669" }) : ""}
      <tr><td colspan="2" style="border-top:2px solid ${BRAND.main};padding-top:6px;"></td></tr>
      ${totalRow("Total", rupees(order.totalAmount), { bold: true })}
    </table>`;
};

const button = (href, label) => `
  <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px auto 8px;">
    <tr><td style="border-radius:8px;background:${BRAND.main};">
      <a href="${esc(href)}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;border-radius:8px;">${label}</a>
    </td></tr>
  </table>`;

// Shared outer layout: header, white card, footer. Table-based for email clients.
const layout = ({ preheader, heading, intro, body }) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:#f0f4f0;font-family:'Segoe UI',Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0f4f0;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;">
        <tr><td style="background:${BRAND.dark};border-radius:12px 12px 0 0;padding:22px 28px;">
          <div style="font-size:22px;font-weight:700;color:#ffffff;">🌿 ${STORE_NAME}</div>
          <div style="font-size:13px;color:${BRAND.light};margin-top:2px;">Farm fresh organic produce</div>
        </td></tr>
        <tr><td style="background:#ffffff;padding:28px;border-radius:0 0 12px 12px;">
          <h1 style="margin:0 0 8px;font-size:22px;color:${BRAND.dark};">${heading}</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#33473a;">${intro}</p>
          ${body}
          <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:${BRAND.muted};">
            Questions about your order? Just reply to this email or call us on ${STORE_PHONE}.
          </p>
        </td></tr>
        <tr><td style="padding:18px 12px;text-align:center;font-size:12px;color:#8fab8f;">
          © ${new Date().getFullYear()} ${STORE_NAME}. Eat clean, live green.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

const infoBox = (title, html) => `
  <td valign="top" style="padding:14px;background:#f6faf6;border:1px solid ${BRAND.line};border-radius:8px;width:50%;">
    <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${BRAND.muted};margin-bottom:6px;">${title}</div>
    <div style="font-size:14px;line-height:1.6;color:#1a2e1a;">${html}</div>
  </td>`;

const paymentText = order => {
  const method = PAYMENT_METHOD_TEXT[order.paymentMethod] || esc(order.paymentMethod);
  const paid = order.paymentStatus === "PAID";
  return `${method}<br/><span style="color:${paid ? "#059669" : BRAND.muted};">${paid ? "✔ Paid" : "Pay on delivery"}</span>`;
};

function orderConfirmationEmail(order) {
  const subject = `Order #${order.id} confirmed – ${STORE_NAME}`;
  const html = layout({
    preheader: `Thanks for your order! Order #${order.id} for ${rupees(order.totalAmount)} is confirmed.`,
    heading: `Thank you for your order, ${esc(firstName(order.user?.name))}! 🎉`,
    intro: `Your order <strong>#${order.id}</strong> placed on ${formatDate(order.createdAt)} is confirmed. We're picking the freshest produce for you and will email you again when it's out for delivery.`,
    body: `
      <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:${BRAND.muted};margin-bottom:4px;">Order summary</div>
      ${itemsTable(order.items)}
      ${totalsTable(order)}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;border-collapse:separate;border-spacing:8px 0;">
        <tr>${infoBox("Delivering to", addressBlock(order.address))}${infoBox("Payment", paymentText(order))}</tr>
      </table>
      ${button(`${siteUrl()}/orders`, "View my order")}`
  });
  return { subject, html };
}

function outForDeliveryEmail(order) {
  const isCodDue = order.paymentMethod === "COD" && order.paymentStatus !== "PAID";
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const subject = `Out for delivery: order #${order.id} – ${STORE_NAME}`;
  const html = layout({
    preheader: `Your order #${order.id} is on its way and will reach you soon.`,
    heading: "Your order is out for delivery 🚚",
    intro: `Good news, ${esc(firstName(order.user?.name))}! Order <strong>#${order.id}</strong> (${itemCount} item${itemCount === 1 ? "" : "s"}) has left our store and will reach you soon. Please keep your phone handy so our delivery partner can reach you.`,
    body: `
      ${
        isCodDue
          ? `<div style="padding:14px 16px;background:#fff8e6;border:1px solid #f3d27a;border-radius:8px;font-size:15px;color:#6b4e00;margin-bottom:20px;">
               💵 <strong>Cash on Delivery:</strong> please keep <strong>${rupees(order.totalAmount)}</strong> ready.
             </div>`
          : ""
      }
      <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:${BRAND.muted};margin-bottom:4px;">What's coming</div>
      ${itemsTable(order.items)}
      ${totalsTable(order)}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;border-collapse:separate;border-spacing:8px 0;">
        <tr>${infoBox("Delivering to", addressBlock(order.address))}${infoBox("Payment", paymentText(order))}</tr>
      </table>
      ${button(`${siteUrl()}/orders`, "Track in My Orders")}`
  });
  return { subject, html };
}

// Only http(s) links go into the email, so a bad value can't become a script link.
const safeUrl = url => (/^https?:\/\//i.test(String(url || "")) ? url : null);

function shippedEmail(order) {
  const courier = order.courierName || "our courier partner";
  const trackingUrl = safeUrl(order.trackingUrl);
  const subject = `Shipped: order #${order.id} via ${courier} – ${STORE_NAME}`;
  const html = layout({
    preheader: `Order #${order.id} has shipped with ${courier}. Tracking ID: ${order.trackingId}.`,
    heading: "Your order has been shipped 📦",
    intro: `Good news, ${esc(firstName(order.user?.name))}! Order <strong>#${order.id}</strong> is packed and on its way with <strong>${esc(courier)}</strong>. Use the tracking ID below to follow your parcel.`,
    body: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;background:#f6faf6;border:1px solid ${BRAND.line};border-radius:10px;">
        <tr><td style="padding:18px 20px;">
          <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${BRAND.muted};">Delivery partner</div>
          <div style="font-size:16px;font-weight:700;color:${BRAND.dark};margin:2px 0 14px;">${esc(courier)}</div>
          <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${BRAND.muted};">Tracking ID</div>
          <div style="display:inline-block;margin-top:4px;padding:8px 14px;border:2px dashed ${BRAND.main};border-radius:8px;background:#ffffff;font-family:Menlo,Consolas,monospace;font-size:18px;font-weight:700;letter-spacing:.05em;color:${BRAND.dark};">${esc(order.trackingId)}</div>
        </td></tr>
      </table>
      ${
        trackingUrl
          ? `${button(trackingUrl, `Track on ${esc(courier)}`)}
             <p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:${BRAND.muted};text-align:center;">
               If the page asks for it, enter the tracking ID above.<br/>
               <a href="${esc(trackingUrl)}" style="color:${BRAND.main};word-break:break-all;">${esc(trackingUrl)}</a>
             </p>`
          : ""
      }
      <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:${BRAND.muted};margin:8px 0 4px;">In this parcel</div>
      ${itemsTable(order.items)}
      ${totalsTable(order)}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;border-collapse:separate;border-spacing:8px 0;">
        <tr>${infoBox("Delivering to", addressBlock(order.address))}${infoBox("Payment", paymentText(order))}</tr>
      </table>`
  });
  return { subject, html };
}

const TEMPLATES = {
  confirmed: orderConfirmationEmail,
  shipped: shippedEmail,
  outForDelivery: outForDeliveryEmail
};

const loadOrder = orderId =>
  prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      address: true,
      items: { include: { product: { select: { name: true, priceUnit: true } } } }
    }
  });

/**
 * Emails the customer about their order. `kind` is "confirmed", "shipped" or "outForDelivery".
 * Never throws; returns true if the email was handed to Resend.
 */
async function sendOrderEmail(orderId, kind) {
  try {
    const template = TEMPLATES[kind];
    if (!template) throw new Error(`Unknown order email "${kind}"`);

    const resend = getResend();
    if (!resend) {
      console.warn(`Order email "${kind}" for order #${orderId} skipped: RESEND_API_KEY is not set.`);
      return false;
    }

    const order = await loadOrder(orderId);
    if (!order?.user?.email) {
      console.warn(`Order email "${kind}" for order #${orderId} skipped: no customer email.`);
      return false;
    }

    const { subject, html } = template(order);
    const { error } = await resend.emails.send({
      from: `${STORE_NAME} <${fromAddress().replace(/^.*<|>.*$/g, "")}>`,
      to: order.user.email,
      replyTo: process.env.ADMIN_EMAIL || undefined,
      subject,
      html
    });
    if (error) throw new Error(error.message || JSON.stringify(error));

    console.log(`Order email "${kind}" sent for order #${orderId}`);
    return true;
  } catch (error) {
    console.error(`Failed to send order email "${kind}" for order #${orderId}:`, error);
    return false;
  }
}

module.exports = { sendOrderEmail, orderConfirmationEmail, shippedEmail, outForDeliveryEmail };
