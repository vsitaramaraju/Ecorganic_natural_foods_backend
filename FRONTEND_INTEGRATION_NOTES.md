# Frontend Integration Guide - Forgot Password Feature

## Overview
This guide provides all the necessary information to integrate the forgot password feature with the Resend email service in your frontend application.

---

## Backend API Endpoints

### 1. **Request Password Reset**
**Endpoint:** `POST /api/auth/forgot-password`

**Purpose:** Sends a password reset link to the user's email

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success - 200):**
```json
{
  "message": "Password reset link sent to your email",
  "success": true
}
```

**Response (Error - 400):**
```json
{
  "message": "User not found with this email"
}
```

**Frontend Usage Example (React):**
```javascript
const handleForgotPassword = async (email) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(data.message); // "Password reset link sent to your email"
      // Redirect to success page or show success message
      toast.success('Reset link sent to your email');
    } else {
      toast.error(data.message); // "User not found with this email"
    }
  } catch (error) {
    console.error('Error:', error);
    toast.error('Failed to send reset link');
  }
};
```

---

### 2. **Verify Reset Token**
**Endpoint:** `POST /api/auth/verify-reset-token`

**Purpose:** Validates if a reset token is still valid before showing the reset form

**Request:**
```json
{
  "token": "reset_token_from_url"
}
```

**Response (Success - 200):**
```json
{
  "message": "Reset token is valid",
  "valid": true
}
```

**Response (Error - 400):**
```json
{
  "message": "Invalid or expired reset token",
  "valid": false
}
```

**Frontend Usage Example (React):**
```javascript
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [isValidToken, setIsValidToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/verify-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        });

        const data = await response.json();
        setIsValidToken(data.valid);
        
        if (!data.valid) {
          toast.error('This reset link has expired. Please request a new one.');
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        setIsValidToken(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  if (isLoading) return <div>Verifying link...</div>;
  if (!isValidToken) return <div>Invalid or expired reset link</div>;

  return <ResetPasswordForm token={token} />;
}
```

---

### 3. **Reset Password**
**Endpoint:** `POST /api/auth/reset-password`

**Purpose:** Updates the user's password using the reset token

**Request:**
```json
{
  "token": "reset_token_from_url",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

**Response (Success - 200):**
```json
{
  "message": "Password reset successfully",
  "success": true
}
```

**Response (Error - 400):**
```json
{
  "message": "Invalid or expired reset token"
}
```

**Validation Rules:**
- `token`: Required, must be valid and not expired
- `newPassword`: Required, minimum 6 characters
- `confirmPassword`: Must match `newPassword`

**Frontend Usage Example (React):**
```javascript
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export function ResetPasswordForm({ token }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Client-side validation
    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password reset successfully! Please login with your new password.');
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while resetting password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        placeholder="New Password"
        value={formData.newPassword}
        onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
        required
        minLength="6"
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={formData.confirmPassword}
        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
        required
        minLength="6"
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}
```

---

## Frontend Implementation Checklist

### 1. **Forgot Password Page/Component**
- [ ] Create a form with email input
- [ ] Add form validation (email format)
- [ ] Call `/api/auth/forgot-password` endpoint
- [ ] Show success message after submission
- [ ] Handle error messages from backend
- [ ] Add loading state during request
- [ ] Disable submit button while loading

### 2. **Email Link Handling**
- [ ] Create a reset password page/route
- [ ] Extract token from URL query parameter: `?token=xxx`
- [ ] Call `/api/auth/verify-reset-token` on page load
- [ ] Show error if token is invalid/expired
- [ ] Show loading state while verifying token

### 3. **Reset Password Form**
- [ ] Create form with:
  - [ ] New password input
  - [ ] Confirm password input
  - [ ] Password visibility toggle (optional)
- [ ] Implement client-side validation:
  - [ ] Password length (minimum 6 characters)
  - [ ] Passwords match
- [ ] Call `/api/auth/reset-password` endpoint
- [ ] Show success message and redirect to login
- [ ] Handle error messages from backend

### 4. **User Experience**
- [ ] Add password strength indicator (optional)
- [ ] Show remaining time before token expires (optional)
- [ ] Provide link to request new reset token if expired
- [ ] Clear sensitive data on page unload
- [ ] Show toast/snackbar notifications

---

## Integration Examples

### Using Axios
```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const forgotPassword = (email) => {
  return api.post('/api/auth/forgot-password', { email });
};

export const verifyResetToken = (token) => {
  return api.post('/api/auth/verify-reset-token', { token });
};

export const resetPassword = (token, newPassword, confirmPassword) => {
  return api.post('/api/auth/reset-password', {
    token,
    newPassword,
    confirmPassword
  });
};

// Usage
try {
  await forgotPassword('user@example.com');
  toast.success('Reset link sent to your email');
} catch (error) {
  toast.error(error.response.data.message);
}
```

### Using React Hook Form + Zod
```javascript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function ResetPasswordForm({ token }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword
        })
      });

      if (response.ok) {
        toast.success('Password reset successful!');
      } else {
        const error = await response.json();
        toast.error(error.message);
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('newPassword')}
        type="password"
        placeholder="New Password"
      />
      {errors.newPassword && <span>{errors.newPassword.message}</span>}

      <input
        {...register('confirmPassword')}
        type="password"
        placeholder="Confirm Password"
      />
      {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}
```

---

## Environment Setup

Add these variables to your `.env.local` file:

```env
REACT_APP_API_URL=http://localhost:5000
```

---

## Email Content

The user will receive an email with:
- **Subject:** Password Reset Request - Eco Organic Natural Foods
- **Link Expiration:** 1 hour
- **Design:** Professional HTML template

The email includes:
- Personalized greeting with user's name
- A clickable "Reset Password" button
- Fallback link for clients that don't render HTML
- Expiration time warning
- Security notice

---

## Security Considerations

1. **Token Security:**
   - Tokens are generated using `crypto.randomBytes(32)`
   - Stored as SHA256 hash in database (not plain text)
   - Expire after 1 hour
   - Single use only (cleared after password reset)

2. **Frontend Security:**
   - Never store reset tokens in localStorage
   - Use HTTPS in production
   - Validate email format on client
   - Never send passwords in query parameters

3. **Backend Security:**
   - Always validate token on server
   - Hash tokens before comparison
   - Check token expiration
   - Use CORS properly
   - Implement rate limiting (optional)

---

## Common Issues & Solutions

### Issue: Reset link not working
**Solution:** 
- Verify `FRONTEND_URL` environment variable is correct
- Check that token is properly extracted from URL
- Ensure browser allows query parameters in URLs

### Issue: Email not received
**Solution:**
- Verify `RESEND_API_KEY` is correct
- Check email is properly formatted
- Check spam/junk folder
- Verify `RESEND_FROM_EMAIL` is a verified sender domain

### Issue: "Invalid or expired reset token"
**Solution:**
- Token has expired (1-hour limit)
- Token was already used
- User requested a new reset after first request

### Issue: "Password must be at least 6 characters"
**Solution:**
- Ensure new password is at least 6 characters long
- Show password requirements to user

### Issue: CORS errors
**Solution:**
- Backend CORS should allow your frontend origin
- Check headers in network requests
- Use credentials: 'include' if needed

---

## Testing the Flow

1. **Test Forgot Password:**
   ```
   POST /api/auth/forgot-password
   Body: { "email": "test@example.com" }
   Expected: Success message
   ```

2. **Check Email:**
   - Look for email from noreply@ecoorganicfoods.com
   - Click reset password link

3. **Verify Token:**
   ```
   POST /api/auth/verify-reset-token
   Body: { "token": "token_from_email" }
   Expected: { "valid": true }
   ```

4. **Reset Password:**
   ```
   POST /api/auth/reset-password
   Body: {
     "token": "token_from_email",
     "newPassword": "newPass123",
     "confirmPassword": "newPass123"
   }
   Expected: Success message
   ```

5. **Test Login:**
   - Try logging in with new password
   - Should be successful

---

## Rate Limiting (Optional Enhancement)

For production, consider adding rate limiting to prevent abuse:

```javascript
// Backend - using express-rate-limit
const rateLimit = require('express-rate-limit');

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per window
  message: 'Too many password reset requests, please try again later'
});

router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
```

---

## Component Templates

### Forgot Password Component
```javascript
import { useState } from 'react';
import { toast } from 'react-toastify';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        toast.success('Reset link sent to your email!');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="success-message">
        <h2>Check Your Email</h2>
        <p>We've sent a password reset link to {email}</p>
        <p>The link will expire in 1 hour</p>
        <button onClick={() => setIsSubmitted(false)}>Send Again</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Reset Your Password</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send Reset Link'}
      </button>
    </form>
  );
}
```

---

## Support

For issues or questions about the forgot password implementation, please check:
- Backend logs for email sending errors
- Browser console for frontend errors
- Network tab in browser DevTools to inspect API requests
