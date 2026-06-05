# Forgot Password API Documentation

## Overview
This implementation adds a complete password reset functionality to your authentication system. It includes:

1. **Forgot Password Request** - User requests password reset via email
2. **Password Reset** - User resets password using the reset token
3. **Token Verification** - Verify if a reset token is still valid

## API Endpoints

### 1. Request Password Reset
**POST** `/api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "message": "Password reset link sent to your email",
  "success": true
}
```

**Response (Error - User not found):**
```json
{
  "message": "User not found with this email"
}
```

---

### 2. Reset Password
**POST** `/api/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

**Response (Success):**
```json
{
  "message": "Password reset successfully",
  "success": true
}
```

**Response (Error - Invalid token):**
```json
{
  "message": "Invalid or expired reset token"
}
```

---

### 3. Verify Reset Token
**POST** `/api/auth/verify-reset-token`

**Request Body:**
```json
{
  "token": "reset_token_from_email"
}
```

**Response (Success):**
```json
{
  "message": "Reset token is valid",
  "valid": true
}
```

**Response (Error):**
```json
{
  "message": "Invalid or expired reset token",
  "valid": false
}
```

---

## Environment Variables Required

Add the following variables to your `.env` file:

```env
# Email Configuration
EMAIL_SERVICE=gmail  # or your email service provider
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password  # For Gmail: Generate an App Password
FRONTEND_URL=http://localhost:5173  # Your frontend URL for reset link

# Existing variables
JWT_SECRET=your_jwt_secret
DATABASE_URL=postgresql://user:password@localhost:5432/natural_foods_db
```

### Gmail Setup Instructions:
1. Go to Google Account Security Settings: https://myaccount.google.com/security
2. Enable 2-Step Verification if not enabled
3. Generate App Password:
   - Go to App passwords
   - Select "Mail" and "Windows Computer"
   - Copy the generated password to `EMAIL_PASSWORD` in .env

### Using Other Email Services:
- **SendGrid**: Set `EMAIL_SERVICE=SendGrid` and configure authentication
- **Mailgun**: Similar setup with service credentials
- **Nodemailer SMTP**: Configure custom SMTP server

---

## Database Schema Changes

The following fields were added to the `User` model:

```prisma
model User {
  // ... existing fields ...
  resetToken        String?      // Hashed reset token
  resetTokenExpiry  DateTime?    // Token expiration time (1 hour from creation)
  // ... existing fields ...
}
```

---

## Frontend Integration Example

### 1. Forgot Password Form
```javascript
async function handleForgotPassword(email) {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  const data = await response.json();
  if (response.ok) {
    alert('Reset link sent to your email');
  } else {
    alert(data.message);
  }
}
```

### 2. Reset Password Form (with token from email link)
```javascript
async function handleResetPassword(token, newPassword, confirmPassword) {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword, confirmPassword })
  });
  
  const data = await response.json();
  if (response.ok) {
    alert('Password reset successfully');
    // Redirect to login
  } else {
    alert(data.message);
  }
}
```

### 3. Verify Token on Reset Page Load
```javascript
async function verifyResetToken(token) {
  const response = await fetch('/api/auth/verify-reset-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  
  const data = await response.json();
  return data.valid;
}
```

---

## Security Features

1. **Token Hashing**: Reset tokens are hashed before storing in database
2. **Token Expiry**: Tokens expire after 1 hour
3. **Password Validation**: Minimum 6 characters and password confirmation required
4. **Unique Email**: Ensures password reset is done for correct user
5. **Token Invalidation**: Token is cleared after successful password reset

---

## Error Handling

All endpoints follow a consistent error handling pattern:
- **400**: Bad request (validation errors, invalid token, user not found)
- **500**: Internal server error

Example error responses:
```json
{
  "message": "Error message here"
}
```

---

## Files Modified/Created

1. **prisma/schema.prisma** - Added reset token fields to User model
2. **src/utils/emailService.js** - NEW: Email sending service
3. **controllers/authController.js** - Added forgot password endpoints
4. **routes/authRoutes.js** - Added new routes
5. **prisma/migrations/** - NEW: Database migration

---

## Testing the API

### Using cURL or Postman:

**1. Request Password Reset:**
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

**2. Reset Password:**
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token":"<reset_token_from_email>",
    "newPassword":"newPassword123",
    "confirmPassword":"newPassword123"
  }'
```

**3. Verify Token:**
```bash
curl -X POST http://localhost:5000/api/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{"token":"<reset_token_from_email>"}'
```

---

## Next Steps

1. Update your `.env` file with email configuration
2. Test the endpoints with Postman or similar tool
3. Integrate with your frontend
4. Test complete flow: forgot password → email → reset password

