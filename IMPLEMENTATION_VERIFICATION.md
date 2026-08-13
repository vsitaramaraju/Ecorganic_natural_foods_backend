# Implementation Verification Checklist

## Changes Summary

### ✅ Products - Multi-Image Upload

**What Changed:**
- ❌ Removed `imageUrl` from request body handling
- ✅ Images must now be uploaded via multipart/form-data
- ✅ First uploaded image automatically becomes primary image (`imageUrl` field)
- ✅ All uploaded images stored in ProductImage table
- ✅ GET endpoints return images array with all image URLs

**Files Modified:**
- `controllers/productController.js` - Updated createProduct()
- `controllers/adminProductController.js` - Updated buildProductUpdateData() and updateProductForAdmin()
- `routes/productRoutes.js` - Already had multer middleware

**Database:**
- ProductImage table - Already exists (created in earlier migration)
- Schema already includes one-to-many relationship

---

### ✅ Categories - Multi-Image Upload

**What Changed:**
- ❌ Removed `imageUrl` from request body handling
- ✅ Images must now be uploaded via multipart/form-data
- ✅ First uploaded image automatically becomes primary image
- ✅ All uploaded images stored in CategoryImage table
- ✅ GET endpoints return images array

**Files Modified:**
- `prisma/schema.prisma` - Added CategoryImage model with relationship
- `prisma/migrations/20260811_add_category_images/migration.sql` - Created CategoryImage table
- `controllers/categoryController.js` - Updated all methods (create, update, delete)
- `routes/categoryRoutes.js` - Added multer middleware to POST and PUT routes

**Database:**
- CategoryImage table - Created with migration
- Relationship - Category has many CategoryImages with CASCADE delete
- Index - Created on categoryId for performance

---

## Verification Steps

### Step 1: Database Schema Verification

```sql
-- Check if CategoryImage table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'CategoryImage';

-- Check CategoryImage structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'CategoryImage';

-- Verify no data in CategoryImage (fresh migration)
SELECT COUNT(*) FROM "CategoryImage";
```

**Expected Output:**
- CategoryImage table exists
- Columns: id, categoryId, imageUrl, createdAt
- Count: 0 rows (fresh table)

---

### Step 2: API Endpoint Verification

#### 2a. Create Category with Images (Test multipart support)

**Command:**
```bash
# PowerShell
$token = "YOUR_JWT_TOKEN"
$file1 = "C:\path\to\test-image1.jpg"
$file2 = "C:\path\to\test-image2.jpg"

curl -X POST http://localhost:5000/api/categories `
  -H "Authorization: Bearer $token" `
  -F "name=TestCategory" `
  -F "images=@$file1" `
  -F "images=@$file2"
```

**Expected Response (201):**
```json
{
  "id": <new-id>,
  "name": "TestCategory",
  "imageUrl": "/uploads/...",
  "images": [
    { "id": <id>, "categoryId": <cat-id>, "imageUrl": "/uploads/..." },
    { "id": <id>, "categoryId": <cat-id>, "imageUrl": "/uploads/..." }
  ]
}
```

**Verification Points:**
- ✅ Status 201 (Created)
- ✅ `imageUrl` is set to first image path
- ✅ `images` array contains both uploaded images
- ✅ Files exist in `/uploads` folder

---

#### 2b. Create Product with Images

**Command:**
```bash
$token = "YOUR_JWT_TOKEN"

curl -X POST http://localhost:5000/api/products `
  -H "Authorization: Bearer $token" `
  -F "name=TestProduct" `
  -F "description=Test product" `
  -F "price=100" `
  -F "categoryId=1" `
  -F "stock=50" `
  -F "priceUnit=fixed" `
  -F "images=@C:\path\to\product-image.jpg"
```

**Expected Response (201):**
```json
{
  "id": <new-id>,
  "name": "TestProduct",
  "price": 100,
  "imageUrl": "/uploads/...",
  "images": [
    { "id": <id>, "productId": <prod-id>, "imageUrl": "/uploads/..." }
  ]
}
```

**Verification Points:**
- ✅ Status 201 (Created)
- ✅ `imageUrl` is set to uploaded image path
- ✅ `images` array contains uploaded image

---

#### 2c. Get Product with Images

**Command:**
```bash
curl -X GET http://localhost:5000/api/products/<product-id>
```

**Expected Response (200):**
- ✅ Product data includes `imageUrl` (primary image)
- ✅ `images` array populated with all image records
- ✅ Each image has `id`, `productId`, `imageUrl`, `createdAt`

---

#### 2d. Get All Categories with Images

**Command:**
```bash
curl -X GET http://localhost:5000/api/categories
```

**Expected Response (200):**
- ✅ Each category includes `imageUrl`
- ✅ Each category includes `images` array
- ✅ Images array populated with all image records

---

#### 2e. Update Product (Add More Images)

**Command:**
```bash
$token = "YOUR_JWT_TOKEN"

curl -X PUT http://localhost:5000/api/products/<product-id> `
  -H "Authorization: Bearer $token" `
  -F "images=@C:\path\to\new-image.jpg"
```

**Expected Response (200):**
- ✅ New image added to images array
- ✅ `imageUrl` NOT changed (first image remains primary)
- ✅ Old images still present in images array

---

#### 2f. Replace Product Images

**Command:**
```bash
$token = "YOUR_JWT_TOKEN"

curl -X PUT http://localhost:5000/api/products/<product-id> `
  -H "Authorization: Bearer $token" `
  -F "replaceImages=true" `
  -F "images=@C:\path\to\replacement-image.jpg"
```

**Expected Response (200):**
- ✅ Old images deleted from database
- ✅ Old image files deleted from `/uploads`
- ✅ New image is only one in images array
- ✅ `imageUrl` updated to new image

---

### Step 3: Error Handling Verification

#### 3a. Missing Images

**Command:**
```bash
curl -X POST http://localhost:5000/api/categories `
  -H "Authorization: Bearer $token" `
  -F "name=TestCategory"
```

**Expected Response (400):**
```json
{
  "error": "At least one category image is required"
}
```

---

#### 3b. Invalid File Type

**Command:**
```bash
# Upload a .txt file instead of image
curl -X POST http://localhost:5000/api/categories `
  -H "Authorization: Bearer $token" `
  -F "name=TestCategory" `
  -F "images=@C:\path\to\file.txt"
```

**Expected Response (400):**
```json
{
  "error": "Invalid file type. File: file.txt (text/plain). Allowed: jpg, jpeg, png, gif, webp"
}
```

---

#### 3c. Unauthorized (Missing Token)

**Command:**
```bash
curl -X POST http://localhost:5000/api/categories `
  -F "name=TestCategory" `
  -F "images=@C:\path\to\image.jpg"
```

**Expected Response (401):**
```json
{
  "error": "Access token is missing"
}
```

---

### Step 4: File System Verification

**Check uploaded files:**
```bash
# List files in uploads folder
dir e:\ecoorganic-webbuild\backend\Ecorganic_natural_foods_backend\uploads\

# Verify file accessibility
# Open browser: http://localhost:5000/uploads/filename.jpg
```

**Expected:**
- ✅ Files exist with pattern: `filename-timestamp-randomid.extension`
- ✅ Files accessible via static serving route
- ✅ Files display correctly in browser

---

### Step 5: Data Consistency Verification

**Check database consistency:**
```sql
-- Check Product.imageUrl matches first ProductImage.imageUrl
SELECT p.id, p.imageUrl, pi.imageUrl 
FROM "Product" p
LEFT JOIN "ProductImage" pi ON p.id = pi.productId
ORDER BY p.id, pi.id;

-- Check Category.imageUrl matches first CategoryImage.imageUrl
SELECT c.id, c.imageUrl, ci.imageUrl 
FROM "Category" c
LEFT JOIN "CategoryImage" ci ON c.id = ci.categoryId
ORDER BY c.id, ci.id;
```

**Expected:**
- ✅ Product.imageUrl equals first ProductImage.imageUrl for that product
- ✅ Category.imageUrl equals first CategoryImage.imageUrl for that category
- ✅ No NULL imageUrl values for products/categories

---

## Frontend Integration Checklist

- [ ] React component uses FormData for file uploads
- [ ] FormData appends files with key name "images"
- [ ] Multiple files appended with same key name
- [ ] Authorization header includes JWT token
- [ ] Request method is POST (create) or PUT (update)
- [ ] Content-Type header NOT set (let browser set it for multipart)
- [ ] Response parsing handles images array
- [ ] Image URLs displayed with full path: `http://localhost:5000/uploads/...`
- [ ] Primary image shown in list view (from imageUrl field)
- [ ] Additional images shown in detail/gallery view (from images array)
- [ ] Image upload input accepts multiple files
- [ ] Form prevents submission without at least one image
- [ ] Error messages displayed to user

---

## API Changes Summary

### Backward Incompatible Changes

| What | Before | After | Impact |
|------|--------|-------|--------|
| Product Creation | `imageUrl` in body | File upload required | Frontend must use FormData |
| Category Creation | `imageUrl` in body | File upload required | Frontend must use FormData |
| Product Update | `imageUrl` in body | Via file upload | Need to upload files to change image |
| Category Update | `imageUrl` in body | Via file upload | Need to upload files to change image |

### New Features

| Feature | Availability |
|---------|---------------|
| Multiple images per product | Products & Categories |
| Automatic primary image | Uses first uploaded image |
| Image gallery endpoint | Included in images array |
| Bulk image replacement | replaceImages=true flag |
| Automatic file storage | `/uploads` folder |
| Image URL paths in DB | Only paths stored, not files |

---

## Troubleshooting

### Images Not Appearing in Response

**Problem:** images array is empty even after upload
**Solutions:**
1. Check database - `SELECT * FROM "ProductImage" WHERE productId = <id>;`
2. Check server logs for errors
3. Verify migration was applied - `SELECT * FROM "CategoryImage" LIMIT 1;`

### "Cannot POST /api/categories" Error

**Problem:** 404 error when creating category
**Solutions:**
1. Verify migration applied successfully
2. Check /api/categories route is configured
3. Restart server: `node src/server.js`

### Files Not Saved to Uploads

**Problem:** No files in `/uploads` folder
**Solutions:**
1. Check folder permissions
2. Verify `/uploads` folder exists and is writable
3. Check multer configuration in imageUpload.js

### Old Images Still Appearing After Replace

**Problem:** Old images still in database after replacing
**Solutions:**
1. Verify `replaceImages=true` was sent in request
2. Check database - old records should be deleted
3. Manually delete from database: `DELETE FROM "ProductImage" WHERE productId = <id>;`

---

## Production Readiness

- ✅ Database migrations applied
- ✅ Routes updated with multer middleware
- ✅ Error handling implemented
- ✅ File validation in place
- ✅ Cascade delete configured
- ✅ Static file serving configured
- ✅ Documentation provided
- ⚠️ Consider: Image optimization/compression for production
- ⚠️ Consider: CDN for image serving
- ⚠️ Consider: Image cleanup policies (old uploads)

---

**Last Updated:** 2026-08-11  
**Status:** Ready for Testing  
**Next Steps:** Run verification steps above to confirm all functionality
