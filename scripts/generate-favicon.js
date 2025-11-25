import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

async function generateSimpleFavicon() {
  console.log('🎨 Generating simplified favicon (4 slashes)...');

  try {
    // Create SVG for favicon - 4 slashes design matching main logo
    const faviconSvg = `
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" fill="#000000"/>
  <g transform="translate(16, 16) rotate(20)">
    <!-- First slash (white) - SHORTER like in main logo -->
    <rect x="-14" y="-12" width="2.5" height="24" fill="#FFFFFF" rx="1.25"/>
    <!-- Second slash (white) -->
    <rect x="-5" y="-16" width="2.5" height="32" fill="#FFFFFF" rx="1.25"/>
    <!-- Third slash (red) - accent -->
    <rect x="4" y="-16" width="2.5" height="32" fill="#DC2626" rx="1.25"/>
    <!-- Fourth slash (white) -->
    <rect x="13" y="-16" width="2.5" height="32" fill="#FFFFFF" rx="1.25"/>
  </g>
</svg>`;

    // Convert SVG to PNG (32x32)
    const favicon32Buffer = await sharp(Buffer.from(faviconSvg))
      .resize(32, 32)
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-32x32.png'), favicon32Buffer);
    console.log('✅ favicon-32x32.png created (4 slashes, first one shorter)');

    // Generate ICO from 32x32 PNG
    const pngToIco = (await import('png-to-ico')).default;
    const icoBuffer = await pngToIco(favicon32Buffer);
    fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
    console.log('✅ favicon.ico created');

    console.log('\n🎉 Simplified favicon generated successfully!');
    console.log('📁 Files saved to:', PUBLIC_DIR);
    console.log('\n✨ 4 slashes matching main logo = instant recognition!');

  } catch (error) {
    console.error('❌ Error generating favicon:', error);
  }
}

generateSimpleFavicon();
