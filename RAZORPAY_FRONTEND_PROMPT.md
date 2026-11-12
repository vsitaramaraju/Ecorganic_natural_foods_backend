# Prompt: Razorpay checkout in the frontend

Paste everything below the line into Claude Code (or hand it to a developer) **inside the frontend project folder**.

---

Add Razorpay online payment to this React (Vite) storefront and admin panel. The backend is already done. Its API contract is below. Don't change the backend: build the frontend to match it. First look at how this project already calls the API (the axios/fetch wrapper, how the JWT `Authorization: Bearer <token>` header is attached, the base URL env var), how toasts/errors are shown, and where checkout, "My Orders" and admin order pages live. Then reuse those patterns. Don't add new libraries. Load the Razorpay script with a plain `<script>` tag.

## Backend API (base `/api`, JSON, JWT auth unless noted)

### 1. `GET /api/orders/payment-config` (no auth)
```json
{ "razorpayEnabled": true, "keyId": "rzp_test_xxx", "methods": ["COD", "RAZORPAY"] }
```
Call it when checkout opens. Show "Pay Online (UPI / Card / Netbanking)" only if `razorpayEnabled` is true. Otherwise show only Cash on Delivery.

### 2. Cash on Delivery (unchanged): `POST /api/orders`
Body: `{ "addressId": 3, "couponCode": "SAVE10", "paymentMethod": "COD" }` (`couponCode` is optional). Returns `201` with the order.

### 3. Online payment step 1: `POST /api/orders/razorpay/create`
Body: `{ "addressId": 3, "couponCode": "SAVE10" }` (coupon optional; the server takes the items from the user's server-side cart).
Returns `201`:
```json
{
  "keyId": "rzp_test_xxx",
  "razorpayOrderId": "order_Nabc123",
  "amount": 49900,          // paise
  "currency": "INR",
  "prefill": { "name": "...", "email": "...", "contact": "..." }
}
```
No shop order exists yet at this point. The cart is not emptied.

### 4. Online payment step 2: `POST /api/orders/razorpay/verify`
Body: send the three fields from Razorpay's success handler **exactly as named**:
```json
{ "razorpay_order_id": "...", "razorpay_payment_id": "...", "razorpay_signature": "..." }
```
Returns `201` (or `200` if the order was already created) with the confirmed order. The server empties the cart.
This call is **idempotent**: if it fails on a network error, retrying with the same body is safe (retry up to 3 times with a short backoff). A server-side webhook also creates the order if the browser never calls verify. So if every retry fails, tell the user: "Payment received. Your order is being confirmed. Check My Orders in a minute." Don't say the payment failed.

### Error shapes (all endpoints)
- `{ "message": "..." }`: show `message` to the user.
- `409` with `{ "message", "items": [{ productId, name, requested, available, unit }] }` from create/COD: stock problem. List the items and send the user back to the cart.
- `409` from verify with `{ "message", "refunded": true|false }`: the payment was taken but the order couldn't be placed (cart or stock changed while paying), so the money was refunded. Show `message` as-is, because it already says the refund is on its way or names the payment ID for support. Then reload the cart.
- `503`: online payment is not available. Hide the option and suggest COD.
- `400`/`402` from verify: the payment wasn't completed. Show `message`.
- The auth middleware returns `401 { "error": "..." }` (key is `error`, not `message`). Handle both keys.

## What to build

### A. `loadRazorpay()` utility (e.g. `src/utils/loadRazorpay.js`)
Inject `https://checkout.razorpay.com/v1/checkout.js` once. Return a promise that resolves `true` on load and `false` on error. Cache the promise so it is only loaded once.

### B. Checkout page
1. Add a payment-method selector: COD / Pay Online. Use the payment-config call for this.
2. Place-order button:
   - **COD** → existing `POST /api/orders` flow.
   - **Online** → disable the button and show "Processing…", then:
     1. `await loadRazorpay()`. On failure, show a toast ("Couldn't load payment gateway, check your connection") and stop.
     2. `POST /api/orders/razorpay/create` with `{ addressId, couponCode }`.
     3. Open the modal:
        ```js
        const rzp = new window.Razorpay({
          key: data.keyId,
          order_id: data.razorpayOrderId,
          amount: data.amount,
          currency: data.currency,
          name: "Eco Organic Natural Foods",
          description: "Order payment",
          prefill: data.prefill,
          theme: { color: "<site primary colour>" },
          handler: async (resp) => { /* POST /razorpay/verify with resp (with retries) */ },
          modal: { ondismiss: () => { /* re-enable button, toast "Payment cancelled" */ }, confirm_close: true }
        });
        rzp.on("payment.failed", (r) => { /* toast r.error.description; keep the user on checkout */ });
        rzp.open();
        ```
     4. When verify succeeds, show a full-screen "Confirming your payment…" overlay while it runs. Then refresh the cart count in global state, clear the applied coupon, and go to the existing order-success page (or `/orders`) with the order id.
   - Never send the amount from the client. The server computes it.
3. Guard against double clicks and a second `create` while the modal is open.

### C. Customer "My Orders" page
Each order from `GET /api/orders` now has:
`paymentMethod` (`"COD"` | `"RAZORPAY"`; old orders may say `"UPI"`, show those as Online), `paymentStatus` (`"UNPAID"` | `"PAID"` | `"REFUND_PENDING"` | `"REFUNDED"` | `"REFUND_FAILED"`), `razorpayPaymentId`, `refundAmount`, `refundedAt`.
New orders are created with `status: "CONFIRMED"`. There is no PENDING step any more.
Show badges:
- COD + UNPAID → "Cash on Delivery"
- PAID → "Paid online" (show the payment id small/muted)
- REFUND_PENDING → "Refund of ₹X initiated (5–7 working days)"
- REFUNDED → "Refunded ₹X on <date>"
- REFUND_FAILED → "Refund issue: our team will contact you"

### D. Admin order list + detail (`GET /api/admin/orders`, `GET /api/admin/orders/:id`)
- Add Payment method and Payment status columns/badges (same values as above). Show the Razorpay payment id and refund id on the detail page. The detail endpoint also refreshes a pending refund's status, so re-fetch it when the page opens.
- Status dropdown options: `CONFIRMED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED` (PENDING is no longer allowed). Update with `PUT /api/admin/orders/status` body `{ orderId, status }`.
- When the admin chooses **CANCELLED** on an order with `paymentStatus === "PAID"`, show a confirm dialog first: "This will refund ₹<totalAmount> to the customer via Razorpay. Continue?" If the server returns `502`, the refund failed and the order was NOT cancelled. Show the message and keep the old status in the UI.
- A cancelled order whose paymentStatus is REFUND_PENDING/REFUNDED can't be reopened (the server returns 400). Disable the status dropdown for it.
- Socket.io (already set up for notifications): admins now also get `order:refund_failed` `{ orderId, refundId }`. Show a toast/notification linking to that order. The notification list's `type` can now be `"refund_failed"`.

## Testing (Razorpay test mode)
- Card `4111 1111 1111 1111`, any future expiry, any CVV, OTP any. UPI success: `success@razorpay`, failure: `failure@razorpay`.
- Test: success flow; closing the modal; a failed payment; COD still works; coupon applied + online pay; admin cancels a paid order → customer sees "Refund initiated".
- Make sure there are no console errors and the cart badge updates after paying.

When finished, list the files you changed and anything in the contract above that didn't fit the existing frontend code.
