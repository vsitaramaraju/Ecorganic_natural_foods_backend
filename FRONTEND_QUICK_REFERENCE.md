# Frontend Integration - Quick Reference

## ⚡ Quick Start

### Create Product with Images

```javascript
const formData = new FormData();
formData.append('name', 'Product Name');
formData.append('description', 'Description');
formData.append('price', 100);
formData.append('categoryId', 1);
formData.append('stock', 50);
formData.append('priceUnit', 'fixed');

// Add multiple images
Array.from(document.getElementById('imageInput').files).forEach(file => {
  formData.append('images', file);  // Same field name for all files
});

const response = await fetch('http://localhost:5000/api/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // DON'T set Content-Type - browser sets it for multipart
  },
  body: formData
});

const product = await response.json();
// product.imageUrl = first uploaded image
// product.images = array of all uploaded images
```

### Create Category with Images

```javascript
const formData = new FormData();
formData.append('name', 'Category Name');

// Add images
imageFiles.forEach(file => formData.append('images', file));

const response = await fetch('http://localhost:5000/api/categories', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const category = await response.json();
```

### Display Product Gallery

```javascript
// Get product with all images
const product = await fetch(`/api/products/${id}`).then(r => r.json());

// Display primary image
document.querySelector('.main-image').src = `http://localhost:5000${product.imageUrl}`;

// Display gallery
const gallery = document.querySelector('.gallery');
product.images.forEach(img => {
  const thumb = document.createElement('img');
  thumb.src = `http://localhost:5000${img.imageUrl}`;
  thumb.addEventListener('click', () => {
    document.querySelector('.main-image').src = thumb.src;
  });
  gallery.appendChild(thumb);
});
```

---

## 📊 Response Structure

### Product Response

```json
{
  "id": 5,
  "name": "Organic Apples",
  "price": 250,
  "imageUrl": "/uploads/apple-1691234567890-12345.jpg",  ← Primary image (use for thumbnail)
  "images": [                                             ← All images (use for gallery)
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
    }
  ],
  "category": { "id": 1, "name": "Fruits", "images": [...] }
}
```

### Category Response

```json
{
  "id": 3,
  "name": "Vegetables",
  "imageUrl": "/uploads/vegetables-1691234567890.jpg",  ← Primary image
  "images": [                                            ← All images
    { "id": 1, "imageUrl": "/uploads/vegetables-..." },
    { "id": 2, "imageUrl": "/uploads/vegetables-..." }
  ]
}
```

---

## 🔑 Key Points

### What Changed from Before

| Aspect | Before | After |
|--------|--------|-------|
| Image input | Send imageUrl as text | Upload image files |
| Primary image | Whatever user sent | First uploaded image |
| Multiple images | Not supported | Fully supported |
| Storage | User URL stored | Files in /uploads |
| Categories | URL in body only | Multi-image with upload |

### Important Rules

1. **FormData Required** - Use FormData for file uploads, not JSON
2. **Multiple Files** - Add each file with same field name: `formData.append('images', file)`
3. **No Content-Type** - Don't set Content-Type header, browser sets it
4. **Authorization** - Always include JWT token in Authorization header
5. **Min 1 Image** - At least one image required for create/update
6. **Max 10 Images** - Maximum 10 images per request
7. **Max 10MB** - Each image max 10MB size

---

## 🎨 React Component Examples

### Upload Product with Images

```jsx
import React, { useState } from 'react';

export function ProductUpload() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    images.forEach(img => formData.append('images', img));

    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setProduct(data);
        alert('Product created successfully!');
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpload}>
      <input type="text" name="name" placeholder="Product Name" required />
      <textarea name="description" placeholder="Description" required />
      <input type="number" name="price" placeholder="Price" required />
      <input type="number" name="categoryId" placeholder="Category ID" required />
      <input type="number" name="stock" placeholder="Stock" required />
      
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => setImages(Array.from(e.target.files))}
        required
      />
      <small>Upload 1-10 images (JPG, PNG, GIF, WebP)</small>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Product'}
      </button>

      {product && (
        <div className="success">
          <p>Product ID: {product.id}</p>
          <p>Images Uploaded: {product.images.length}</p>
        </div>
      )}
    </form>
  );
}
```

### Product Gallery Component

```jsx
export function ProductGallery({ productId }) {
  const [product, setProduct] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  React.useEffect(() => {
    fetch(`http://localhost:5000/api/products/${productId}`)
      .then(r => r.json())
      .then(setProduct);
  }, [productId]);

  if (!product) return <div>Loading...</div>;

  const images = product.images || [];
  const current = images[selectedIdx] || product;

  return (
    <div className="gallery-container">
      <div className="main-image-wrapper">
        <img
          src={`http://localhost:5000${current.imageUrl}`}
          alt={product.name}
          className="main-image"
        />
      </div>

      {images.length > 1 && (
        <div className="thumbnails">
          {images.map((img, idx) => (
            <img
              key={img.id}
              src={`http://localhost:5000${img.imageUrl}`}
              alt={`${product.name} ${idx + 1}`}
              className={`thumbnail ${idx === selectedIdx ? 'active' : ''}`}
              onClick={() => setSelectedIdx(idx)}
            />
          ))}
        </div>
      )}

      <div className="product-info">
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <p className="price">₹{product.price}</p>
      </div>
    </div>
  );
}
```

### Update Product Images

```jsx
export function UpdateProductImages({ productId, onSuccess }) {
  const [images, setImages] = useState([]);
  const [replaceAll, setReplaceAll] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    
    images.forEach(img => formData.append('images', img));
    formData.append('replaceImages', replaceAll.toString());

    const response = await fetch(
      `http://localhost:5000/api/products/${productId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      }
    );

    if (response.ok) {
      alert(replaceAll ? 'Images replaced!' : 'Images added!');
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleUpdate}>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => setImages(Array.from(e.target.files))}
        required
      />

      <label>
        <input
          type="checkbox"
          checked={replaceAll}
          onChange={(e) => setReplaceAll(e.target.checked)}
        />
        Replace all images (delete old ones)
      </label>

      <button type="submit">
        {replaceAll ? 'Replace Images' : 'Add Images'}
      </button>
    </form>
  );
}
```

---

## 📋 Category List with Images

```jsx
export function CategoryList() {
  const [categories, setCategories] = useState([]);

  React.useEffect(() => {
    fetch('http://localhost:5000/api/categories')
      .then(r => r.json())
      .then(setCategories);
  }, []);

  return (
    <div className="categories-grid">
      {categories.map(cat => (
        <div key={cat.id} className="category-card">
          <img
            src={`http://localhost:5000${cat.imageUrl}`}
            alt={cat.name}
            className="category-thumbnail"
          />
          <h3>{cat.name}</h3>
          <p className="image-count">{cat.images?.length || 0} images</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔗 API Endpoints Reference

```
POST   /api/products           Create with images (required)
PUT    /api/products/:id       Update (images optional)
GET    /api/products           List all with images
GET    /api/products/:id       Get single with images

POST   /api/categories         Create with images (required)
PUT    /api/categories/:id     Update (images optional)
GET    /api/categories         List all with images
GET    /api/categories/:id     Get single with images
```

---

## ⚙️ Configuration

### Base URL
```javascript
const API_BASE = 'http://localhost:5000';
const UPLOADS_URL = `${API_BASE}/uploads`;
```

### Image Display Helper
```javascript
function getImageUrl(imageUrl) {
  return `http://localhost:5000${imageUrl}`;
}

// Usage
<img src={getImageUrl(product.imageUrl)} />
```

### Authorization Helper
```javascript
function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
  };
}

// Usage in fetch
fetch(url, {
  method: 'POST',
  headers: getAuthHeaders(),
  body: formData
})
```

---

## ❌ Common Mistakes

| Mistake | Issue | Fix |
|--------|-------|-----|
| Sending JSON instead of FormData | 415 error | Use FormData() |
| Setting Content-Type header | Boundary missing | Don't set it |
| Using 'image' field name | 400 bad request | Use 'images' field |
| Missing Authorization | 401 error | Add Bearer token |
| No images in request | 400 error | Attach at least 1 image |
| Using imageUrl in body | Ignored | Use file upload instead |
| .webp files not accepted | 400 error | Use .jpg, .png, .gif, .webp |

---

## 🧪 Testing with Curl

### Create Product
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Test" \
  -F "description=Test" \
  -F "price=100" \
  -F "categoryId=1" \
  -F "stock=50" \
  -F "priceUnit=fixed" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"
```

### Create Category
```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Fruits" \
  -F "images=@fruit-img.jpg"
```

### Get Product
```bash
curl http://localhost:5000/api/products/5
```

### Update Images
```bash
curl -X PUT http://localhost:5000/api/products/5 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "replaceImages=true" \
  -F "images=@new-image.jpg"
```

---

## 📱 Mobile Considerations

```javascript
// For mobile file uploads
function handleMobileUpload(event) {
  const files = event.target.files;
  const formData = new FormData();
  
  // Add all selected files
  Array.from(files).forEach(file => {
    formData.append('images', file);
  });
  
  // Rest of code...
}

// Mobile-friendly file input
<input
  type="file"
  multiple
  accept="image/*"
  capture="environment"  // Use camera on mobile
  onChange={handleMobileUpload}
/>
```

---

## 🚀 Performance Tips

1. **Compress Images** - Reduce file size before upload (10MB limit)
2. **Limit Files** - Max 10 files per request
3. **Progressive Loading** - Load first image immediately, rest in background
4. **Lazy Load Thumbnails** - Load gallery thumbnails on demand
5. **Cache URLs** - Store image URLs in component state

---

**Last Updated:** 2026-08-11  
**Status:** Ready for Frontend Implementation  
**Support:** See FRONTEND_INTEGRATION_GUIDE_V2.md for complete reference
