import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SOURCE_LOGO = path.join(PUBLIC_DIR, 'logo.png');

async function generateLogoAssets() {
    console.log('🎨 Generating logo assets from source logo...');

    try {
        // Check if source logo exists
        if (!fs.existsSync(SOURCE_LOGO)) {
            console.error('❌ Source logo not found at:', SOURCE_LOGO);
            return;
        }

        // Read the source logo
        const logoBuffer = fs.readFileSync(SOURCE_LOGO);

        console.log('📁 Source logo loaded:', SOURCE_LOGO);

        // Generate PWA icon 192x192
        await sharp(logoBuffer)
            .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
            .png()
            .toFile(path.join(PUBLIC_DIR, 'pwa-192x192.png'));
        console.log('✅ pwa-192x192.png created');

        // Generate PWA icon 512x512
        await sharp(logoBuffer)
            .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
            .png()
            .toFile(path.join(PUBLIC_DIR, 'pwa-512x512.png'));
        console.log('✅ pwa-512x512.png created');

        // Generate Apple Touch Icon 180x180
        await sharp(logoBuffer)
            .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
            .png()
            .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
        console.log('✅ apple-touch-icon.png created');

        // Generate favicon 32x32
        const favicon32Buffer = await sharp(logoBuffer)
            .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
            .png()
            .toBuffer();

        fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-32x32.png'), favicon32Buffer);
        console.log('✅ favicon-32x32.png created');

        // Generate favicon.ico from 32x32 PNG
        const pngToIco = (await import('png-to-ico')).default;
        const icoBuffer = await pngToIco(favicon32Buffer);
        fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
        console.log('✅ favicon.ico created');

        console.log('\n🎉 All logo assets generated successfully!');
        console.log('📁 Files saved to:', PUBLIC_DIR);

        console.log('\n📦 Generated files:');
        console.log('  - logo.png (source)');
        console.log('  - pwa-192x192.png');
        console.log('  - pwa-512x512.png');
        console.log('  - apple-touch-icon.png (180x180)');
        console.log('  - favicon-32x32.png');
        console.log('  - favicon.ico');

    } catch (error) {
        console.error('❌ Error generating logo assets:', error);
    }
}

generateLogoAssets();
