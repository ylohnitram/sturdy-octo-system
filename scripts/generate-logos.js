import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source logo path - your uploaded logo
const SOURCE_LOGO = 'C:/Users/mholy/.gemini/antigravity/brain/f1fc601b-6b38-4d36-ba25-1754af5fa0d5/uploaded_image_1764092044887.png';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

async function generateLogos() {
    console.log('🎨 Generating logo variants from your claw marks design...');

    try {
        // Read source image
        const sourceBuffer = fs.readFileSync(SOURCE_LOGO);
        const image = sharp(sourceBuffer);
        const metadata = await image.metadata();

        console.log(`📐 Source image: ${metadata.width}x${metadata.height}`);

        // 1. Main logo.png - 512x512, preserve background
        await sharp(sourceBuffer)
            .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toFile(path.join(PUBLIC_DIR, 'logo.png'));
        console.log('✅ logo.png created (512x512, transparent)');

        // 2. PWA 192x192 - black background
        await sharp(sourceBuffer)
            .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
            .png()
            .toFile(path.join(PUBLIC_DIR, 'pwa-192x192.png'));
        console.log('✅ pwa-192x192.png created (black background)');

        // 3. PWA 512x512 - black background
        await sharp(sourceBuffer)
            .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
            .png()
            .toFile(path.join(PUBLIC_DIR, 'pwa-512x512.png'));
        console.log('✅ pwa-512x512.png created (black background)');

        // 4. Apple touch icon 180x180 - black background
        await sharp(sourceBuffer)
            .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
            .png()
            .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
        console.log('✅ apple-touch-icon.png created (180x180, black background)');

        // 5. Favicon 32x32 - black background
        const favicon32 = await sharp(sourceBuffer)
            .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
            .png()
            .toBuffer();

        fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-32x32.png'), favicon32);
        console.log('✅ favicon-32x32.png created');

        // 6. Generate favicon.ico from 32x32 PNG
        const pngToIco = (await import('png-to-ico')).default;
        const icoBuffer = await pngToIco(favicon32);
        fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
        console.log('✅ favicon.ico created');

        console.log('\n🎉 All logos generated successfully!');
        console.log('📁 Files saved to:', PUBLIC_DIR);
        console.log('\n✨ Your claw marks logo is ready to hunt!');

    } catch (error) {
        console.error('❌ Error generating logos:', error);
    }
}

generateLogos();
