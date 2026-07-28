# Complete Implementation Guide - Forgot Password with Resend

## 📋 Table of Contents
1. [Backend Setup](#backend-setup)
2. [Frontend Setup](#frontend-setup)
3. [Testing](#testing)
4. [Deployment](#deployment)
5. [Troubleshooting](#troubleshooting)

---

## 🔧 Backend Setup

### Step 1: Verify Installation ✅

Run this command to confirm resend is installed:
```bash
npm list resend
```

**Output should show:**
```
└── resend@6.18.0
```

If not installed:
```bash
npm install resend
```

### Step 2: Environment Configuration

Create or update `.env` file in your project root:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/eco_organic_db

# Authentication
JWT_SECRET=your-super-secret-key-min-32-chars

# Email Service (Resend)
RESEND_API_KEY=re_your_api_key_from_resend_dashboard
RESEND_FROM_EMAIL=noreply@ecoorganicfoods.com

# Frontend
FRONTEND_URL=http://localhost:3000

# Server
PORT=5000
NODE_ENV=development
```

### Step 3: Get Resend API Key

1. Visit https://resend.com/ and sign up (free tier available)
2. Go to API Keys section
3. Create new API key
4. Copy key (format: `re_xxxxxxxxxxxxx`)
5. Paste into `.env` as `RESEND_API_KEY`

### Step 4: Database Setup

Verify your database has the required fields:

```bash
# Apply all migrations
npx prisma migrate deploy

# If needed, create new migration
npx prisma migrate dev --name add_password_reset_fields
```

**Fields in User model:**
- `resetToken` - Stores hashed token
- `resetTokenExpiry` - Stores expiration time

### Step 5: Backend Files Status

✅ **Already Updated:**
- `src/utils/emailService.js` - Uses Resend
- `controllers/authController.js` - Full implementation
- `routes/authRoutes.js` - All endpoints

✅ **Already Implemented:**
- Token generation with crypto
- Token hashing with SHA256
- Password hashing with bcrypt
- 1-hour expiration
- Email sending via Resend

### Step 6: Start Backend Server

```bash
npm run dev
```

**Expected output:**
```
Server running on port 5000
```

---

## 🎨 Frontend Setup

### Step 1: Create Forgot Password Page

**Location:** `src/pages/ForgotPassword.jsx` (or .tsx)

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/forgot-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.message || 'Failed to send reset link');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="success-container">
        <h2>✓ Check Your Email</h2>
        <p>We've sent a password reset link to {email}</p>
        <p>The link will expire in 1 hour</p>
        <button onClick={() => navigate('/login')}>Back to Login</button>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <h2>Forgot Your Password?</h2>
      <p>Enter your email and we'll send you a reset link</p>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading || !email}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <p>
          Remember your password?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="link-button"
          >
            Login
          </button>
        </p>
      </form>
    </div>
  );
}
```

### Step 2: Create Reset Password Page

**Location:** `src/pages/ResetPassword.jsx` (or .tsx)

```javascript
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('No reset token provided');
      setVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/auth/verify-reset-token`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          }
        );

        const data = await response.json();

        if (data.valid) {
          setTokenValid(true);
        } else {
          setError('This reset link has expired. Please request a new one.');
        }
      } catch (err) {
        setError('Failed to verify reset token. Please try again.');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            newPassword: password,
            confirmPassword
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert('Password reset successful! Please login with your new password.');
        navigate('/login');
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="reset-password-container">
        <p>Verifying reset link...</p>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="reset-password-container">
        <h2>Invalid Reset Link</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/forgot-password')}>
          Request New Reset Link
        </button>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <h2>Reset Your Password</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength="6"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength="6"
        />

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading || !password || !confirmPassword}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="link-button"
        >
          Back to Login
        </button>
      </p>
    </div>
  );
}
```

### Step 3: Add Routes

**Location:** `src/App.jsx` (or router configuration)

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { ResetPasswordPage } from './pages/ResetPassword';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... other routes ... */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### Step 4: Environment Configuration

Create `.env.local` in your frontend:

```env
REACT_APP_API_URL=http://localhost:5000
```

### Step 5: Add Login Link

Update your Login page to include forgot password link:

```javascript
<p>
  <button
    type="button"
    onClick={() => navigate('/forgot-password')}
    className="link-button"
  >
    Forgot Password?
  </button>
</p>
```

---

## 🧪 Testing

### Test 1: Request Password Reset

1. Navigate to `http://localhost:3000/forgot-password`
2. Enter email: `delivered@resend.dev` (Resend test email)
3. Click "Send Reset Link"
4. **Expected:** Success message

### Test 2: Verify Email

1. Check Resend test inbox or email inbox
2. Look for email from `noreply@ecoorganicfoods.com`
3. Click the reset password button
4. **Expected:** Redirects to reset password page with token in URL

### Test 3: Reset Password

1. Enter new password (minimum 6 characters)
2. Confirm password (must match)
3. Click "Reset Password"
4. **Expected:** Success message and redirect to login

### Test 4: Login with New Password

1. Go to login page
2. Enter email and new password
3. **Expected:** Successfully logged in

### Test 5: Expired Token

1. Wait 1+ hours after requesting reset
2. Try to use reset link
3. **Expected:** Error message "Invalid or expired reset token"

### Full Test Flow Using cURL

```bash
# 1. Request reset
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Expected response:
# {
#   "message": "Password reset link sent to your email",
#   "success": true
# }

# 2. Get token from email link (format: ?token=xxxxx)
# Copy the token value

# 3. Verify token
curl -X POST http://localhost:5000/api/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{"token": "paste_token_here"}'

# Expected response:
# {
#   "message": "Reset token is valid",
#   "valid": true
# }

# 4. Reset password
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "paste_token_here",
    "newPassword": "newPassword123",
    "confirmPassword": "newPassword123"
  }'

# Expected response:
# {
#   "message": "Password reset successfully",
#   "success": true
# }

# 5. Login with new password
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "newPassword123"}'

# Expected response:
# {
#   "token": "jwt_token",
#   "user": { ... }
# }
```

---

## 🚀 Deployment

### Production Environment Setup

#### Backend `.env` (Production)

```env
DATABASE_URL=postgresql://prod_user:prod_password@prod-db:5432/eco_organic
JWT_SECRET=generate-strong-secret-at-least-32-characters-long
FRONTEND_URL=https://yourdomain.com
RESEND_API_KEY=re_your_resend_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
PORT=5000
NODE_ENV=production
```

#### Resend Domain Setup

1. Verify your domain in Resend dashboard
2. Add DNS records to your domain registrar
3. Update `RESEND_FROM_EMAIL` to use your verified domain

#### Frontend `.env.local` (Production)

```env
REACT_APP_API_URL=https://api.yourdomain.com
```

#### Build & Deploy

```bash
# Backend
npm run build  # if needed
npm start

# Frontend
npm run build
# Deploy build folder to hosting
```

---

## 🐛 Troubleshooting

### Backend Issues

**Problem:** `Cannot find module 'resend'`
```bash
npm install resend
npm start
```

**Problem:** Email not sending - 401 Unauthorized
- Verify `RESEND_API_KEY` is correct
- Get new key from Resend dashboard
- Restart server

**Problem:** Email not sending - Invalid sender domain
- Use test email: `test@resend.dev` for testing
- Verify domain in Resend dashboard for production

**Problem:** Token errors in database
```bash
npx prisma migrate deploy
npx prisma generate
```

### Frontend Issues

**Problem:** Can't access reset-password page
- Verify route is added to router
- Check token is in URL: `?token=xxxxx`
- Check browser console for errors

**Problem:** "Invalid token" error on reset page
- Token may have expired (1 hour limit)
- Request new reset link
- Check server logs

**Problem:** CORS errors
- Verify backend CORS is configured
- Check `FRONTEND_URL` in backend `.env`
- Ensure API URL is correct in frontend `.env.local`

### Email Issues

**Problem:** Users not receiving emails
- Check Resend dashboard
- Verify domain is verified
- Check spam/junk folder
- Test with `delivered@resend.dev`

**Problem:** Email looks different than expected
- Resend may modify HTML
- Use their email template builder
- Test multiple email clients

---

## 📊 API Response Reference

### Success Responses (200 OK)

```json
{
  "message": "Password reset link sent to your email",
  "success": true
}
```

```json
{
  "message": "Reset token is valid",
  "valid": true
}
```

```json
{
  "message": "Password reset successfully",
  "success": true
}
```

### Error Responses (400 Bad Request)

```json
{
  "message": "User not found with this email"
}
```

```json
{
  "message": "Invalid or expired reset token"
}
```

```json
{
  "message": "Passwords do not match"
}
```

```json
{
  "message": "Email is required"
}
```

---

## ✅ Completion Checklist

### Backend
- [x] Resend package installed
- [x] Email service updated
- [x] API endpoints implemented
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Server tested locally

### Frontend
- [ ] Forgot password page created
- [ ] Reset password page created
- [ ] Routes added
- [ ] Environment variables configured
- [ ] Form validation implemented
- [ ] Error handling added
- [ ] Loading states added

### Testing
- [ ] Test email sending
- [ ] Test token verification
- [ ] Test password reset
- [ ] Test login with new password
- [ ] Test expired token handling
- [ ] Test all error cases

### Deployment
- [ ] Production environment configured
- [ ] Resend domain verified
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] End-to-end testing in production
- [ ] Monitor email delivery

---

## 📞 Quick Links

- **Resend Dashboard:** https://dashboard.resend.com/
- **API Documentation:** [FORGOT_PASSWORD_API.md](FORGOT_PASSWORD_API.md)
- **Frontend Guide:** [FRONTEND_INTEGRATION_NOTES.md](FRONTEND_INTEGRATION_NOTES.md)
- **Backend Guide:** [BACKEND_SETUP_GUIDE.md](BACKEND_SETUP_GUIDE.md)
- **Quick Reference:** [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

---

## 🎉 You're All Set!

You now have a complete, production-ready forgot password system with Resend email integration. 

**Next Steps:**
1. Configure environment variables
2. Build frontend components
3. Test the entire flow
4. Deploy to production

**Support:** Check the documentation files for detailed information and examples.
