import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

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

// Create simple minimalist splash screen with red dot and "Notch" text
function createMinimalistSplash(width, height) {
    const centerX = width / 2;
    const centerY = height / 2;

    // Calculate sizes based on screen dimensions
    const dotSize = Math.min(width, height) * 0.04; // Red dot size
    const fontSize = Math.min(width, height) * 0.08; // Text size
    const spacing = dotSize * 2; // Space between dot and text

    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Solid black background -->
  <rect width="${width}" height="${height}" fill="#000000"/>
  
  <!-- Red dot (positioned to the left of center) -->
  <circle 
    cx="${centerX - spacing}" 
    cy="${centerY}" 
    r="${dotSize}" 
    fill="#DC2626"
  />
  
  <!-- "Notch" text (positioned to the right of dot) -->
  <text 
    x="${centerX + spacing * 0.5}" 
    y="${centerY + fontSize * 0.35}" 
    font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" 
    font-size="${fontSize}" 
    font-weight="700"
    fill="#FFFFFF" 
    text-anchor="start"
    letter-spacing="1"
  >Notch</text>
</svg>`;
}

async function generateSplashScreens() {
    console.log('🎨 Generating minimalist splash screens...\n');
    console.log('✨ Red dot + "Notch" text on solid black background\n');

    try {
        // 1. Generate maskable icon for Android
        console.log('🤖 Generating maskable icon for Android...');

        const maskableSize = 512;
        const maskableSvg = createMinimalistSplash(maskableSize, maskableSize);

        await sharp(Buffer.from(maskableSvg))
            .resize(512, 512)
            .png()
            .toFile(path.join(PUBLIC_DIR, 'pwa-512x512-maskable.png'));

        console.log('✅ pwa-512x512-maskable.png created (minimalist design)\n');

        // 2. Generate iOS splash screens
        console.log('🍎 Generating iOS splash screens...');

        for (const size of SPLASH_SIZES) {
            const splashSvg = createMinimalistSplash(size.width, size.height);

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
        console.log('\n✨ Minimalist design:');
        console.log('   - Solid black background (#000000)');
        console.log('   - Red dot (#DC2626)');
        console.log('   - "Notch" text in white');
        console.log('   - Clean and professional');
        console.log('\n💡 Note: Static splash screens cannot animate.');
        console.log('   For animated red dot, see LoadingScreen component.');

    } catch (error) {
        console.error('❌ Error generating splash screens:', error);
    }
}

generateSplashScreens();
