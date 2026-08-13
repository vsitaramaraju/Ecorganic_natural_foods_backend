# Multi-Image Upload API Documentation

## Overview
Backend now supports direct image uploads from frontend for both **Products** and **Categories**. Images are processed and stored in the `/uploads` folder, with only file paths stored in the database.

**Key Changes:**
- ❌ `imageUrl` field in request body is **no longer accepted** for products
- ✅ First uploaded image automatically becomes the primary image
- ✅ All uploaded images are stored in database with their file paths
- ✅ Both products and categories support multiple images
- ✅ Primary image for listing/thumbnail comes from first uploaded image

---

## PRODUCTS - Multi-Image Upload

### Create Product with Images

**Endpoint:** `POST /api/products`  
**Authentication:** Required (Admin only)  
**Content-Type:** `multipart/form-data`

#### Request Format

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Form Fields:**
```
name                 (string, required) - Product name
description          (string, required) - Product description
price                (number, required) - Product price
categoryId           (number, required) - Category ID
stock                (number, required) - Stock quantity
priceUnit            (string, optional)  - "fixed" or "per_Xg" or "per_Xkg"
images               (file[], required)  - Min 1, Max 10 images (jpg, png, gif, webp)
```

**Note:** `imageUrl` field is NO LONGER ACCEPTED. Use file upload instead.

#### Frontend Example - JavaScript/Fetch

```javascript
async function createProductWithImages(productData, imageFiles) {
  const token = localStorage.getItem('adminToken');
  
  // Create FormData
  const formData = new FormData();
  formData.append('name', productData.name);
  formData.append('description', productData.description);
  formData.append('price', productData.price);
  formData.append('categoryId', productData.categoryId);
  formData.append('stock', productData.stock);
  formData.append('priceUnit', productData.priceUnit || 'fixed');
  
  // Add multiple image files
  imageFiles.forEach(file => {
    formData.append('images', file);  // Same field name for all files
  });

  try {
    const response = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error:', error.error);
      return null;
    }

    const product = await response.json();
    console.log('Product created:', product);
    return product;
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// Usage
const files = document.getElementById('imageInput').files;
const productData = {
  name: 'Organic Apples',
  description: 'Fresh organic red apples from the farm',
  price: 250,
  categoryId: 1,
  stock: 100,
  priceUnit: 'fixed'
};

createProductWithImages(productData, Array.from(files));
```

#### Frontend Example - React

```jsx
import React, { useState } from 'react';

function ProductUpload() {
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: 1,
    stock: '',
    priceUnit: 'fixed'
  });

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('categoryId', formData.categoryId);
    data.append('stock', formData.stock);
    data.append('priceUnit', formData.priceUnit);

    // Add all image files
    images.forEach(image => {
      data.append('images', image);
    });

    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      if (response.ok) {
        const product = await response.json();
        alert('Product created successfully!');
        console.log('Product ID:', product.id);
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      alert('Request failed: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        placeholder="Product Name"
        value={formData.name}
        onChange={handleInputChange}
        required
      />
      <textarea
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={handleInputChange}
        required
      />
      <input
        type="number"
        name="price"
        placeholder="Price"
        value={formData.price}
        onChange={handleInputChange}
        required
      />
      <input
        type="number"
        name="categoryId"
        placeholder="Category ID"
        value={formData.categoryId}
        onChange={handleInputChange}
      />
      <input
        type="number"
        name="stock"
        placeholder="Stock"
        value={formData.stock}
        onChange={handleInputChange}
        required
      />
      <select name="priceUnit" value={formData.priceUnit} onChange={handleInputChange}>
        <option value="fixed">Fixed Price</option>
        <option value="per_100g">Per 100g</option>
        <option value="per_500g">Per 500g</option>
        <option value="per_1kg">Per 1kg</option>
      </select>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageChange}
        required
      />
      <small>Upload 1-10 images (JPG, PNG, GIF, WebP)</small>

      <button type="submit">Create Product</button>
    </form>
  );
}

export default ProductUpload;
```

#### Response Example - Success (201)

```json
{
  "id": 5,
  "name": "Organic Apples",
  "description": "Fresh organic red apples from the farm",
  "price": 250,
  "priceUnit": "fixed",
  "stock": 100,
  "imageUrl": "/uploads/apple-1691234567890-12345.jpg",
  "categoryId": 1,
  "createdAt": "2026-08-11T10:30:00.000Z",
  "images": [
    {
      "id": 1,
      "productId": 5,
      "imageUrl": "/uploads/apple-1691234567890-12345.jpg",
      "createdAt": "2026-08-11T10:30:00.000Z"
    },
    {
      "id": 2,
      "productId": 5,
      "imageUrl": "/uploads/apple-1691234567890-67890.jpg",
      "createdAt": "2026-08-11T10:30:01.000Z"
    },
    {
      "id": 3,
      "productId": 5,
      "imageUrl": "/uploads/apple-1691234567890-11111.png",
      "createdAt": "2026-08-11T10:30:02.000Z"
    }
  ],
  "category": {
    "id": 1,
    "name": "Fruits",
    "imageUrl": "/uploads/fruits-category.jpg"
  }
}
```

#### Error Responses

**Missing images (400):**
```json
{
  "error": "At least one product image is required"
}
```

**Invalid file type (400):**
```json
{
  "error": "Invalid file type. File: wrongfile.txt (text/plain). Allowed: jpg, jpeg, png, gif, webp"
}
```

---

### Update Product with Images

**Endpoint:** `PUT /api/products/:id`  
**Authentication:** Required (Admin only)

#### Request Format

Same as create, but only fields to update need to be sent.

**Optional Fields:**
- `name` - Product name
- `description` - Product description
- `price` - Product price
- `categoryId` - Category ID
- `stock` - Stock quantity
- `priceUnit` - Price unit
- `images` - New image files (optional)
- `replaceImages` - "true" to delete old images when adding new ones (optional)

#### Frontend Example

```javascript
async function updateProduct(productId, updates, newImages) {
  const token = localStorage.getItem('adminToken');
  
  const formData = new FormData();
  
  if (updates.name) formData.append('name', updates.name);
  if (updates.description) formData.append('description', updates.description);
  if (updates.price) formData.append('price', updates.price);
  if (updates.stock) formData.append('stock', updates.stock);
  if (updates.categoryId) formData.append('categoryId', updates.categoryId);
  
  // Add new images if provided
  if (newImages && newImages.length > 0) {
    newImages.forEach(file => {
      formData.append('images', file);
    });
    
    // Set replaceImages to true to delete old images
    formData.append('replaceImages', 'true');
  }

  try {
    const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (response.ok) {
      const product = await response.json();
      console.log('Product updated:', product);
    }
  } catch (error) {
    console.error('Update failed:', error);
  }
}

// Usage: Add images to existing product
updateProduct(5, {}, Array.from(document.getElementById('newImagesInput').files));

// Usage: Replace all images
updateProduct(5, {}, Array.from(document.getElementById('newImagesInput').files));
```

#### Response Example (200)

```json
{
  "message": "Product updated successfully",
  "product": {
    "id": 5,
    "name": "Organic Apples",
    "description": "Fresh organic red apples from the farm",
    "price": 250,
    "imageUrl": "/uploads/apple-new-1691234567890.jpg",
    "images": [
      {
        "id": 4,
        "productId": 5,
        "imageUrl": "/uploads/apple-new-1691234567890.jpg"
      }
    ]
  }
}
```

---

### Get Product with All Images

**Endpoint:** `GET /api/products/:id`  
**Authentication:** Not required

#### Response Example (200)

```json
{
  "id": 5,
  "name": "Organic Apples",
  "description": "Fresh organic red apples from the farm",
  "price": 250,
  "priceUnit": "fixed",
  "stock": 100,
  "imageUrl": "/uploads/apple-1691234567890-12345.jpg",
  "categoryId": 1,
  "createdAt": "2026-08-11T10:30:00.000Z",
  "category": {
    "id": 1,
    "name": "Fruits",
    "imageUrl": "/uploads/fruits-category.jpg"
  },
  "images": [
    {
      "id": 1,
      "productId": 5,
      "imageUrl": "/uploads/apple-1691234567890-12345.jpg",
      "createdAt": "2026-08-11T10:30:00.000Z"
    },
    {
      "id": 2,
      "productId": 5,
      "imageUrl": "/uploads/apple-1691234567890-67890.jpg",
      "createdAt": "2026-08-11T10:30:01.000Z"
    },
    {
      "id": 3,
      "productId": 5,
      "imageUrl": "/uploads/apple-1691234567890-11111.png",
      "createdAt": "2026-08-11T10:30:02.000Z"
    }
  ],
  "reviewSummary": {
    "averageRating": 4.5,
    "totalReviews": 2
  }
}
```

#### Frontend Example - React Image Gallery

```jsx
import React, { useState, useEffect } from 'react';

function ProductDetails({ productId }) {
  const [product, setProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    fetch(`http://localhost:5000/api/products/${productId}`)
      .then(res => res.json())
      .then(data => setProduct(data));
  }, [productId]);

  if (!product) return <div>Loading...</div>;

  const images = product.images || [];
  const currentImage = images[selectedImageIndex];

  return (
    <div className="product-details">
      <div className="image-viewer">
        {/* Main Image */}
        <img
          src={`http://localhost:5000${currentImage?.imageUrl || product.imageUrl}`}
          alt={product.name}
          className="main-image"
        />

        {/* Thumbnail Gallery */}
        <div className="thumbnails">
          {images.map((image, index) => (
            <img
              key={image.id}
              src={`http://localhost:5000${image.imageUrl}`}
              alt={`${product.name} - ${index + 1}`}
              className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
              onClick={() => setSelectedImageIndex(index)}
            />
          ))}
        </div>
      </div>

      <div className="product-info">
        <h1>{product.name}</h1>
        <p className="description">{product.description}</p>
        <p className="price">₹{product.price}</p>
        <p className="category">{product.category.name}</p>
        <p className="stock">Stock: {product.stock}</p>
      </div>
    </div>
  );
}

export default ProductDetails;
```

---

## CATEGORIES - Multi-Image Upload

### Create Category with Images

**Endpoint:** `POST /api/categories`  
**Authentication:** Required (Admin only)

#### Request Format

**Form Fields:**
```
name                 (string, required)  - Category name
images               (file[], required)  - Min 1, Max 10 images
```

**Note:** `imageUrl` field is NO LONGER ACCEPTED. Use file upload instead.

#### Frontend Example - JavaScript

```javascript
async function createCategoryWithImages(categoryName, imageFiles) {
  const token = localStorage.getItem('adminToken');
  
  const formData = new FormData();
  formData.append('name', categoryName);
  
  // Add multiple image files
  imageFiles.forEach(file => {
    formData.append('images', file);
  });

  try {
    const response = await fetch('http://localhost:5000/api/categories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error:', error.error);
      return null;
    }

    const category = await response.json();
    console.log('Category created:', category);
    return category;
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// Usage
const files = document.getElementById('categoryImageInput').files;
createCategoryWithImages('Vegetables', Array.from(files));
```

#### Response Example - Success (201)

```json
{
  "id": 3,
  "name": "Vegetables",
  "imageUrl": "/uploads/vegetables-1691234567890.jpg",
  "createdAt": "2026-08-11T10:35:00.000Z",
  "images": [
    {
      "id": 1,
      "categoryId": 3,
      "imageUrl": "/uploads/vegetables-1691234567890.jpg",
      "createdAt": "2026-08-11T10:35:00.000Z"
    },
    {
      "id": 2,
      "categoryId": 3,
      "imageUrl": "/uploads/vegetables-1691234567890-second.jpg",
      "createdAt": "2026-08-11T10:35:01.000Z"
    }
  ]
}
```

---

### Update Category with Images

**Endpoint:** `PUT /api/categories/:id`  
**Authentication:** Required (Admin only)

#### Request Format

**Optional Fields:**
- `name` - Category name
- `images` - New image files (optional)
- `replaceImages` - "true" to delete old images (optional)

#### Frontend Example

```javascript
async function updateCategory(categoryId, categoryName, newImages) {
  const token = localStorage.getItem('adminToken');
  
  const formData = new FormData();
  if (categoryName) {
    formData.append('name', categoryName);
  }
  
  if (newImages && newImages.length > 0) {
    newImages.forEach(file => {
      formData.append('images', file);
    });
    formData.append('replaceImages', 'true');
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/categories/${categoryId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      }
    );

    if (response.ok) {
      const result = await response.json();
      console.log('Category updated:', result.category);
    }
  } catch (error) {
    console.error('Update failed:', error);
  }
}
```

#### Response Example (200)

```json
{
  "message": "Category updated successfully",
  "category": {
    "id": 3,
    "name": "Vegetables",
    "imageUrl": "/uploads/vegetables-new-1691234567890.jpg",
    "createdAt": "2026-08-11T10:35:00.000Z",
    "images": [
      {
        "id": 3,
        "categoryId": 3,
        "imageUrl": "/uploads/vegetables-new-1691234567890.jpg"
      }
    ]
  }
}
```

---

### Get All Categories with Images

**Endpoint:** `GET /api/categories`  
**Authentication:** Not required

#### Response Example (200)

```json
[
  {
    "id": 1,
    "name": "Fruits",
    "imageUrl": "/uploads/fruits-1691234567890.jpg",
    "createdAt": "2026-08-11T10:30:00.000Z",
    "images": [
      {
        "id": 1,
        "categoryId": 1,
        "imageUrl": "/uploads/fruits-1691234567890.jpg",
        "createdAt": "2026-08-11T10:30:00.000Z"
      }
    ]
  },
  {
    "id": 2,
    "name": "Vegetables",
    "imageUrl": "/uploads/vegetables-1691234567890.jpg",
    "createdAt": "2026-08-11T10:35:00.000Z",
    "images": [
      {
        "id": 2,
        "categoryId": 2,
        "imageUrl": "/uploads/vegetables-1691234567890.jpg"
      }
    ]
  }
]
```

---

## Image URL Format

All returned image URLs follow this format:
```
/uploads/filename-timestamp-randomId.extension
```

**To display images in frontend:**
```html
<img src="http://localhost:5000/uploads/filename.jpg" alt="Product" />
```

Or with base URL:
```javascript
const BASE_URL = 'http://localhost:5000';
const imageUrl = `${BASE_URL}/uploads/filename.jpg`;
```

---

## File Upload Rules

### Allowed Formats
| Extension | MIME Type | Status |
|-----------|-----------|--------|
| .jpg | image/jpeg | ✅ Accepted |
| .jpeg | image/jpeg | ✅ Accepted |
| .png | image/png | ✅ Accepted |
| .gif | image/gif | ✅ Accepted |
| .webp | image/webp | ✅ Accepted |

### File Limits
- **Max file size:** 10 MB per image
- **Max files per request:** 10 images
- **Min files required:** 1 image

---

## Curl Examples

### Create Product with Images

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=Organic Apples" \
  -F "description=Fresh organic red apples" \
  -F "price=250" \
  -F "categoryId=1" \
  -F "stock=100" \
  -F "priceUnit=fixed" \
  -F "images=@C:\path\to\image1.jpg" \
  -F "images=@C:\path\to\image2.jpg"
```

### Create Category with Images

```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=Vegetables" \
  -F "images=@C:\path\to\category-image.jpg"
```

### Get Product

```bash
curl -X GET http://localhost:5000/api/products/5
```

### Update Product Images

```bash
curl -X PUT http://localhost:5000/api/products/5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "replaceImages=true" \
  -F "images=@C:\path\to\new-image1.jpg" \
  -F "images=@C:\path\to\new-image2.jpg"
```

---

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| "At least one product image is required" | No files uploaded | Attach image files in request |
| "Invalid file type" | Wrong file extension | Use .jpg, .png, .gif, or .webp |
| "File too large" | File exceeds 10MB | Compress images before upload |
| "403 Forbidden" | Not admin user or invalid token | Use admin JWT token |
| "Category not found" | Invalid category ID | Check category ID exists |

---

## Key Implementation Notes

1. **No more direct imageUrl** - Images must be uploaded as files
2. **First image is primary** - First uploaded image becomes `imageUrl` field
3. **All images stored** - Every uploaded image gets a database record
4. **File paths only in DB** - Actual files stored in `/uploads` folder
5. **Cascade delete** - Deleting product/category deletes related images from filesystem

---

**Last Updated:** 2026-08-11  
**Status:** Ready for production  
**Version:** 2.0 (Multi-image support)
