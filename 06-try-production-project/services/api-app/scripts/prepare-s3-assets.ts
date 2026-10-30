import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const BUCKET = 'shop-media-542601847638'
const REGION = 'ap-southeast-2'
const ASSETS_DIR = join(__dirname, '../assets/images')

mkdirSync(join(ASSETS_DIR, 'brands'), { recursive: true })
mkdirSync(join(ASSETS_DIR, 'products'), { recursive: true })

// Helper to generate stylish modern SVG images
function createSvg(title: string, subtitle: string, bgColor1: string, bgColor2: string, iconType: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgColor1}" />
      <stop offset="100%" stop-color="${bgColor2}" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-opacity="0.35" />
    </filter>
  </defs>
  <rect width="800" height="600" fill="url(#bg)" rx="24" />
  <g transform="translate(400, 260)" filter="url(#shadow)">
    <circle r="120" fill="rgba(255, 255, 255, 0.15)" stroke="rgba(255, 255, 255, 0.3)" stroke-width="3" />
    <text text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="bold">${iconType}</text>
  </g>
  <g transform="translate(400, 450)" text-anchor="middle">
    <text fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="700" letter-spacing="1">${title}</text>
    <text y="42" fill="rgba(255, 255, 255, 0.85)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="400">${subtitle}</text>
  </g>
</svg>`
}

function createBrandSvg(brandName: string, bgColor: string, letter: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="brandBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgColor}" />
      <stop offset="100%" stop-color="#111827" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#brandBg)" rx="32" />
  <circle cx="200" cy="180" r="90" fill="rgba(255, 255, 255, 0.1)" stroke="rgba(255, 255, 255, 0.2)" stroke-width="4" />
  <text x="200" y="180" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="76" font-weight="bold">${letter}</text>
  <text x="200" y="320" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="700" letter-spacing="2">${brandName.toUpperCase()}</text>
</svg>`
}

const brandFiles = [
  { file: 'brands/apple.svg', name: 'Apple', color: '#374151', letter: '' },
  { file: 'brands/samsung.svg', name: 'Samsung', color: '#1d4ed8', letter: 'S' },
  { file: 'brands/sony.svg', name: 'Sony', color: '#111827', letter: 'SONY' },
  { file: 'brands/nike.svg', name: 'Nike', color: '#ea580c', letter: '✓' },
  { file: 'brands/adidas.svg', name: 'Adidas', color: '#059669', letter: '///' },
  { file: 'brands/logitech.svg', name: 'Logitech', color: '#0284c7', letter: 'logi' },
]

const productFiles = [
  { file: 'products/iphone-16-pro-front.svg', title: 'iPhone 16 Pro', sub: 'Front Display & Camera', c1: '#1f2937', c2: '#111827', icon: '📱' },
  { file: 'products/iphone-16-pro-back.svg', title: 'iPhone 16 Pro', sub: 'Titanium Back & Triple Camera', c1: '#374151', c2: '#1e293b', icon: '📷' },
  { file: 'products/macbook-pro-16-open.svg', title: 'MacBook Pro 16"', sub: 'M3 Max Liquid Retina XDR', c1: '#0f172a', c2: '#1e293b', icon: '💻' },
  { file: 'products/macbook-pro-16-side.svg', title: 'MacBook Pro 16"', sub: 'Ports & Space Black Finish', c1: '#1e293b', c2: '#334155', icon: '⚡' },
  { file: 'products/apple-watch-ultra-2.svg', title: 'Apple Watch Ultra 2', sub: '49mm Titanium & Action Button', c1: '#c2410c', c2: '#7c2d12', icon: '⌚' },
  { file: 'products/apple-watch-ultra-side.svg', title: 'Apple Watch Ultra 2', sub: 'Trail Loop & Rugged Case', c1: '#ea580c', c2: '#9a3412', icon: '🏃' },
  { file: 'products/galaxy-s24-ultra.svg', title: 'Galaxy S24 Ultra', sub: 'Galaxy AI & Titanium Gray', c1: '#1e3a8a', c2: '#0f172a', icon: '✨' },
  { file: 'products/galaxy-s24-pen.svg', title: 'Galaxy S24 Ultra', sub: 'Integrated S-Pen & 200MP Lens', c1: '#1d4ed8', c2: '#1e1b4b', icon: '✍️' },
  { file: 'products/odyssey-g9.svg', title: 'Odyssey OLED G9', sub: '49" Curved 240Hz Gaming Display', c1: '#312e81', c2: '#0f172a', icon: '🖥️' },
  { file: 'products/sony-wh1000xm5-black.svg', title: 'Sony WH-1000XM5', sub: 'Noise Cancelling Headset', c1: '#18181b', c2: '#09090b', icon: '🎧' },
  { file: 'products/sony-wh1000xm5-case.svg', title: 'Sony WH-1000XM5', sub: 'Collapsible Carrying Case', c1: '#27272a', c2: '#18181b', icon: '🎒' },
  { file: 'products/ps5-slim.svg', title: 'PlayStation 5 Slim', sub: '1TB Ultra High-Speed SSD', c1: '#1e40af', c2: '#1e293b', icon: '🎮' },
  { file: 'products/ps5-dualsense.svg', title: 'PlayStation 5 Slim', sub: 'DualSense Wireless Controller', c1: '#2563eb', c2: '#1e3a8a', icon: '🕹️' },
  { file: 'products/nike-air-max-270.svg', title: 'Nike Air Max 270', sub: 'Max Air Cushioning Footwear', c1: '#c2410c', c2: '#431407', icon: '👟' },
  { file: 'products/nike-air-max-270-sole.svg', title: 'Nike Air Max 270', sub: 'Outsole & Heel Unit', c1: '#ea580c', c2: '#7c2d12', icon: '🔥' },
  { file: 'products/adidas-ultraboost-light.svg', title: 'Ultraboost Light', sub: 'Light BOOST Midsole', c1: '#047857', c2: '#064e3b', icon: '👟' },
  { file: 'products/adidas-ultraboost-side.svg', title: 'Ultraboost Light', sub: 'Primeknit+ Upper & Continental', c1: '#059669', c2: '#065f46', icon: '⚡' },
  { file: 'products/logitech-mx-master-3s.svg', title: 'MX Master 3S', sub: '8K DPI Electromagnetic Scroll', c1: '#0284c7', c2: '#0c4a6e', icon: '🖱️' },
  { file: 'products/logitech-mx-master-3s-side.svg', title: 'MX Master 3S', sub: 'Ergonomic Thumb Wheel', c1: '#0369a1', c2: '#075985', icon: '🖐️' },
]

console.log('Writing local SVG assets...')
for (const b of brandFiles) {
  const content = createBrandSvg(b.name, b.color, b.letter)
  writeFileSync(join(ASSETS_DIR, b.file), content, 'utf8')
}

for (const p of productFiles) {
  const content = createSvg(p.title, p.sub, p.c1, p.c2, p.icon)
  writeFileSync(join(ASSETS_DIR, p.file), content, 'utf8')
}

console.log('Syncing all assets to AWS S3 bucket:', BUCKET)
try {
  execSync(`aws s3 sync "${ASSETS_DIR}" "s3://${BUCKET}/" --content-type "image/svg+xml" --region ${REGION}`, {
    stdio: 'inherit',
  })
  console.log(`✅ Successfully uploaded ${brandFiles.length + productFiles.length} assets to s3://${BUCKET}/`)
} catch (err: any) {
  console.error('Failed to sync to S3 via AWS CLI:', err.message)
}
