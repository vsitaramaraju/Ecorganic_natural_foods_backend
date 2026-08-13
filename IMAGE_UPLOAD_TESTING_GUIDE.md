# Image Upload Testing & Troubleshooting Guide

## Overview
This guide helps test the multi-image product upload feature and troubleshoot common issues.

---

## File Upload Requirements

### Supported Formats
- **Extensions**: .jpg, .jpeg, .png, .gif, .webp
- **Max File Size**: 10MB per file
- **Max Files per Request**: 10 images

### File Format Validation
Files are validated by **file extension only** for maximum compatibility:
- The validation checks the filename extension (`.jpg`, `.png`, etc.)
- MIME type is logged for debugging but not strictly enforced
- This approach works across all browsers and systems

**Why extension-based validation?**
- MIME type detection is unreliable across browsers
- Some systems send `image/jpg` while others send `image/jpeg`
- File extension is more predictable and reliable

---

## Testing Image Upload with Admin User

### Prerequisites
1. Get admin JWT token:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

Response will include `"token": "your_jwt_token_here"`

### 2. Create Product with Images (Multipart FormData)

**Using PowerShell:**
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_JWT_TOKEN_HERE"
}

$form = @{
    name = "Organic Apples"
    description = "Fresh organic red apples"
    price = "250"
    categoryId = "1"
    stock = "100"
    priceUnit = "fixed"
    imageUrl = "https://example.com/apple.jpg"  # Main product image
}

# Add image files - use actual image file paths
$filePath1 = "C:\path\to\image1.jpg"  # Replace with actual path
$filePath2 = "C:\path\to\image2.png"  # Replace with actual path

$files = @($filePath1, $filePath2)

# Using Invoke-WebRequest
$body = @{}
$form.Keys | ForEach-Object { $body[$_] = $form[$_] }

# Add files to body (PowerShell multipart handling)
# Note: For complex multipart uploads, consider using curl or API client

curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "name=Organic Apples" \
  -F "description=Fresh organic red apples" \
  -F "price=250" \
  -F "categoryId=1" \
  -F "stock=100" \
  -F "priceUnit=fixed" \
  -F "imageUrl=https://example.com/apple.jpg" \
  -F "images=@C:\path\to\image1.jpg" \
  -F "images=@C:\path\to\image2.jpg"
```

**Replace placeholders:**
- `YOUR_JWT_TOKEN_HERE` - JWT token from login response
- `C:\path\to\imageX.jpg` - Actual file paths on your system
- `categoryId` - Valid category ID (1 for "fruits")

### 3. Verify Upload Success

Check server logs for:
```
✓ File saved: /uploads/image_filename_timestamp.jpg
✓ ProductImage record created
```

Check /uploads folder:
```bash
ls e:\ecoorganic-webbuild\backend\Ecorganic_natural_foods_backend\uploads\
```

Should see files like: `pomegranate-1028703_1920-1786378775918-39873411.jpg`

### 4. Retrieve Product with Images

```bash
curl -X GET "http://localhost:5000/api/products?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

Expected response:
```json
[
  {
    "id": 2,
    "name": "Organic Apples",
    "price": 250,
    "images": [
      {
        "id": 1,
        "productId": 2,
        "imageUrl": "/uploads/image_filename_1.jpg",
        "createdAt": "2026-08-10T16:30:00.000Z"
      },
      {
        "id": 2,
        "productId": 2,
        "imageUrl": "/uploads/image_filename_2.png",
        "createdAt": "2026-08-10T16:30:01.000Z"
      }
    ],
    "category": {...}
  }
]
```

---

## Troubleshooting

### Issue: "Invalid file type" error

**Symptom:**
```
Error: Invalid file type. File: myimage.jpg (application/octet-stream). Allowed: jpg, jpeg, png, gif, webp
```

**Cause:**
- File extension is not recognized (typo in filename)
- File is not actually an image file

**Solution:**
- Verify file extension is one of: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- Check file is actually an image (try opening it)
- Ensure no spaces or special characters in filename

---

### Issue: "File too large" error

**Symptom:**
```
Error: File too large (received: 15MB, limit: 10MB)
```

**Solution:**
- Compress images before upload
- Use online tools: TinyPNG, ImageCompressor
- Resize images: 1920x1080 or less is sufficient

---

### Issue: Files uploaded but not appearing in /uploads folder

**Symptom:**
- No error message but /uploads folder is empty
- ProductImage records not created

**Cause:**
- /uploads folder not writable by Node process
- Path configuration issue

**Solution:**
1. Verify /uploads folder exists:
```bash
Test-Path "e:\ecoorganic-webbuild\backend\Ecorganic_natural_foods_backend\uploads"
```

2. Check folder permissions (Windows):
```bash
icacls "e:\ecoorganic-webbuild\backend\Ecorganic_natural_foods_backend\uploads" /grant:r "%USERNAME%":F
```

3. Restart server if permissions were changed

---

### Issue: "ProductImage creation failed" error

**Symptom:**
```
Error: ProductImage creation failed
```

**Cause:**
- Database not synced with schema
- Migration not applied
- Prisma cache outdated

**Solution:**
```bash
# Reset database with latest migrations
npx prisma migrate reset --force

# Or if using Node directly:
node -e "const { exec } = require('child_process'); exec('npx prisma migrate reset --force', (e, out, err) => console.log(out, err))"

# Restart server
node src/server.js
```

---

### Issue: "Unauthorized" or "403 Forbidden" error

**Symptom:**
```
Error: 403 Forbidden - Admin access required
```

**Cause:**
- Invalid/expired JWT token
- User is not admin

**Solution:**
1. Get fresh admin token:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

2. Use token in Authorization header:
```bash
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## Quick Testing Checklist

- [ ] Admin login successful (got JWT token)
- [ ] Create product endpoint returns 201 status
- [ ] Files appear in /uploads folder
- [ ] ProductImage records created in database
- [ ] GET /api/products includes images array
- [ ] Image files accessible via /uploads/filename
- [ ] Multiple images per product working

---

## Database Verification

Check if ProductImage table exists and has data:

```sql
-- Connect to PostgreSQL
SELECT * FROM "ProductImage" LIMIT 10;

-- Check images for specific product
SELECT id, "imageUrl", "createdAt" 
FROM "ProductImage" 
WHERE "productId" = 2;
```

---

## Frontend Integration

See [PRODUCT_IMAGES_INTEGRATION.md](./PRODUCT_IMAGES_INTEGRATION.md) for:
- React component examples
- Vue component examples
- FormData handling
- Error handling

---

## Common Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 201 | Created successfully | Images uploaded and saved |
| 400 | Bad request | Check form field names and data |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | User is not admin |
| 413 | File too large | Reduce file size (max 10MB) |
| 415 | Unsupported media type | Check file extension |
| 500 | Server error | Check server logs |

---

## Server Logs

Monitor server console for debugging:
- `File saved: /uploads/...` - File upload successful
- `Error uploading file: ...` - File validation failed
- `ProductImage record created` - Database record saved
- `Error creating product:` - Check error details

---

## Getting Help

1. **Check server logs** - Most issues visible in console
2. **Verify file format** - Use .jpg, .png, .gif, .webp only
3. **Check admin credentials** - Must be admin user
4. **Database sync** - Run `npx prisma migrate reset` if needed
5. **Folder permissions** - Ensure /uploads is writable

---

## File Upload Architecture

```
Frontend (FormData)
    ↓
POST /api/products (multipart/form-data)
    ↓
multer middleware (validates & saves files)
    ↓
/uploads/filename_timestamp.ext
    ↓
productController.js (creates Product & ProductImage records)
    ↓
PostgreSQL (Product and ProductImage tables)
    ↓
GET /api/products (returns images array)
    ↓
Frontend (displays images via /uploads/filename)
```

---

**Last Updated:** 2026-08-10
**Status:** Testing in progress
