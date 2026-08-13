# Product API Response Samples - Frontend Integration

## 1. CREATE PRODUCT RESPONSE
**Endpoint**: `POST /api/products`  
**Status**: 201 Created

```json
{
  "id": 1,
  "name": "Organic Basmati Rice",
  "description": "Premium quality organic basmati rice from Kashmir",
  "price": 450,
  "priceUnit": "fixed",
  "stock": 100,
  "imageUrl": "/uploads/rice-main-1728554400000-123456789.jpg",
  "categoryId": 2,
  "createdAt": "2026-08-10T10:15:30.000Z",
  "images": [
    {
      "id": 1,
      "productId": 1,
      "imageUrl": "/uploads/rice-1-1728554400000-123456789.jpg",
      "createdAt": "2026-08-10T10:15:30.000Z"
    },
    {
      "id": 2,
      "productId": 1,
      "imageUrl": "/uploads/rice-2-1728554401000-987654321.jpg",
      "createdAt": "2026-08-10T10:15:31.000Z"
    },
    {
      "id": 3,
      "productId": 1,
      "imageUrl": "/uploads/rice-3-1728554402000-456789123.jpg",
      "createdAt": "2026-08-10T10:15:32.000Z"
    }
  ]
}
```

---

## 2. GET ALL PRODUCTS RESPONSE
**Endpoint**: `GET /api/products`  
**Status**: 200 OK

```json
[
  {
    "id": 1,
    "name": "Organic Basmati Rice",
    "description": "Premium quality organic basmati rice from Kashmir",
    "price": 450,
    "priceUnit": "fixed",
    "stock": 100,
    "imageUrl": "/uploads/rice-main-1728554400000-123456789.jpg",
    "categoryId": 2,
    "createdAt": "2026-08-10T10:15:30.000Z",
    "category": {
      "id": 2,
      "name": "Grains & Cereals",
      "imageUrl": "/uploads/category-grains-1728400000000.jpg",
      "createdAt": "2026-08-01T00:00:00.000Z"
    },
    "images": [
      {
        "id": 1,
        "productId": 1,
        "imageUrl": "/uploads/rice-1-1728554400000-123456789.jpg",
        "createdAt": "2026-08-10T10:15:30.000Z"
      },
      {
        "id": 2,
        "productId": 1,
        "imageUrl": "/uploads/rice-2-1728554401000-987654321.jpg",
        "createdAt": "2026-08-10T10:15:31.000Z"
      },
      {
        "id": 3,
        "productId": 1,
        "imageUrl": "/uploads/rice-3-1728554402000-456789123.jpg",
        "createdAt": "2026-08-10T10:15:32.000Z"
      }
    ]
  },
  {
    "id": 2,
    "name": "Organic Turmeric Powder",
    "description": "Pure turmeric powder with high curcumin content",
    "price": 299.99,
    "priceUnit": "per_200g",
    "stock": 150,
    "imageUrl": "/uploads/turmeric-main-1728555000000-111111111.jpg",
    "categoryId": 3,
    "createdAt": "2026-08-09T14:20:15.000Z",
    "category": {
      "id": 3,
      "name": "Spices",
      "imageUrl": "/uploads/category-spices-1728400000000.jpg",
      "createdAt": "2026-08-01T00:00:00.000Z"
    },
    "images": [
      {
        "id": 4,
        "productId": 2,
        "imageUrl": "/uploads/turmeric-1-1728555000000-111111111.jpg",
        "createdAt": "2026-08-09T14:20:15.000Z"
      },
      {
        "id": 5,
        "productId": 2,
        "imageUrl": "/uploads/turmeric-2-1728555001000-222222222.jpg",
        "createdAt": "2026-08-09T14:20:16.000Z"
      }
    ]
  },
  {
    "id": 3,
    "name": "Organic Honey",
    "description": "Raw, unfiltered organic honey",
    "price": 399,
    "priceUnit": "fixed",
    "stock": 75,
    "imageUrl": "/uploads/honey-main-1728553000000-333333333.jpg",
    "categoryId": 4,
    "createdAt": "2026-08-08T09:45:00.000Z",
    "category": {
      "id": 4,
      "name": "Sweeteners",
      "imageUrl": "/uploads/category-sweeteners-1728400000000.jpg",
      "createdAt": "2026-08-01T00:00:00.000Z"
    },
    "images": [
      {
        "id": 6,
        "productId": 3,
        "imageUrl": "/uploads/honey-1-1728553000000-333333333.jpg",
        "createdAt": "2026-08-08T09:45:00.000Z"
      },
      {
        "id": 7,
        "productId": 3,
        "imageUrl": "/uploads/honey-2-1728553001000-444444444.jpg",
        "createdAt": "2026-08-08T09:45:01.000Z"
      },
      {
        "id": 8,
        "productId": 3,
        "imageUrl": "/uploads/honey-3-1728553002000-555555555.jpg",
        "createdAt": "2026-08-08T09:45:02.000Z"
      },
      {
        "id": 9,
        "productId": 3,
        "imageUrl": "/uploads/honey-4-1728553003000-666666666.jpg",
        "createdAt": "2026-08-08T09:45:03.000Z"
      }
    ]
  }
]
```

---

## 3. GET SINGLE PRODUCT RESPONSE
**Endpoint**: `GET /api/products/:id`  
**Status**: 200 OK

```json
{
  "id": 1,
  "name": "Organic Basmati Rice",
  "description": "Premium quality organic basmati rice from Kashmir",
  "price": 450,
  "priceUnit": "fixed",
  "stock": 100,
  "imageUrl": "/uploads/rice-main-1728554400000-123456789.jpg",
  "categoryId": 2,
  "createdAt": "2026-08-10T10:15:30.000Z",
  "category": {
    "id": 2,
    "name": "Grains & Cereals",
    "imageUrl": "/uploads/category-grains-1728400000000.jpg",
    "createdAt": "2026-08-01T00:00:00.000Z"
  },
  "images": [
    {
      "id": 1,
      "productId": 1,
      "imageUrl": "/uploads/rice-1-1728554400000-123456789.jpg",
      "createdAt": "2026-08-10T10:15:30.000Z"
    },
    {
      "id": 2,
      "productId": 1,
      "imageUrl": "/uploads/rice-2-1728554401000-987654321.jpg",
      "createdAt": "2026-08-10T10:15:31.000Z"
    },
    {
      "id": 3,
      "productId": 1,
      "imageUrl": "/uploads/rice-3-1728554402000-456789123.jpg",
      "createdAt": "2026-08-10T10:15:32.000Z"
    }
  ],
  "reviews": [
    {
      "id": 1,
      "rating": 5,
      "comment": "Excellent quality rice!",
      "userId": 2,
      "productId": 1,
      "createdAt": "2026-08-10T12:00:00.000Z",
      "user": {
        "id": 2,
        "name": "John Doe"
      }
    },
    {
      "id": 2,
      "rating": 4,
      "comment": "Good quality, fast delivery",
      "userId": 3,
      "productId": 1,
      "createdAt": "2026-08-09T15:30:00.000Z",
      "user": {
        "id": 3,
        "name": "Jane Smith"
      }
    }
  ],
  "reviewSummary": {
    "averageRating": 4.5,
    "totalReviews": 2
  }
}
```

---

## 4. GET PRODUCTS BY CATEGORY RESPONSE
**Endpoint**: `GET /api/products/category/:categoryId`  
**Status**: 200 OK

```json
[
  {
    "id": 1,
    "name": "Organic Basmati Rice",
    "description": "Premium quality organic basmati rice from Kashmir",
    "price": 450,
    "priceUnit": "fixed",
    "stock": 100,
    "imageUrl": "/uploads/rice-main-1728554400000-123456789.jpg",
    "categoryId": 2,
    "createdAt": "2026-08-10T10:15:30.000Z",
    "category": {
      "id": 2,
      "name": "Grains & Cereals",
      "imageUrl": "/uploads/category-grains-1728400000000.jpg",
      "createdAt": "2026-08-01T00:00:00.000Z"
    },
    "images": [
      {
        "id": 1,
        "productId": 1,
        "imageUrl": "/uploads/rice-1-1728554400000-123456789.jpg",
        "createdAt": "2026-08-10T10:15:30.000Z"
      },
      {
        "id": 2,
        "productId": 1,
        "imageUrl": "/uploads/rice-2-1728554401000-987654321.jpg",
        "createdAt": "2026-08-10T10:15:31.000Z"
      },
      {
        "id": 3,
        "productId": 1,
        "imageUrl": "/uploads/rice-3-1728554402000-456789123.jpg",
        "createdAt": "2026-08-10T10:15:32.000Z"
      }
    ]
  },
  {
    "id": 4,
    "name": "Organic Wheat Flour",
    "description": "100% organic whole wheat flour",
    "price": 199.99,
    "priceUnit": "per_1kg",
    "stock": 200,
    "imageUrl": "/uploads/wheat-main-1728556000000-777777777.jpg",
    "categoryId": 2,
    "createdAt": "2026-08-07T11:30:00.000Z",
    "category": {
      "id": 2,
      "name": "Grains & Cereals",
      "imageUrl": "/uploads/category-grains-1728400000000.jpg",
      "createdAt": "2026-08-01T00:00:00.000Z"
    },
    "images": [
      {
        "id": 10,
        "productId": 4,
        "imageUrl": "/uploads/wheat-1-1728556000000-777777777.jpg",
        "createdAt": "2026-08-07T11:30:00.000Z"
      },
      {
        "id": 11,
        "productId": 4,
        "imageUrl": "/uploads/wheat-2-1728556001000-888888888.jpg",
        "createdAt": "2026-08-07T11:30:01.000Z"
      }
    ]
  }
]
```

---

## 5. SEARCH PRODUCTS RESPONSE
**Endpoint**: `GET /api/products/search?query=rice&minPrice=300&maxPrice=500`  
**Status**: 200 OK

```json
{
  "count": 1,
  "products": [
    {
      "id": 1,
      "name": "Organic Basmati Rice",
      "description": "Premium quality organic basmati rice from Kashmir",
      "price": 450,
      "priceUnit": "fixed",
      "stock": 100,
      "imageUrl": "/uploads/rice-main-1728554400000-123456789.jpg",
      "categoryId": 2,
      "createdAt": "2026-08-10T10:15:30.000Z",
      "category": {
        "id": 2,
        "name": "Grains & Cereals",
        "imageUrl": "/uploads/category-grains-1728400000000.jpg",
        "createdAt": "2026-08-01T00:00:00.000Z"
      },
      "images": [
        {
          "id": 1,
          "productId": 1,
          "imageUrl": "/uploads/rice-1-1728554400000-123456789.jpg",
          "createdAt": "2026-08-10T10:15:30.000Z"
        },
        {
          "id": 2,
          "productId": 1,
          "imageUrl": "/uploads/rice-2-1728554401000-987654321.jpg",
          "createdAt": "2026-08-10T10:15:31.000Z"
        },
        {
          "id": 3,
          "productId": 1,
          "imageUrl": "/uploads/rice-3-1728554402000-456789123.jpg",
          "createdAt": "2026-08-10T10:15:32.000Z"
        }
      ]
    }
  ]
}
```

---

## 6. UPDATE PRODUCT RESPONSE
**Endpoint**: `PUT /api/admin/products/:id`  
**Status**: 200 OK

```json
{
  "message": "Product updated successfully",
  "product": {
    "id": 1,
    "name": "Organic Basmati Rice - Premium",
    "description": "Premium quality organic basmati rice from Kashmir - Updated",
    "price": 499.99,
    "priceUnit": "fixed",
    "stock": 150,
    "imageUrl": "/uploads/rice-main-1728554400000-123456789.jpg",
    "categoryId": 2,
    "createdAt": "2026-08-10T10:15:30.000Z",
    "category": {
      "id": 2,
      "name": "Grains & Cereals",
      "imageUrl": "/uploads/category-grains-1728400000000.jpg",
      "createdAt": "2026-08-01T00:00:00.000Z"
    },
    "images": [
      {
        "id": 1,
        "productId": 1,
        "imageUrl": "/uploads/rice-1-1728554400000-123456789.jpg",
        "createdAt": "2026-08-10T10:15:30.000Z"
      },
      {
        "id": 2,
        "productId": 1,
        "imageUrl": "/uploads/rice-2-1728554401000-987654321.jpg",
        "createdAt": "2026-08-10T10:15:31.000Z"
      },
      {
        "id": 3,
        "productId": 1,
        "imageUrl": "/uploads/rice-3-1728554402000-456789123.jpg",
        "createdAt": "2026-08-10T10:15:32.000Z"
      },
      {
        "id": 12,
        "productId": 1,
        "imageUrl": "/uploads/rice-4-1728557000000-999999999.jpg",
        "createdAt": "2026-08-10T13:30:00.000Z"
      }
    ]
  }
}
```

---

## 7. DELETE PRODUCT RESPONSE
**Endpoint**: `DELETE /api/admin/products/:id`  
**Status**: 200 OK

```json
{
  "message": "Product deleted successfully"
}
```

---

## 8. PRODUCT NOT FOUND (ERROR)
**Endpoint**: `GET /api/products/999`  
**Status**: 404 Not Found

```json
{
  "error": "Product not found"
}
```

---

## 9. ADMIN GET ALL PRODUCTS RESPONSE
**Endpoint**: `GET /api/admin/products`  
**Status**: 200 OK

```json
[
  {
    "id": 1,
    "name": "Organic Basmati Rice",
    "description": "Premium quality organic basmati rice from Kashmir",
    "price": 450,
    "priceUnit": "fixed",
    "stock": 100,
    "imageUrl": "/uploads/rice-main-1728554400000-123456789.jpg",
    "categoryId": 2,
    "createdAt": "2026-08-10T10:15:30.000Z",
    "category": {
      "id": 2,
      "name": "Grains & Cereals",
      "imageUrl": "/uploads/category-grains-1728400000000.jpg",
      "createdAt": "2026-08-01T00:00:00.000Z"
    },
    "images": [
      {
        "id": 1,
        "productId": 1,
        "imageUrl": "/uploads/rice-1-1728554400000-123456789.jpg",
        "createdAt": "2026-08-10T10:15:30.000Z"
      },
      {
        "id": 2,
        "productId": 1,
        "imageUrl": "/uploads/rice-2-1728554401000-987654321.jpg",
        "createdAt": "2026-08-10T10:15:31.000Z"
      },
      {
        "id": 3,
        "productId": 1,
        "imageUrl": "/uploads/rice-3-1728554402000-456789123.jpg",
        "createdAt": "2026-08-10T10:15:32.000Z"
      }
    ]
  },
  {
    "id": 2,
    "name": "Organic Turmeric Powder",
    "description": "Pure turmeric powder with high curcumin content",
    "price": 299.99,
    "priceUnit": "per_200g",
    "stock": 150,
    "imageUrl": "/uploads/turmeric-main-1728555000000-111111111.jpg",
    "categoryId": 3,
    "createdAt": "2026-08-09T14:20:15.000Z",
    "category": {
      "id": 3,
      "name": "Spices",
      "imageUrl": "/uploads/category-spices-1728400000000.jpg",
      "createdAt": "2026-08-01T00:00:00.000Z"
    },
    "images": [
      {
        "id": 4,
        "productId": 2,
        "imageUrl": "/uploads/turmeric-1-1728555000000-111111111.jpg",
        "createdAt": "2026-08-09T14:20:15.000Z"
      },
      {
        "id": 5,
        "productId": 2,
        "imageUrl": "/uploads/turmeric-2-1728555001000-222222222.jpg",
        "createdAt": "2026-08-09T14:20:16.000Z"
      }
    ]
  }
]
```

---

## 10. PRODUCT WITH NO IMAGES (Legacy Product)
**Status**: 200 OK

```json
{
  "id": 5,
  "name": "Legacy Product",
  "description": "Old product without multiple images",
  "price": 199,
  "priceUnit": "fixed",
  "stock": 50,
  "imageUrl": null,
  "categoryId": 1,
  "createdAt": "2026-07-01T00:00:00.000Z",
  "category": {
    "id": 1,
    "name": "Vegetables",
    "imageUrl": "/uploads/category-vegetables-1728400000000.jpg",
    "createdAt": "2026-08-01T00:00:00.000Z"
  },
  "images": []
}
```

---

## 11. RESPONSE WITH MINIMAL DATA (For list views)

```json
{
  "id": 1,
  "name": "Organic Basmati Rice",
  "price": 450,
  "imageUrl": "/uploads/rice-main-1728554400000-123456789.jpg",
  "images": [
    {
      "id": 1,
      "imageUrl": "/uploads/rice-1-1728554400000-123456789.jpg"
    },
    {
      "id": 2,
      "imageUrl": "/uploads/rice-2-1728554401000-987654321.jpg"
    }
  ]
}
```

---

## Key Points for Frontend:

### Image Array Structure:
```javascript
{
  id: number,           // Unique image ID
  productId: number,    // Link to product
  imageUrl: string,     // Full path: "/uploads/filename.jpg"
  createdAt: string     // ISO timestamp
}
```

### Accessing Images in Frontend:

```javascript
// Get main image
const mainImage = product.imageUrl;

// Get all gallery images
const galleryImages = product.images.map(img => img.imageUrl);

// Display image
<img src={`http://localhost:3000${imageUrl}`} />

// Or with full URL if backend provides it
<img src={product.images[0].imageUrl} />
```

### Handling Missing Images:

```javascript
// Check if product has images
if (product.images && product.images.length > 0) {
  // Show image gallery
} else if (product.imageUrl) {
  // Show main image only
} else {
  // Show placeholder
}
```

---

## Summary of Changes from Previous Version:

| Aspect | Before | After |
|--------|--------|-------|
| Images per Product | 1 (imageUrl only) | Many (imageUrl + images array) |
| Image Storage | Database as URL string | Files in `/uploads` folder, path in DB |
| Response Format | No images array | New `images: [{id, imageUrl, createdAt}]` array |
| Image Access | imageUrl only | Main image + gallery array |
| Backward Compat | N/A | imageUrl still available |

Ready to integrate! 🎉
