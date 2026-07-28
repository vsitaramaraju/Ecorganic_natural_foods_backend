# Backend Setup Guide - Forgot Password with Resend

## Overview
This guide provides step-by-step instructions to set up the password reset functionality using the Resend email service for your backend.

---

## Prerequisites

- Node.js 14+ installed
- Prisma ORM set up
- PostgreSQL database configured
- Resend account (https://resend.com)

---

## Installation & Configuration

### Step 1: Install Required Packages

The resend package is already installed. To verify:

```bash
npm list resend
```

If you need to reinstall:
```bash
npm install resend
```

You can optionally remove nodemailer if you're not using it elsewhere:
```bash
npm uninstall nodemailer
```

---

### Step 2: Get Resend API Key

1. Go to [Resend Dashboard](https://dashboard.resend.com/)
2. Sign in or create a free account
3. Navigate to **API Keys**
4. Create a new API key
5. Copy the API key (format: `re_xxxxxxxxxxxxx`)

### Step 3: Verify Sender Domain (Important!)

To send emails from your domain:

1. In Resend Dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `ecoorganicfoods.com`)
4. Add the DNS records provided by Resend to your domain registrar
5. Wait for verification (can take up to 24 hours)
6. Once verified, use your domain email as `RESEND_FROM_EMAIL`

**For testing:** You can use `test@resend.dev` without domain verification

---

### Step 4: Configure Environment Variables

Update your `.env` file:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/eco_organic_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (where your reset password link will redirect)
FRONTEND_URL=http://localhost:3000

# Resend Email Configuration
RESEND_API_KEY=re_your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@ecoorganicfoods.com

# Server Configuration
PORT=5000
NODE_ENV=development
```

**Important Environment Variables Explanation:**

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | Your Resend API key | `re_xxxxxxxxxxxxx` |
| `RESEND_FROM_EMAIL` | Sender email address | `noreply@ecoorganicfoods.com` |
| `FRONTEND_URL` | Frontend application URL for reset link | `http://localhost:3000` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |

---

### Step 5: Database Schema Verification

The following fields should already exist in your User model:

```prisma
model User {
  id               Int        @id @default(autoincrement())
  name             String
  email            String     @unique
  password         String?
  phone            String?
  role             String     @default("USER")
  createdAt        DateTime   @default(now())
  resetToken       String?    // For storing hashed reset token
  resetTokenExpiry DateTime?  // For token expiration
  // ... other fields
}
```

If you need to add these fields, run:

```bash
# Create a new migration
npx prisma migrate dev --name add_password_reset_fields

# Apply the migration
npx prisma migrate deploy
```

---

## Current Implementation

### Email Service (Updated)
Location: `src/utils/emailService.js`

The email service now uses Resend instead of Nodemailer:

```javascript
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const sendPasswordResetEmail = async (email, resetToken, userName) => {
  // Generates reset link and sends email via Resend
  // Returns true on success, throws error on failure
};
```

### Auth Controller
Location: `controllers/authController.js`

**Implemented Functions:**

#### 1. `forgotPassword(req, res)`
- Validates email exists
- Generates secure reset token
- Saves hashed token to database with 1-hour expiry
- Sends email via Resend

#### 2. `resetPassword(req, res)`
- Validates token and expiration
- Hashes new password
- Updates user password
- Clears reset token from database

#### 3. `verifyResetToken(req, res)`
- Validates token exists and hasn't expired
- Returns token validity status

### Auth Routes
Location: `routes/authRoutes.js`

```javascript
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-reset-token", verifyResetToken);
```

---

## Testing the Implementation

### 1. Test with Resend Test Email

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "delivered@resend.dev"}'
```

**Available Test Emails:**
- `delivered@resend.dev` - Successfully delivered
- `bounced@resend.dev` - Bounced email
- `complained@resend.dev` - Complained email
- `oob_link_expires@resend.dev` - Link expires

### 2. Test Password Reset Flow

**Step 1: Request Reset**
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**Step 2: Get Token (from email link)**
- Extract token from reset link: `?token=xxxxx`

**Step 3: Verify Token**
```bash
curl -X POST http://localhost:5000/api/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{"token": "your_token_here"}'
```

**Step 4: Reset Password**
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your_token_here",
    "newPassword": "newPass123",
    "confirmPassword": "newPass123"
  }'
```

**Step 5: Login with New Password**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "newPass123"}'
```

---

## Email Template

The email sent to users includes:

- **Subject:** Password Reset Request - Eco Organic Natural Foods
- **From:** Your configured `RESEND_FROM_EMAIL`
- **HTML Template** with:
  - Personalized greeting
  - Professional styling
  - Clickable reset button
  - Fallback text link
  - Token expiration warning
  - Security notice
  - Company branding

---

## Troubleshooting

### Issue: `Cannot find module 'resend'`
**Solution:** Run `npm install resend`

### Issue: `RESEND_API_KEY is not set`
**Solution:** 
- Verify `.env` file has `RESEND_API_KEY=re_xxxxx`
- Restart the server after updating `.env`
- Check for typos in environment variable name

### Issue: Email not sending - "401 Unauthorized"
**Solution:**
- Verify your API key is correct
- Get a new API key from Resend dashboard
- Ensure the key starts with `re_`

### Issue: Email not sending - "Invalid sender domain"
**Solution:**
- Use test email: `test@resend.dev`
- Or verify your domain in Resend dashboard (takes up to 24 hours)
- Ensure `RESEND_FROM_EMAIL` matches verified domain

### Issue: "Password reset link not working"
**Solution:**
- Verify `FRONTEND_URL` in `.env` is correct
- Check token extraction on frontend
- Ensure reset token hasn't expired (1-hour limit)
- Check browser console for JavaScript errors

### Issue: Database errors
**Solution:**
- Verify `DATABASE_URL` is correct
- Run migrations: `npx prisma migrate deploy`
- Check Prisma logs: `set DEBUG=* && npm run dev`

---

## Security Best Practices

### 1. Token Generation
- Uses `crypto.randomBytes(32)` for cryptographically secure tokens
- Tokens are hashed with SHA256 before storing in database
- Never store plain text tokens in database

### 2. Token Expiration
- Tokens expire after 1 hour
- Expiration checked on every reset attempt
- Expired tokens cannot be reused

### 3. Password Requirements
- Minimum 6 characters
- Hashed with bcrypt (10 rounds)
- Old password cleared after reset

### 4. Email Security
- Reset link sent only to verified email
- Link contains untampered token
- One-time use only

### 5. Production Recommendations
- Use strong `JWT_SECRET` (minimum 32 characters)
- Enable HTTPS only
- Set `NODE_ENV=production`
- Use environment-specific Resend domains
- Implement rate limiting to prevent abuse
- Add request validation and sanitization
- Monitor Resend dashboard for delivery issues
- Set up Resend webhooks for bounce tracking

---

## Rate Limiting (Production)

Add rate limiting to prevent brute force attacks:

```bash
npm install express-rate-limit
```

Update `routes/authRoutes.js`:

```javascript
const rateLimit = require('express-rate-limit');

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per IP
  message: 'Too many password reset attempts, please try again later'
});

router.post('/forgot-password', passwordResetLimiter, forgotPassword);
```

---

## Monitoring & Logging

### Enable Debug Logging

In `src/utils/emailService.js`, logs are already included:

```javascript
console.log(`Password reset email sent to ${email}`, response);
console.error('Error sending password reset email with Resend:', error);
```

### Monitor Resend Dashboard

1. Go to [Resend Dashboard](https://dashboard.resend.com/)
2. Check **Emails** section for:
   - Sent emails count
   - Delivery status
   - Bounce/Complaint rates
   - Engagement metrics

### Webhook Setup (Optional)

Set up webhooks to track email events:

```javascript
// In your server setup
app.post('/api/webhooks/resend', (req, res) => {
  const event = req.body.type;
  const email = req.body.data.email;

  switch(event) {
    case 'email.sent':
      console.log(`Email sent to ${email}`);
      break;
    case 'email.delivered':
      console.log(`Email delivered to ${email}`);
      break;
    case 'email.bounced':
      console.log(`Email bounced for ${email}`);
      // Handle bounce - mark user as invalid
      break;
    case 'email.complained':
      console.log(`Email complained by ${email}`);
      // Handle complaint
      break;
  }

  res.json({ received: true });
});
```

---

## API Response Examples

### Success Responses

**Forgot Password:**
```json
{
  "message": "Password reset link sent to your email",
  "success": true
}
```

**Verify Token:**
```json
{
  "message": "Reset token is valid",
  "valid": true
}
```

**Reset Password:**
```json
{
  "message": "Password reset successfully",
  "success": true
}
```

### Error Responses

**User Not Found:**
```json
{
  "message": "User not found with this email"
}
```

**Invalid Token:**
```json
{
  "message": "Invalid or expired reset token"
}
```

**Password Validation Error:**
```json
{
  "message": "Passwords do not match"
}
```

---

## File Structure

```
backend/
├── controllers/
│   └── authController.js       # Contains forgotPassword, resetPassword, verifyResetToken
├── routes/
│   └── authRoutes.js          # API endpoints
├── src/
│   ├── utils/
│   │   └── emailService.js    # Resend email sending logic
│   ├── app.js
│   └── server.js
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── .env.example               # Environment variables template
└── FRONTEND_INTEGRATION_NOTES.md # Frontend integration guide
```

---

## Next Steps

1. ✅ Install resend package
2. ✅ Update emailService.js
3. ✅ Configure environment variables
4. ✅ Verify Resend API key
5. ✅ Test the API endpoints
6. 📋 Implement frontend components (see FRONTEND_INTEGRATION_NOTES.md)
7. 🔒 Deploy to production with security measures

---

## Support & Resources

- **Resend Documentation:** https://resend.com/docs
- **Prisma Documentation:** https://www.prisma.io/docs
- **Express.js Documentation:** https://expressjs.com/
- **OWASP Password Reset:** https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html

---

## Changelog

### Version 1.0 - Current
- Implemented password reset flow with Resend
- Token generation with crypto
- 1-hour token expiration
- Professional HTML email template
- Database schema with reset fields
- Complete API endpoints
