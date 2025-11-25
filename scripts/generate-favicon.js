import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

async function generateSimpleFavicon() {
    console.log('🎨 Generating simplified favicon (3 slashes)...');

    try {
        // Create SVG for favicon - simple 3 slashes design
        const faviconSvg = `
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" fill="#000000"/>
  <g transform="translate(16, 16) rotate(20)">
    <!-- Left slash (white) -->
    <rect x="-12" y="-16" width="3" height="32" fill="#FFFFFF" rx="1.5"/>
    <!-- Middle slash (red) -->
    <rect x="-1" y="-16" width="3" height="32" fill="#DC2626" rx="1.5"/>
    <!-- Right slash (white) -->
    <rect x="10" y="-16" width="3" height="32" fill="#FFFFFF" rx="1.5"/>
  </g>
</svg>`;

        // Convert SVG to PNG (32x32)
        const favicon32Buffer = await sharp(Buffer.from(faviconSvg))
            .resize(32, 32)
            .png()
            .toBuffer();

        fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-32x32.png'), favicon32Buffer);
        console.log('✅ favicon-32x32.png created (simplified slash design)');

        // Generate ICO from 32x32 PNG
        const pngToIco = (await import('png-to-ico')).default;
        const icoBuffer = await pngToIco(favicon32Buffer);
        fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
        console.log('✅ favicon.ico created (simplified slash design)');

        console.log('\n🎉 Simplified favicon generated successfully!');
        console.log('📁 Files saved to:', PUBLIC_DIR);
        console.log('\n✨ Simple, iconic, memorable! 3 slashes = instant recognition.');

    } catch (error) {
        console.error('❌ Error generating favicon:', error);
    }
}

generateSimpleFavicon();
