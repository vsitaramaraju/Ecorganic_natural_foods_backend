# Forgot Password Feature - Quick Reference Guide

## 📋 Quick Setup Checklist

- [x] **Backend Setup**
  - [x] Resend package installed
  - [x] Email service updated to use Resend
  - [x] Database schema has reset fields
  - [x] API endpoints implemented
  - [ ] Configure `.env` file with Resend API key

- [ ] **Frontend Setup**
  - [ ] Create Forgot Password page
  - [ ] Create Reset Password page  
  - [ ] Add token verification
  - [ ] Add form validation
  - [ ] Style components

---

## 🔑 Environment Variables Required

```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@ecoorganicfoods.com
FRONTEND_URL=http://localhost:3000
```

---

## 📡 API Endpoints

### 1. Request Password Reset
```
POST /api/auth/forgot-password
Body: { "email": "user@example.com" }
```

### 2. Verify Token
```
POST /api/auth/verify-reset-token
Body: { "token": "token_from_url" }
```

### 3. Reset Password
```
POST /api/auth/reset-password
Body: {
  "token": "token_from_url",
  "newPassword": "newPass123",
  "confirmPassword": "newPass123"
}
```

---

## 🎯 Frontend Pages Needed

### 1. Forgot Password Page
- Email input
- Submit button
- Loading state
- Success/error messages

### 2. Reset Password Page
- Extract token from URL: `?token=xxx`
- Verify token on load
- Password input fields
- Submit button
- Validation feedback

---

## 🧪 Test the API

**Test Email (from Resend):**
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "delivered@resend.dev"}'
```

**Check Email Link:**
Look for email from `noreply@ecoorganicfoods.com` with reset link

---

## 📧 Email Workflow

```
User submits email
    ↓
Generate reset token (32 random bytes)
    ↓
Hash token with SHA256
    ↓
Save hashed token + 1-hour expiry to DB
    ↓
Send email via Resend with plain token in link
    ↓
User clicks link
    ↓
Frontend extracts token from URL
    ↓
Verify token is valid (not expired)
    ↓
User enters new password
    ↓
Send token + password to backend
    ↓
Hash token and verify in DB
    ↓
Update password and clear reset token
    ↓
Success ✓
```

---

## 🔒 Security Features

✅ Cryptographically secure token generation  
✅ Tokens hashed before storing in database  
✅ 1-hour expiration on reset links  
✅ One-time use only  
✅ Password hashed with bcrypt  
✅ No plain text stored  

---

## 🚀 Resend Integration Details

**What is Resend?**
- Modern email sending service
- Easy integration (single API)
- No SMTP configuration needed
- Free tier available
- Great for transactional emails

**Advantages over Nodemailer:**
- ✓ Simpler setup
- ✓ Better deliverability
- ✓ Built-in webhook support
- ✓ Professional infrastructure
- ✓ Excellent documentation

---

## 📝 Email Content

**From:** noreply@ecoorganicfoods.com  
**Subject:** Password Reset Request - Eco Organic Natural Foods  
**Expires in:** 1 hour  

**Email includes:**
- User's name
- Reset button link
- Plain text fallback link
- Expiration notice
- Security disclaimer

---

## 💡 Frontend Implementation Tips

### React Example
```javascript
// Forgot password form
const handleSubmit = async (email) => {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  if (response.ok) {
    showSuccessMessage('Check your email for reset link');
  }
};

// Reset password page
useEffect(() => {
  const token = new URLSearchParams(window.location.search).get('token');
  verifyToken(token); // Call verify endpoint
}, []);

// Reset form
const resetPassword = async (password, token) => {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      newPassword: password,
      confirmPassword: password
    })
  });
  
  if (response.ok) {
    redirectToLogin();
  }
};
```

---

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Email not sending | Check `RESEND_API_KEY` in `.env` |
| Invalid sender | Use `test@resend.dev` or verify domain |
| Token expired | Token lasts 1 hour, request new one |
| Link not working | Verify `FRONTEND_URL` in `.env` |
| Database error | Run `npx prisma migrate deploy` |

---

## 📚 Files to Reference

- **Backend Setup:** `BACKEND_SETUP_GUIDE.md`
- **Frontend Integration:** `FRONTEND_INTEGRATION_NOTES.md`
- **API Documentation:** `FORGOT_PASSWORD_API.md`
- **Email Service:** `src/utils/emailService.js`
- **Auth Controller:** `controllers/authController.js`
- **Auth Routes:** `routes/authRoutes.js`

---

## 🎨 Example React Components

See `FRONTEND_INTEGRATION_NOTES.md` for complete component examples including:
- Forgot password form component
- Reset password form component
- Token verification hook
- Form validation with Zod
- Error handling
- Loading states
- Success messages

---

## 📞 Support Resources

- Resend Docs: https://resend.com/docs
- Email Testing: https://resend.dev/emails
- Status Page: https://status.resend.com/

---

## ✨ Next Actions

1. **Get Resend API Key**
   - Go to https://dashboard.resend.com/
   - Create account
   - Copy API key

2. **Configure .env**
   ```
   RESEND_API_KEY=re_xxxxx
   RESEND_FROM_EMAIL=noreply@ecoorganicfoods.com
   FRONTEND_URL=http://localhost:3000
   ```

3. **Test Backend**
   - Start server: `npm run dev`
   - Make test request (see Test API section)

4. **Build Frontend**
   - Create forgot password page
   - Create reset password page
   - Connect to API endpoints

5. **Go Live**
   - Verify domain in Resend
   - Test full flow
   - Deploy to production

---

## 📊 Token Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   User Forgot Password                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│   Email submitted to POST /api/auth/forgot-password          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│   Generate token: crypto.randomBytes(32)                    │
│   Hash token: SHA256(token)                                 │
│   Save to DB: { resetToken: hash, resetTokenExpiry: +1hr }  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│   Send email via Resend with plain token in link            │
│   Link: FRONTEND_URL/reset-password?token=plain_token       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           User clicks link in email                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│   Frontend extracts token from URL                          │
│   POST /api/auth/verify-reset-token with token             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│   Backend verifies:                                         │
│   - Token hash matches DB record                            │
│   - Token hasn't expired                                    │
│   Returns: { valid: true }                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│   Frontend shows reset password form                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│   User enters new password and confirms                     │
│   POST /api/auth/reset-password with token and password    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│   Backend:                                                  │
│   - Hash token and find user                                │
│   - Verify token not expired                                │
│   - Hash new password with bcrypt                           │
│   - Update password in DB                                   │
│   - Clear resetToken and resetTokenExpiry                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│        Password Reset Success ✓                             │
│   User can now login with new password                      │
└─────────────────────────────────────────────────────────────┘
```

---

**Last Updated:** 2024  
**Version:** 1.0  
**Status:** ✅ Complete & Ready for Frontend Integration
