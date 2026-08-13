# Frontend Integration Guide - Multi-Image Product Upload

## Overview
Products now support multiple images. Images are stored as files in the Node.js server's `uploads` folder, and only the file paths are stored in the database.

---

## 1. CREATE PRODUCT WITH MULTIPLE IMAGES

### Endpoint
```
POST /api/products
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### Request Format (FormData)
```javascript
const formData = new FormData();
formData.append("name", "Product Name");
formData.append("description", "Product Description");
formData.append("price", 299.99);
formData.append("categoryId", 1);
formData.append("stock", 50);
formData.append("priceUnit", "fixed"); // or "per_200g", "per_1kg", etc.

// Add multiple image files
formData.append("images", imageFile1); // File object
formData.append("images", imageFile2); // File object
formData.append("images", imageFile3); // File object

// Optional: Single main image URL (can be URL or set to first uploaded image)
formData.append("imageUrl", "/uploads/main-image-file.jpg");
```

### Example - React/Vue/Frontend Code
```javascript
async function createProductWithImages() {
  const formData = new FormData();
  
  // Product data
  formData.append("name", "Organic Rice");
  formData.append("description", "Premium organic basmati rice");
  formData.append("price", 450);
  formData.append("categoryId", 2);
  formData.append("stock", 100);
  formData.append("priceUnit", "fixed");
  
  // Get file inputs
  const imageInputs = document.querySelectorAll('input[type="file"][name="product-images"]');
  imageInputs.forEach(input => {
    if (input.files[0]) {
      formData.append("images", input.files[0]);
    }
  });
  
  try {
    const response = await fetch("http://localhost:3000/api/products", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}` // Your auth token
      },
      body: formData
    });
    
    const product = await response.json();
    console.log("Product created with images:", product);
    // Response includes:
    // {
    //   id: 1,
    //   name: "Organic Rice",
    //   price: 450,
    //   imageUrl: "/uploads/...", // main image
    //   images: [
    //     { id: 1, imageUrl: "/uploads/rice-1.jpg", createdAt: "..." },
    //     { id: 2, imageUrl: "/uploads/rice-2.jpg", createdAt: "..." }
    //   ]
    // }
  } catch (error) {
    console.error("Error creating product:", error);
  }
}
```

---

## 2. GET PRODUCTS (WITH IMAGES)

### Endpoint
```
GET /api/products
```

### Response Format
```json
[
  {
    "id": 1,
    "name": "Organic Rice",
    "description": "Premium organic basmati rice",
    "price": 450,
    "priceUnit": "fixed",
    "stock": 100,
    "imageUrl": "/uploads/rice-main.jpg",
    "categoryId": 2,
    "createdAt": "2026-08-10T10:00:00Z",
    "category": {
      "id": 2,
      "name": "Grains",
      "imageUrl": "/uploads/category-grains.jpg",
      "createdAt": "2026-08-01T00:00:00Z"
    },
    "images": [
      {
        "id": 1,
        "productId": 1,
        "imageUrl": "/uploads/rice-1.jpg",
        "createdAt": "2026-08-10T10:00:00Z"
      },
      {
        "id": 2,
        "productId": 1,
        "imageUrl": "/uploads/rice-2.jpg",
        "createdAt": "2026-08-10T10:00:00Z"
      },
      {
        "id": 3,
        "productId": 1,
        "imageUrl": "/uploads/rice-3.jpg",
        "createdAt": "2026-08-10T10:00:00Z"
      }
    ]
  }
]
```

### Frontend Usage - React Example
```javascript
import { useState, useEffect } from 'react';

function ProductGallery() {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    fetch("http://localhost:3000/api/products")
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  }, []);
  
  return (
    <div className="products">
      {products.map(product => (
        <div key={product.id} className="product-card">
          <h3>{product.name}</h3>
          
          {/* Main Image */}
          <img src={product.imageUrl} alt={product.name} className="main-image" />
          
          {/* Image Gallery */}
          {product.images && product.images.length > 0 && (
            <div className="image-gallery">
              <h4>Product Images</h4>
              <div className="gallery-grid">
                {product.images.map(image => (
                  <img 
                    key={image.id} 
                    src={image.imageUrl} 
                    alt={`${product.name} - ${image.id}`}
                    className="gallery-thumb"
                  />
                ))}
              </div>
            </div>
          )}
          
          <p className="price">₹{product.price}</p>
        </div>
      ))}
    </div>
  );
}

export default ProductGallery;
```

---

## 3. GET SINGLE PRODUCT WITH IMAGES

### Endpoint
```
GET /api/products/:id
```

### Response Format
Same as above - includes all images array.

### Frontend Usage
```javascript
async function fetchProductDetails(productId) {
  const response = await fetch(`http://localhost:3000/api/products/${productId}`);
  const product = await response.json();
  
  // Display main image
  document.querySelector('.main-image').src = product.imageUrl;
  
  // Display all images in gallery
  const gallery = document.querySelector('.image-gallery');
  gallery.innerHTML = product.images
    .map(img => `<img src="${img.imageUrl}" alt="Product Image" />`)
    .join('');
  
  return product;
}
```

---

## 4. UPDATE PRODUCT WITH NEW IMAGES

### Endpoint
```
PUT /api/admin/products/:id
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### Request Format (FormData)
```javascript
const formData = new FormData();

// Update fields (all optional)
formData.append("name", "Updated Product Name");
formData.append("description", "Updated description");
formData.append("price", 349.99);
formData.append("stock", 75);

// Add new images (replaces all old images if replaceImages=true)
formData.append("images", newImageFile1);
formData.append("images", newImageFile2);

// Set to "true" to replace all existing images, "false" to add to existing
formData.append("replaceImages", "true");
```

### Example Code
```javascript
async function updateProductImages(productId, newImages, replaceAll = true) {
  const formData = new FormData();
  
  // Add new images
  newImages.forEach(imageFile => {
    formData.append("images", imageFile);
  });
  
  // Whether to replace all existing images
  formData.append("replaceImages", replaceAll.toString());
  
  try {
    const response = await fetch(`http://localhost:3000/api/admin/products/${productId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });
    
    const updatedProduct = await response.json();
    console.log("Product updated:", updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
  }
}
```

---

## 5. DELETE PRODUCT (Removes All Images)

### Endpoint
```
DELETE /api/admin/products/:id
Headers: Authorization: Bearer <token>
```

### Behavior
- Deletes the product from database
- Automatically deletes all associated ProductImage records
- Automatically deletes all image files from the `uploads` folder

### Example Code
```javascript
async function deleteProduct(productId) {
  try {
    const response = await fetch(`http://localhost:3000/api/admin/products/${productId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    console.log(result.message); // "Product deleted successfully"
  } catch (error) {
    console.error("Error deleting product:", error);
  }
}
```

---

## 6. SERVING IMAGES (Static Files)

All uploaded images are served as static files from the `/uploads` endpoint:

```
Image URL Format: http://localhost:3000/uploads/filename.jpg
```

### Example Image Element
```html
<!-- Display product image -->
<img src="http://localhost:3000/uploads/rice-1.jpg" alt="Organic Rice" />

<!-- In React -->
<img src={`http://localhost:3000${product.imageUrl}`} alt={product.name} />
```

---

## 7. UPLOAD CONSTRAINTS & VALIDATION

### File Size
- Maximum: **10 MB** per image

### Allowed File Types
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### Maximum Images Per Product
- Up to **10 images** per product

### Error Handling
```javascript
async function handleProductCreation(formData) {
  try {
    const response = await fetch("http://localhost:3000/api/products", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      // Common errors:
      // - "Only image files are allowed (jpg, jpeg, png, gif, webp)"
      // - File size exceeds 10MB
      // - Invalid product data
      console.error("Error:", error.error);
      return;
    }
    
    const product = await response.json();
    console.log("Success:", product);
  } catch (error) {
    console.error("Network error:", error);
  }
}
```

---

## 8. BACKWARD COMPATIBILITY

### Important Notes
1. **imageUrl field still exists** - This is the main/thumbnail image
2. **images array is new** - Contains all uploaded images
3. **Old products without images** - Will have empty `images` array
4. **Migration note** - Existing products keep their `imageUrl`, you can upload additional images for them

### Getting All Images
```javascript
function getAllProductImages(product) {
  const allImages = [];
  
  // Add main image if it exists
  if (product.imageUrl) {
    allImages.push(product.imageUrl);
  }
  
  // Add gallery images if they exist
  if (product.images && product.images.length > 0) {
    allImages.push(...product.images.map(img => img.imageUrl));
  }
  
  return allImages;
}

// Usage
const product = await fetchProduct(1);
const allImages = getAllProductImages(product);
```

---

## 9. SAMPLE HTML FILE UPLOAD FORM

```html
<!DOCTYPE html>
<html>
<head>
  <title>Upload Product</title>
  <style>
    .image-preview {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 20px;
    }
    .preview-item {
      position: relative;
    }
    .preview-item img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      border: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <h1>Create Product with Multiple Images</h1>
  
  <form id="productForm" enctype="multipart/form-data">
    <div>
      <label>Product Name:</label>
      <input type="text" name="name" required />
    </div>
    
    <div>
      <label>Description:</label>
      <textarea name="description" required></textarea>
    </div>
    
    <div>
      <label>Price:</label>
      <input type="number" name="price" step="0.01" required />
    </div>
    
    <div>
      <label>Stock:</label>
      <input type="number" name="stock" required />
    </div>
    
    <div>
      <label>Category ID:</label>
      <input type="number" name="categoryId" required />
    </div>
    
    <div>
      <label>Product Images (Max 10):</label>
      <input type="file" name="product-images" multiple accept="image/*" />
    </div>
    
    <div id="imagePreview" class="image-preview"></div>
    
    <button type="submit">Create Product</button>
  </form>
  
  <div id="response"></div>

  <script>
    const form = document.getElementById('productForm');
    const imageInput = document.querySelector('input[name="product-images"]');
    const preview = document.getElementById('imagePreview');
    const responseDiv = document.getElementById('response');
    
    // Show image previews
    imageInput.addEventListener('change', (e) => {
      preview.innerHTML = '';
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const div = document.createElement('div');
          div.className = 'preview-item';
          div.innerHTML = `<img src="${event.target.result}" alt="Preview" />`;
          preview.appendChild(div);
        };
        reader.readAsDataURL(file);
      });
    });
    
    // Submit form
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      
      // Rename file input to "images" for backend
      const files = imageInput.files;
      formData.delete('product-images');
      for (let file of files) {
        formData.append('images', file);
      }
      
      try {
        const token = localStorage.getItem('token'); // Get your auth token
        const response = await fetch('http://localhost:3000/api/products', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        const result = await response.json();
        if (response.ok) {
          responseDiv.innerHTML = `<p style="color: green;">✓ Product created successfully! ID: ${result.id}</p>`;
          form.reset();
          preview.innerHTML = '';
        } else {
          responseDiv.innerHTML = `<p style="color: red;">✗ Error: ${result.error}</p>`;
        }
      } catch (error) {
        responseDiv.innerHTML = `<p style="color: red;">✗ Error: ${error.message}</p>`;
      }
    });
  </script>
</body>
</html>
```

---

## 10. COMMON INTEGRATION PATTERNS

### Pattern 1: Image Carousel (React)
```javascript
import { useState } from 'react';

function ImageCarousel({ product }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!product.images || product.images.length === 0) {
    return <img src={product.imageUrl} alt={product.name} />;
  }
  
  const currentImage = product.images[currentIndex];
  
  return (
    <div className="carousel">
      <img src={currentImage.imageUrl} alt={product.name} />
      
      <div className="controls">
        <button onClick={() => setCurrentIndex(prev => 
          prev === 0 ? product.images.length - 1 : prev - 1
        )}>Previous</button>
        
        <span>{currentIndex + 1} / {product.images.length}</span>
        
        <button onClick={() => setCurrentIndex(prev => 
          prev === product.images.length - 1 ? 0 : prev + 1
        )}>Next</button>
      </div>
      
      <div className="thumbnails">
        {product.images.map((img, idx) => (
          <img
            key={img.id}
            src={img.imageUrl}
            alt={`Thumbnail ${idx + 1}`}
            className={currentIndex === idx ? 'active' : ''}
            onClick={() => setCurrentIndex(idx)}
          />
        ))}
      </div>
    </div>
  );
}

export default ImageCarousel;
```

### Pattern 2: Multiple File Input with Validation (Vue 3)
```vue
<template>
  <div class="upload-form">
    <input
      type="file"
      multiple
      accept="image/*"
      @change="handleFileSelect"
      ref="fileInput"
    />
    
    <div class="image-list">
      <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
        <span>{{ file.name }}</span>
        <span v-if="file.size > 10485760" style="color: red;">
          ⚠️ Too large (max 10MB)
        </span>
      </div>
    </div>
    
    <button @click="uploadProduct">Upload Product with Images</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const fileInput = ref(null);
const selectedFiles = ref([]);

const handleFileSelect = (event) => {
  selectedFiles.value = Array.from(event.target.files);
};

const uploadProduct = async () => {
  const formData = new FormData();
  
  formData.append('name', 'Product Name');
  formData.append('description', 'Description');
  formData.append('price', 299.99);
  formData.append('categoryId', 1);
  formData.append('stock', 50);
  
  selectedFiles.value.forEach(file => {
    formData.append('images', file);
  });
  
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:3000/api/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  if (response.ok) {
    console.log('Product created successfully');
  }
};
</script>
```

---

## 11. TESTING API WITH CURL

```bash
# Create product with images
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Organic Rice" \
  -F "description=Premium basmati rice" \
  -F "price=450" \
  -F "categoryId=1" \
  -F "stock=100" \
  -F "priceUnit=fixed" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "images=@/path/to/image3.jpg"

# Get all products
curl http://localhost:3000/api/products

# Get single product
curl http://localhost:3000/api/products/1

# Update product with new images
curl -X PUT http://localhost:3000/api/admin/products/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@/path/to/new-image.jpg" \
  -F "replaceImages=true"

# Delete product
curl -X DELETE http://localhost:3000/api/admin/products/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 12. TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Images not displaying | Check if `/uploads` folder exists and server is running |
| 401 Unauthorized | Make sure token is valid and included in Authorization header |
| Only image files allowed | Ensure file extension is .jpg, .png, .gif, or .webp |
| File size exceeds limit | Compress images to under 10MB or resize before uploading |
| No images in response | Ensure FormData field name is exactly "images" (not "image") |
| CORS error | Check if frontend URL is in allowed CORS origins in app.js |

---

## Summary of Changes

✅ **What's New:**
- Multi-image support per product
- Images stored as files in `/uploads` folder
- Database stores only file path URLs
- Automatic image file cleanup on product deletion
- Supports up to 10 images per product

✅ **API Endpoints:**
- `POST /api/products` - Create with images (multipart/form-data)
- `PUT /api/admin/products/:id` - Update with new images
- `DELETE /api/admin/products/:id` - Delete (removes files too)
- `GET /api/products` - Get all with image galleries
- `GET /api/products/:id` - Get single with images

✅ **Static File Serving:**
- Images accessible at: `http://localhost:3000/uploads/filename.jpg`
