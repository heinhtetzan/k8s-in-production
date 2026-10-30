import { db, syncDatabaseSchema } from './index'
import { users, brands, categories, products, productImages, stocks } from './schema'
import { eq } from 'drizzle-orm'

export interface SeedResult {
  usersCount: number
  brandsCount: number
  categoriesCount: number
  productsCount: number
  imagesCount: number
  stocksCount: number
}

export async function seedDatabase(): Promise<SeedResult> {
  console.log('🌱 Starting database seeding with real product photography...')
  await syncDatabaseSchema()

  // 1. Seed Shop Admin User
  let shopUser = await db.query.users.findFirst({
    where: eq(users.email, 'shop@kendrickdev.shop'),
  })

  const adminAvatar =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'

  const adminPasswordHash = await Bun.password.hash('admin123', {
    algorithm: 'bcrypt',
    cost: 10,
  })

  if (!shopUser) {
    const [created] = await db
      .insert(users)
      .values({
        email: 'shop@kendrickdev.shop',
        name: 'Kendrick Flagship Store',
        type: 'shop',
        passwordHash: adminPasswordHash,
        avatarUrl: adminAvatar,
      })
      .returning()
    shopUser = created
    console.log('  ✓ Created default shop user: shop@kendrickdev.shop')
  } else {
    await db
      .update(users)
      .set({
        avatarUrl: adminAvatar,
        name: 'Kendrick Flagship Store',
        passwordHash: adminPasswordHash,
      })
      .where(eq(users.id, shopUser.id))
  }

  // 2. Seed Brands (with real photography/emblem assets)
  const brandsData = [
    {
      title: 'Apple',
      slug: 'apple',
      image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=300&q=80',
    },
    {
      title: 'Samsung',
      slug: 'samsung',
      image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=300&q=80',
    },
    {
      title: 'Sony',
      slug: 'sony',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80',
    },
    {
      title: 'Nike',
      slug: 'nike',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80',
    },
    {
      title: 'Adidas',
      slug: 'adidas',
      image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=300&q=80',
    },
    {
      title: 'Logitech',
      slug: 'logitech',
      image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=300&q=80',
    },
    {
      title: 'Dell',
      slug: 'dell',
      image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=300&q=80',
    },
    {
      title: 'Bose',
      slug: 'bose',
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=300&q=80',
    },
    {
      title: 'Canon',
      slug: 'canon',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=300&q=80',
    },
    {
      title: 'Razer',
      slug: 'razer',
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=300&q=80',
    },
  ]

  const brandMap = new Map<string, string>() // slug -> id
  for (const b of brandsData) {
    let brand = await db.query.brands.findFirst({ where: eq(brands.slug, b.slug) })
    if (!brand) {
      const [created] = await db.insert(brands).values(b).returning()
      brand = created
    } else {
      const [updated] = await db
        .update(brands)
        .set({ title: b.title, image: b.image, updatedAt: new Date() })
        .where(eq(brands.id, brand.id))
        .returning()
      brand = updated
    }
    brandMap.set(b.slug, brand.id)
  }
  console.log(`  ✓ Seeded ${brandMap.size} brands`)

  // 3. Seed Categories
  const categoriesData = [
    { title: 'Smartphones & Wearables', slug: 'smartphones' },
    { title: 'Laptops & Computers', slug: 'laptops' },
    { title: 'Audio & Headphones', slug: 'audio' },
    { title: 'Footwear & Apparel', slug: 'footwear' },
    { title: 'Gaming & Accessories', slug: 'gaming' },
    { title: 'Cameras & Photography', slug: 'cameras' },
  ]

  const categoryMap = new Map<string, string>() // slug -> id
  for (const c of categoriesData) {
    let category = await db.query.categories.findFirst({ where: eq(categories.slug, c.slug) })
    if (!category) {
      const [created] = await db.insert(categories).values(c).returning()
      category = created
    } else {
      const [updated] = await db
        .update(categories)
        .set({ title: c.title, updatedAt: new Date() })
        .where(eq(categories.id, category.id))
        .returning()
      category = updated
    }
    categoryMap.set(c.slug, category.id)
  }
  console.log(`  ✓ Seeded ${categoryMap.size} categories`)

  // 4. Seed Products (30 items total with real high-resolution product photography)
  const productsData = [
    // 1. iPhone 16 Pro
    {
      title: 'iPhone 16 Pro',
      slug: 'iphone-16-pro',
      description: 'Aerospace-grade titanium design, A18 Pro chip, 48MP Fusion camera system with 4K 120 fps Dolby Vision, and Camera Control.',
      price: '999.00',
      brandSlug: 'apple',
      categorySlug: 'smartphones',
      stock: 45,
      sku: 'IPH16-PRO-BLK-128',
      images: [
        { url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80', isPrimary: false },
        { url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 2. MacBook Pro 16" M3 Max
    {
      title: 'MacBook Pro 16" M3 Max',
      slug: 'macbook-pro-16-m3-max',
      description: 'The most advanced Mac laptop for demanding workflows. Liquid Retina XDR display, M3 Max with up to 16 CPU cores and 40 GPU cores, and up to 22 hours of battery life.',
      price: '3499.00',
      brandSlug: 'apple',
      categorySlug: 'laptops',
      stock: 15,
      sku: 'MBP16-M3MAX-36GB',
      images: [
        { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80', isPrimary: false },
        { url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 3. Apple Watch Ultra 2
    {
      title: 'Apple Watch Ultra 2',
      slug: 'apple-watch-ultra-2',
      description: 'The ultimate sports and adventure watch. 49mm aerospace titanium case, custom Action button, precision dual-frequency GPS, and 3000 nits display.',
      price: '799.00',
      brandSlug: 'apple',
      categorySlug: 'smartphones',
      stock: 28,
      sku: 'AW-ULTRA2-49TI',
      images: [
        { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80', isPrimary: false },
        { url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 4. Samsung Galaxy S24 Ultra
    {
      title: 'Samsung Galaxy S24 Ultra',
      slug: 'galaxy-s24-ultra',
      description: 'Next-gen Galaxy AI with Circle to Search, Live Translate, Snapdragon 8 Gen 3, robust titanium frame, 200MP camera, and embedded S Pen.',
      price: '1299.00',
      brandSlug: 'samsung',
      categorySlug: 'smartphones',
      stock: 32,
      sku: 'SAMS24-ULTRA-256',
      images: [
        { url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80', isPrimary: false },
        { url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 5. Samsung 49" Odyssey OLED G9
    {
      title: 'Samsung 49" Odyssey OLED G9 Curved Gaming Monitor',
      slug: 'odyssey-oled-g9',
      description: 'Massive 49-inch Dual QHD 1800R curved gaming screen, 240Hz refresh rate, 0.03ms response time, with Neo Quantum Processor Pro.',
      price: '1799.00',
      brandSlug: 'samsung',
      categorySlug: 'gaming',
      stock: 8,
      sku: 'SAM-G9-OLED-49',
      images: [
        { url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=800&q=80', isPrimary: false },
        { url: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 6. Sony WH-1000XM5 Wireless Headphones
    {
      title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
      slug: 'sony-wh-1000xm5',
      description: 'Industry-leading noise cancellation powered by two processors and eight microphones. Precision Voice Pickup Technology and 30-hour battery life.',
      price: '399.00',
      brandSlug: 'sony',
      categorySlug: 'audio',
      stock: 60,
      sku: 'SONY-WH1000XM5-BLK',
      images: [
        { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80', isPrimary: false },
        { url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 7. Sony PlayStation 5 Slim
    {
      title: 'Sony PlayStation 5 Slim Console',
      slug: 'playstation-5-slim',
      description: 'Next-gen gaming inside a slim and compact console design. Includes 1TB high-speed NVMe SSD, Ray Tracing, 4K HDR support, and DualSense Wireless Controller.',
      price: '499.00',
      brandSlug: 'sony',
      categorySlug: 'gaming',
      stock: 22,
      sku: 'SONY-PS5-SLIM-1TB',
      images: [
        { url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 8. Nike Air Max 270
    {
      title: 'Nike Air Max 270',
      slug: 'nike-air-max-270',
      description: 'Boasting Nike largest heel Air unit yet, delivering super-soft bounce and lightweight breathable engineered mesh for everyday lifestyle wear.',
      price: '160.00',
      brandSlug: 'nike',
      categorySlug: 'footwear',
      stock: 75,
      sku: 'NIKE-AM270-BLK-10',
      images: [
        { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=80', isPrimary: false },
        { url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 9. Adidas Ultraboost Light
    {
      title: 'Adidas Ultraboost Light Running Shoes',
      slug: 'adidas-ultraboost-light',
      description: 'Experience epic energy return with the lightest BOOST cushioning ever made. Continental Natural Rubber outsole gives extraordinary grip in wet and dry conditions.',
      price: '190.00',
      brandSlug: 'adidas',
      categorySlug: 'footwear',
      stock: 50,
      sku: 'ADI-UB-LIGHT-WHT-9',
      images: [
        { url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80', isPrimary: false },
        { url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 10. Logitech MX Master 3S
    {
      title: 'Logitech MX Master 3S Wireless Performance Mouse',
      slug: 'logitech-mx-master-3s',
      description: 'Quiet Clicks, 8,000 DPI track-on-glass sensor, and ultra-fast MagSpeed electromagnetic scroll wheel with ergonomic hand contouring.',
      price: '99.99',
      brandSlug: 'logitech',
      categorySlug: 'gaming',
      stock: 90,
      sku: 'LOGI-MXM3S-GRPH',
      images: [
        { url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 11. Apple iPad Pro 13" M4
    {
      title: 'Apple iPad Pro 13" M4 OLED',
      slug: 'apple-ipad-pro-13-m4',
      description: 'The thinnest Apple product ever, featuring the groundbreaking Tandem OLED Ultra Retina XDR display and outrageous M4 performance.',
      price: '1299.00',
      brandSlug: 'apple',
      categorySlug: 'laptops',
      stock: 24,
      sku: 'IPAD-PRO-13-M4-256',
      images: [
        { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 12. Apple AirPods Pro (2nd Gen)
    {
      title: 'Apple AirPods Pro (2nd Gen) USB-C',
      slug: 'apple-airpods-pro-2',
      description: 'Up to 2x more Active Noise Cancellation, Adaptive Audio, Transparency mode, and Personalized Spatial Audio with dynamic head tracking.',
      price: '249.00',
      brandSlug: 'apple',
      categorySlug: 'audio',
      stock: 85,
      sku: 'APP-PRO2-USBC',
      images: [
        { url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 13. Samsung Galaxy Book4 Ultra
    {
      title: 'Samsung Galaxy Book4 Ultra Intel Core i9',
      slug: 'galaxy-book4-ultra',
      description: 'Intel Core Ultra 9 processor, NVIDIA GeForce RTX 4070, and vivid 16-inch 3K Dynamic AMOLED 2X touchscreen with anti-reflective glass.',
      price: '2399.00',
      brandSlug: 'samsung',
      categorySlug: 'laptops',
      stock: 14,
      sku: 'SAM-BOOK4-ULTRA',
      images: [
        { url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 14. Samsung Galaxy Watch 6 Classic
    {
      title: 'Samsung Galaxy Watch 6 Classic 47mm',
      slug: 'galaxy-watch-6-classic',
      description: 'Iconic rotating bezel, advanced sleep coaching, ECG monitoring, and sapphire crystal glass designed for durability and timeless style.',
      price: '399.00',
      brandSlug: 'samsung',
      categorySlug: 'smartphones',
      stock: 40,
      sku: 'SAM-W6-CLASSIC-47',
      images: [
        { url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 15. Samsung Galaxy Buds2 Pro
    {
      title: 'Samsung Galaxy Buds2 Pro Wireless Earbuds',
      slug: 'galaxy-buds2-pro',
      description: 'Seamless 24-bit Hi-Fi audio, intelligent Active Noise Canceling with 3 high SNR microphones, and ergonomic comfortable ear fit.',
      price: '229.00',
      brandSlug: 'samsung',
      categorySlug: 'audio',
      stock: 65,
      sku: 'SAM-BUDS2-PRO-BLK',
      images: [
        { url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 16. Sony Alpha 7 IV Mirrorless Camera
    {
      title: 'Sony Alpha 7 IV Full-Frame Camera with 28-70mm Lens',
      slug: 'sony-alpha-7-iv',
      description: '33MP Exmor R back-illuminated CMOS sensor, BIONZ XR processing engine, 4K 60p 10-bit 4:2:2 recording, and real-time Eye AF.',
      price: '2498.00',
      brandSlug: 'sony',
      categorySlug: 'cameras',
      stock: 12,
      sku: 'SONY-ILCE-7M4K',
      images: [
        { url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 17. Sony WF-1000XM5 Wireless Earbuds
    {
      title: 'Sony WF-1000XM5 True Wireless Noise Cancelling Earbuds',
      slug: 'sony-wf-1000xm5',
      description: 'Astonishing sound quality with High-Resolution Audio, dual processors for noise cancellation, and bone conduction sensors for crystal-clear calls.',
      price: '299.00',
      brandSlug: 'sony',
      categorySlug: 'audio',
      stock: 55,
      sku: 'SONY-WF1000XM5-BLK',
      images: [
        { url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 18. Sony DualSense Edge Controller
    {
      title: 'Sony DualSense Edge Wireless Controller',
      slug: 'dualsense-edge-controller',
      description: 'Ultra-customizable controls, swappable stick caps, remappable back buttons, and tunable trigger dead zones built for esports gaming.',
      price: '199.99',
      brandSlug: 'sony',
      categorySlug: 'gaming',
      stock: 35,
      sku: 'SONY-DS-EDGE-WHT',
      images: [
        { url: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 19. Dell XPS 15 OLED Laptop
    {
      title: 'Dell XPS 15 OLED Core i9 Laptop',
      slug: 'dell-xps-15-oled',
      description: '15.6-inch 3.5K OLED InfinityEdge display, 13th Gen Intel Core i9, and NVIDIA GeForce RTX 4060 graphics in precision-machined CNC aluminum.',
      price: '2199.00',
      brandSlug: 'dell',
      categorySlug: 'laptops',
      stock: 18,
      sku: 'DELL-XPS15-9530',
      images: [
        { url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 20. Dell UltraSharp 32" 4K Monitor
    {
      title: 'Dell UltraSharp 32" 4K Video Conferencing Monitor',
      slug: 'dell-ultrasharp-32-4k',
      description: '4K IPS Black technology with 2000:1 contrast ratio, integrated 4K Sony Starvis webcam, and 90W USB-C power delivery hub.',
      price: '899.00',
      brandSlug: 'dell',
      categorySlug: 'gaming',
      stock: 25,
      sku: 'DELL-U3223QZ',
      images: [
        { url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 21. Bose QuietComfort Ultra Headphones
    {
      title: 'Bose QuietComfort Ultra Wireless Headphones',
      slug: 'bose-quietcomfort-ultra',
      description: 'World-class noise cancellation with breakthrough Bose Immersive Audio, CustomTune technology, and plush synthetic leather ear cushions.',
      price: '429.00',
      brandSlug: 'bose',
      categorySlug: 'audio',
      stock: 48,
      sku: 'BOSE-QC-ULTRA-BLK',
      images: [
        { url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 22. Bose SoundLink Revolve+ II
    {
      title: 'Bose SoundLink Revolve+ II Bluetooth Speaker',
      slug: 'bose-soundlink-revolve-plus',
      description: 'Deep, jaw-dropping 360-degree sound with true uniform coverage, IP55 water resistance, flexible fabric handle, and up to 17 hours playtime.',
      price: '329.00',
      brandSlug: 'bose',
      categorySlug: 'audio',
      stock: 38,
      sku: 'BOSE-SL-REV2-PLUS',
      images: [
        { url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 23. Logitech G Pro X Superlight 2
    {
      title: 'Logitech G Pro X Superlight 2 Gaming Mouse',
      slug: 'logitech-g-pro-x-superlight-2',
      description: 'Ultralight 60g design, HERO 2 sensor with 32,000 DPI, LIGHTFORCE hybrid optical-mechanical switches, and USB-C fast charging.',
      price: '159.99',
      brandSlug: 'logitech',
      categorySlug: 'gaming',
      stock: 70,
      sku: 'LOGI-GPROX-SL2-WHT',
      images: [
        { url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 24. Logitech G915 LIGHTSPEED Keyboard
    {
      title: 'Logitech G915 LIGHTSPEED Wireless RGB Keyboard',
      slug: 'logitech-g915-lightspeed',
      description: 'Ultra-thin aircraft-grade aluminum top case, low-profile GL mechanical switches, per-key LIGHTSYNC RGB, and 30-hour battery life.',
      price: '249.99',
      brandSlug: 'logitech',
      categorySlug: 'gaming',
      stock: 42,
      sku: 'LOGI-G915-RGB-CLICK',
      images: [
        { url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 25. Nike Air Jordan 1 Retro High OG
    {
      title: 'Nike Air Jordan 1 Retro High OG Chicago',
      slug: 'air-jordan-1-retro-high',
      description: 'Iconic high-top basketball sneaker crafted with genuine full-grain leather, encapsulated Air-Sole unit, and solid rubber traction outsole.',
      price: '180.00',
      brandSlug: 'nike',
      categorySlug: 'footwear',
      stock: 30,
      sku: 'NIKE-AJ1-HIGH-CHI-10',
      images: [
        { url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 26. Nike Pegasus 40 Road Running Shoes
    {
      title: 'Nike Pegasus 40 Road Running Shoes',
      slug: 'nike-pegasus-40',
      description: 'Springy ride for every run, combining dual Zoom Air units and lightweight Nike React foam with a finely tuned single-layer engineered mesh.',
      price: '130.00',
      brandSlug: 'nike',
      categorySlug: 'footwear',
      stock: 60,
      sku: 'NIKE-PEG40-RED-10',
      images: [
        { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 27. Adidas Samba Classic
    {
      title: 'Adidas Samba Classic Leather Shoes',
      slug: 'adidas-samba-classic',
      description: 'Legendary indoor soccer sneaker made with full-grain leather upper, suede toe bumper, low-profile gum rubber outsole, and signature 3-Stripes.',
      price: '100.00',
      brandSlug: 'adidas',
      categorySlug: 'footwear',
      stock: 80,
      sku: 'ADI-SAMBA-CLS-BLK-9',
      images: [
        { url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 28. Adidas Originals Stan Smith
    {
      title: 'Adidas Originals Stan Smith Shoes',
      slug: 'adidas-stan-smith',
      description: 'Timeless minimalist tennis shoe silhouette featuring perforated 3-Stripes, smooth synthetic upper with 50% recycled materials, and iconic heel tab.',
      price: '110.00',
      brandSlug: 'adidas',
      categorySlug: 'footwear',
      stock: 65,
      sku: 'ADI-STAN-SMITH-WHT-9',
      images: [
        { url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 29. Canon EOS R6 Mark II
    {
      title: 'Canon EOS R6 Mark II Mirrorless Camera',
      slug: 'canon-eos-r6-mark-ii',
      description: '24.2MP full-frame CMOS sensor, high-speed continuous shooting up to 40 fps electronic shutter, 4K 60p oversampled video, and In-Body Image Stabilization.',
      price: '2399.00',
      brandSlug: 'canon',
      categorySlug: 'cameras',
      stock: 10,
      sku: 'CANON-EOS-R6M2-BODY',
      images: [
        { url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
    // 30. Razer BlackWidow V4 Pro
    {
      title: 'Razer BlackWidow V4 Pro Mechanical Gaming Keyboard',
      slug: 'razer-blackwidow-v4-pro',
      description: 'Command dial, 8 dedicated macro keys, magnetic plush leatherette underglow wrist rest, Razer Green tactile mechanical switches, and 8000Hz polling rate.',
      price: '229.99',
      brandSlug: 'razer',
      categorySlug: 'gaming',
      stock: 35,
      sku: 'RAZER-BW-V4PRO-GRN',
      images: [
        { url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80', isPrimary: false },
      ],
    },
  ]

  let totalImagesCount = 0
  for (const item of productsData) {
    const brandId = brandMap.get(item.brandSlug) || null
    const categoryId = categoryMap.get(item.categorySlug) || null

    let product = await db.query.products.findFirst({
      where: eq(products.slug, item.slug),
    })

    if (!product) {
      const [created] = await db
        .insert(products)
        .values({
          title: item.title,
          slug: item.slug,
          description: item.description,
          price: item.price,
          brandId,
          categoryId,
          createdBy: shopUser.id,
        })
        .returning()
      product = created
    } else {
      const [updated] = await db
        .update(products)
        .set({
          title: item.title,
          description: item.description,
          price: item.price,
          brandId,
          categoryId,
          updatedAt: new Date(),
        })
        .where(eq(products.id, product.id))
        .returning()
      product = updated
    }

    // Upsert Stock
    const existingStock = await db.query.stocks.findFirst({
      where: eq(stocks.productId, product.id),
    })

    if (!existingStock) {
      await db.insert(stocks).values({
        productId: product.id,
        quantity: item.stock,
        sku: item.sku,
      })
    } else {
      await db
        .update(stocks)
        .set({
          quantity: item.stock,
          sku: item.sku,
          updatedAt: new Date(),
        })
        .where(eq(stocks.id, existingStock.id))
    }

    // Refresh Images with real photography
    await db.delete(productImages).where(eq(productImages.productId, product.id))
    for (const img of item.images) {
      await db.insert(productImages).values({
        productId: product.id,
        url: img.url,
        isPrimary: img.isPrimary,
      })
      totalImagesCount++
    }
  }

  console.log(`  ✓ Seeded ${productsData.length} products, stocks, and ${totalImagesCount} images`)
  console.log('🎉 Database seeding completed successfully with 30 real-image products!')

  return {
    usersCount: 1,
    brandsCount: brandMap.size,
    categoriesCount: categoryMap.size,
    productsCount: productsData.length,
    imagesCount: totalImagesCount,
    stocksCount: productsData.length,
  }
}

// Auto-run if executed directly via CLI
if (import.meta.main) {
  seedDatabase()
    .then((stats) => {
      console.log('Seed summary stats:', stats)
      process.exit(0)
    })
    .catch((err) => {
      console.error('❌ Seeding failed:', err)
      process.exit(1)
    })
}
