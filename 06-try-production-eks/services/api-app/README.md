# E-Commerce Platform API

Built with **Bun**, **Hono**, and **Drizzle ORM** (PostgreSQL) using **Layered Architecture**.

---

## 🏛️ Architecture Overview

```
src/
├── db/                     # Drizzle ORM Schema, Relations & Connection
│   ├── index.ts
│   ├── schema.ts
│   └── seed.ts             # S3 image seeding & initial catalog data
├── repositories/           # Data Access Layer (Drizzle Queries)
│   ├── brand.repository.ts
│   ├── category.repository.ts
│   ├── order.repository.ts
│   ├── product.repository.ts
│   ├── stock.repository.ts
│   └── user.repository.ts
├── services/               # Business Logic Layer
│   ├── auth.service.ts
│   ├── brand.service.ts
│   ├── category.service.ts
│   ├── ecommerce.service.ts # Public Storefront Service
│   ├── order.service.ts
│   ├── product.service.ts
│   ├── stock.service.ts
│   └── user.service.ts
├── controllers/            # HTTP Routers & Endpoints
│   ├── auth.controller.ts
│   ├── brand.controller.ts
│   ├── category.controller.ts
│   ├── dashboard.controller.ts # Admin Dashboard Controller
│   ├── ecommerce.controller.ts # Public Storefront Controller
│   ├── order.controller.ts
│   ├── product.controller.ts
│   ├── stock.controller.ts
│   └── user.controller.ts
├── middleware/             # Auth & Role-based Access Control
│   └── auth.middleware.ts
├── utils/                  # JWT & Slug utilities
│   ├── jwt.ts
│   └── slug.ts
├── metrics.ts              # Prometheus OpenMetrics Telemetry
├── openapi.ts              # OpenAPI 3.0 Spec & Swagger Definitions
└── index.ts                # Application Entry & Route Registration
```

---

## 🛍️ Public E-Commerce Storefront Endpoints (`/ecommerce`)

All endpoints under `/ecommerce` are **publicly accessible** without any authentication or authorization headers.

### 1. Products List
`GET /ecommerce/products`

Retrieve paginated products with rich filtering, search, and stock quantity:

| Query Parameter | Type | Description | Example |
|---|---|---|---|
| `search` / `q` | `string` | Case-insensitive search across title, description, or SKU | `?search=iphone` |
| `brand` | `string` | Filter by brand slug or UUID | `?brand=apple` |
| `category` | `string` | Filter by category slug or UUID | `?category=smartphones` |
| `in_stock` / `inStock` | `boolean` | Filter availability (`true` / `false`) | `?in_stock=true` |
| `stock_count` / `minStock` | `number` | Filter minimum stock count available | `?stock_count=5` |
| `minPrice` | `number` | Minimum product price | `?minPrice=500` |
| `maxPrice` | `number` | Maximum product price | `?maxPrice=1200` |
| `sort` | `string` | `newest`, `oldest`, `price_asc`, `price_desc`, `title_asc`, `title_desc` | `?sort=price_asc` |
| `page` | `number` | Page number (default: `1`) | `?page=1` |
| `limit` | `number` | Items per page (default: `12`, max: `100`) | `?limit=10` |

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "title": "iPhone 16 Pro",
      "slug": "iphone-16-pro",
      "description": "Titanium design with A18 Pro chip",
      "price": "999.00",
      "brandId": "11111111-2222-3333-4444-555555555555",
      "categoryId": "66666666-7777-8888-9999-000000000000",
      "stock_count": 25,
      "in_stock": true,
      "sku": "IPH16-PRO-128",
      "primary_image": "https://example.com/iphone-front.png",
      "images": [
        {
          "id": "aaaa-bbbb-cccc",
          "url": "https://example.com/iphone-front.png",
          "isPrimary": true
        }
      ],
      "brand": {
        "id": "11111111-2222-3333-4444-555555555555",
        "title": "Apple",
        "slug": "apple",
        "image": "https://example.com/apple-logo.png"
      },
      "category": {
        "id": "66666666-7777-8888-9999-000000000000",
        "title": "Smartphones",
        "slug": "smartphones"
      },
      "createdAt": "2026-10-13T10:00:00Z",
      "updatedAt": "2026-10-13T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filters": {
    "search": "iphone",
    "brand": "apple",
    "category": null,
    "minPrice": null,
    "maxPrice": null,
    "inStock": true,
    "minStock": null,
    "sort": "price_asc"
  }
}
```

---

### 2. Product Detail
`GET /ecommerce/products/:idOrSlug`

Returns complete product details by UUID or human-readable slug:
```bash
curl https://api.kendrickdev.shop/ecommerce/products/iphone-16-pro
```

---

### 3. Public Brands
`GET /ecommerce/brands`

Returns all brands with active `productsCount`:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "11111111-2222-3333-4444-555555555555",
      "title": "Apple",
      "slug": "apple",
      "image": "https://example.com/apple.png",
      "productsCount": 14
    }
  ]
}
```

`GET /ecommerce/brands/:idOrSlug` returns brand info and its top products.

---

### 4. Public Categories
`GET /ecommerce/categories`

Returns all categories with active `productsCount`:
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "66666666-7777-8888-9999-000000000000",
      "title": "Smartphones",
      "slug": "smartphones",
      "productsCount": 20
    }
  ]
}
```

`GET /ecommerce/categories/:idOrSlug` returns category info and its top products.

---

## 🪣 AWS S3 Media Storage

All brand and product image assets are stored in the AWS S3 bucket:
- **Bucket**: `shop-media-542601847638` (in region `ap-southeast-2`)
- **Public URL Base**: `https://shop-media-542601847638.s3.ap-southeast-2.amazonaws.com`
- **Folders**:
  - `brands/` (e.g. `apple.svg`, `samsung.svg`, `sony.svg`, `nike.svg`, `adidas.svg`, `logitech.svg`)
  - `products/` (e.g. `iphone-16-pro-front.svg`, `macbook-pro-16-open.svg`, `galaxy-s24-ultra.svg`, etc.)

To re-sync local assets to S3:
```bash
bun run scripts/prepare-s3-assets.ts
```

---

## 🌱 Database Seeding

Populate the database with **6 Brands**, **5 Categories**, **10 Featured Products**, **Inventory Stocks**, and **S3 Images**:

### Method 1: CLI
```bash
bun run seed
```

### Method 2: HTTP Endpoint
```bash
# Local
curl -X POST http://localhost:8000/seed

# Production Live
curl -X POST https://api.kendrickdev.shop/seed
```

---

## 🚀 Running Locally

```sh
bun install
bun run dev
```

Run tests:
```sh
bun test
```
