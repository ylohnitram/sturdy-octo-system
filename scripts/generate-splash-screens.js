import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SOURCE_LOGO = path.join(PUBLIC_DIR, 'logo.png');

// iOS Splash Screen sizes (all common iPhone/iPad resolutions)
const SPLASH_SIZES = [
  // iPhone SE, 8, 7, 6s, 6
  { width: 750, height: 1334, name: 'apple-splash-750-1334' },
  // iPhone XR, 11
  { width: 828, height: 1792, name: 'apple-splash-828-1792' },
  // iPhone X, XS, 11 Pro, 12 Mini, 13 Mini
  { width: 1125, height: 2436, name: 'apple-splash-1125-2436' },
  // iPhone 14, 13, 12, 11 Pro Max, XS Max
  { width: 1170, height: 2532, name: 'apple-splash-1170-2532' },
  // iPhone 14 Plus, 13 Pro Max, 12 Pro Max
  { width: 1284, height: 2778, name: 'apple-splash-1284-2778' },
  // iPad Mini, Air (portrait)
  { width: 1536, height: 2048, name: 'apple-splash-1536-2048' },
  // iPad 10.2" (portrait)
  { width: 1620, height: 2160, name: 'apple-splash-1620-2160' },
  // iPad Pro 11" (portrait)
  { width: 1668, height: 2388, name: 'apple-splash-1668-2388' },
  // iPad Pro 12.9" (portrait)
  { width: 2048, height: 2732, name: 'apple-splash-2048-2732' },
];

async function generateSplashScreens() {
  console.log('🎨 Generating splash screens for iOS and Android...\n');

  try {
    // Check if source logo exists
    if (!fs.existsSync(SOURCE_LOGO)) {
      console.error('❌ Source logo not found at:', SOURCE_LOGO);
      return;
    }

    const logoBuffer = fs.readFileSync(SOURCE_LOGO);
    const metadata = await sharp(logoBuffer).metadata();

    console.log('📁 Source logo loaded:', SOURCE_LOGO);
    console.log(`   Original size: ${metadata.width}x${metadata.height}px\n`);

    // 1. Generate maskable icon (for Android adaptive icons)
    console.log('🤖 Generating maskable icon for Android...');

    // Maskable icon needs 20% safe zone on each side
    // So if icon is 512px, logo should be centered in ~307px area (60% of size)
    const maskableSize = 512;
    const logoSize = Math.floor(maskableSize * 0.6); // 60% of canvas

    const maskableSvg = `
<svg width="${maskableSize}" height="${maskableSize}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${maskableSize}" height="${maskableSize}" fill="#000000"/>
  
  <!-- Center the logo with safe margins -->
  <image 
    href="data:image/png;base64,${logoBuffer.toString('base64')}" 
    x="${(maskableSize - logoSize) / 2}" 
    y="${(maskableSize - logoSize) / 2}" 
    width="${logoSize}" 
    height="${logoSize}"
  />
</svg>`;

    await sharp(Buffer.from(maskableSvg))
      .resize(512, 512)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'pwa-512x512-maskable.png'));

    console.log('✅ pwa-512x512-maskable.png created (with safe zone)\n');

    // 2. Generate iOS splash screens
    console.log('🍎 Generating iOS splash screens...');

    for (const size of SPLASH_SIZES) {
      // Calculate logo size (should be ~40% of screen height for good look)
      const logoHeight = Math.floor(size.height * 0.25);
      const logoWidth = logoHeight; // Keep aspect ratio square-ish

      // Create splash screen with centered logo
      const splashSvg = `
<svg width="${size.width}" height="${size.height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background matching logo (black satin) -->
  <rect width="${size.width}" height="${size.height}" fill="#000000"/>
  
  <!-- Center the logo -->
  <image 
    href="data:image/png;base64,${logoBuffer.toString('base64')}" 
    x="${(size.width - logoWidth) / 2}" 
    y="${(size.height - logoHeight) / 2}" 
    width="${logoWidth}" 
    height="${logoHeight}"
  />
  
  <!-- Optional: Add app name below logo -->
  <text 
    x="${size.width / 2}" 
    y="${(size.height / 2) + logoHeight / 2 + 60}" 
    font-family="system-ui, -apple-system, sans-serif" 
    font-size="40" 
    font-weight="700"
    fill="#DC2626" 
    text-anchor="middle"
  >NOTCH</text>
</svg>`;

      await sharp(Buffer.from(splashSvg))
        .resize(size.width, size.height)
        .png()
        .toFile(path.join(PUBLIC_DIR, `${size.name}.png`));

      console.log(`   ✅ ${size.name}.png (${size.width}×${size.height})`);
    }

    console.log('\n🎉 All splash screens generated successfully!');
    console.log('📁 Files saved to:', PUBLIC_DIR);

    console.log('\n📦 Summary:');
    console.log('   - 1 maskable icon (Android adaptive icon)');
    console.log(`   - ${SPLASH_SIZES.length} iOS splash screens`);

    console.log('\n💡 Next steps:');
    console.log('   1. Update index.html with splash screen links');
    console.log('   2. Update vite.config.ts with maskable icon');
    console.log('   3. Test on real device or simulator');

  } catch (error) {
    console.error('❌ Error generating splash screens:', error);
  }
}

generateSplashScreens();
