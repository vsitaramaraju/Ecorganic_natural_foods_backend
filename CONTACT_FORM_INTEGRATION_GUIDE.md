# Contact Form - Frontend Integration Guide

## Overview
The contact form feature allows users to submit their inquiries (name, email, subject, message) which are sent to your admin email (ecorganicplanet@gmail.com) using the Resend email service.

---

## API Endpoint

**Endpoint:** `POST /api/contact/submit`

**Base URL:** `http://localhost:5000` (or your backend URL)

**Full URL:** `http://localhost:5000/api/contact/submit`

---

## Request Format

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Request Body
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "subject": "Question about products",
  "message": "I would like to know more about your organic vegetables..."
}
```

### Field Requirements
- **name** (string, required): User's full name - min 2 characters
- **email** (string, required): Valid email address (format: user@domain.com)
- **subject** (string, required): Subject of the inquiry
- **message** (string, required): Detailed message - minimum 10 characters

---

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Your message has been sent successfully. We will get back to you soon!"
}
```

### Error Responses

**400 - Missing/Invalid Fields**
```json
{
  "success": false,
  "message": "Please provide all required fields: name, email, subject, and message"
}
```

**400 - Invalid Email**
```json
{
  "success": false,
  "message": "Please provide a valid email address"
}
```

**400 - Message Too Short**
```json
{
  "success": false,
  "message": "Message must be at least 10 characters long"
}
```

**500 - Server Error**
```json
{
  "success": false,
  "message": "Failed to send your message. Please try again later.",
  "error": "Error details here"
}
```

---

## Frontend Implementation Example (React)

### 1. Create ContactForm Component

```jsx
import { useState } from 'react';
import axios from 'axios';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/contact/submit',
        formData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setStatus({
          type: 'success',
          message: response.data.message
        });
        // Reset form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to send message. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-form-container">
      <h2>Contact Us</h2>
      
      {status && (
        <div className={`alert alert-${status.type}`}>
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Your Name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="your@email.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="subject">Subject *</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            placeholder="What is this about?"
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">Message *</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows="6"
            placeholder="Your message (minimum 10 characters)"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
```

### 2. Using Fetch API (Alternative)

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await fetch('http://localhost:5000/api/contact/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      setStatus({
        type: 'success',
        message: data.message
      });
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } else {
      setStatus({
        type: 'error',
        message: data.message
      });
    }
  } catch (error) {
    setStatus({
      type: 'error',
      message: 'Network error. Please try again.'
    });
  } finally {
    setLoading(false);
  }
};
```

---

## CSS Styling Example

```css
.contact-form-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 30px;
  background: #f9f9f9;
  border-radius: 8px;
}

.contact-form-container h2 {
  color: #2d5016;
  margin-bottom: 30px;
  text-align: center;
}

.alert {
  padding: 12px 16px;
  margin-bottom: 20px;
  border-radius: 4px;
  font-weight: 500;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2d5016;
  box-shadow: 0 0 0 3px rgba(45, 80, 22, 0.1);
}

.btn-primary {
  background-color: #2d5016;
  color: white;
  padding: 12px 30px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 100%;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1f3610;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

---

## Environment Configuration

### Backend (.env file)
Make sure your backend has these environment variables set:

```
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=noreply@yourdomain.com
ADMIN_EMAIL=ecorganicplanet@gmail.com
FRONTEND_URL=http://localhost:5173
```

---

## Email Workflow

When a user submits the contact form:

1. **User receives a confirmation email** - Acknowledging their message with a summary
2. **Admin receives the inquiry email** - With all details and reply-to set to user's email
3. **Both emails are sent via Resend** - Professional, reliable email delivery

---

## Testing the Feature

### Using cURL (Terminal)
```bash
curl -X POST http://localhost:5000/api/contact/submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "test@example.com",
    "subject": "Product Inquiry",
    "message": "I would like to know more about your organic products and delivery options."
  }'
```

### Using Postman
1. Create new POST request
2. URL: `http://localhost:5000/api/contact/submit`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "name": "John Doe",
  "email": "test@example.com",
  "subject": "Product Inquiry",
  "message": "I would like to know more about your organic products and delivery options."
}
```

---

## Troubleshooting

### Issue: "RESEND_API_KEY not found"
**Solution:** Ensure your `.env` file has `RESEND_API_KEY` set with a valid Resend API key

### Issue: Emails not sending
**Solution:** 
- Verify Resend API key is valid
- Check console logs for error messages
- Verify email addresses are correct
- Ensure backend is running

### Issue: CORS error from frontend
**Solution:** The backend is configured with CORS for `http://localhost:5173`. If your frontend is on different port, update CORS in `src/app.js`:
```javascript
app.use(cors({
  origin: "your-frontend-url",
  credentials: true
}));
```

---

## API Integration Checklist

- [ ] Backend running on correct port
- [ ] Resend API key configured in `.env`
- [ ] Admin email address set correctly
- [ ] Frontend component created
- [ ] Axios/Fetch API integrated
- [ ] Form validation implemented
- [ ] Error handling in place
- [ ] Success message displayed to user
- [ ] Form clears after successful submission
- [ ] Loading state during submission
- [ ] CORS configured properly

---

## Support

For issues with:
- **Resend integration:** Visit https://resend.com/docs
- **Backend API:** Check console logs and error responses
- **Frontend integration:** Verify form data format and API endpoint URL
