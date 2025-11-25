# Logo & Favicon Assets

This document describes the logo and favicon implementation for the Notch application.

## Logo Files

### Source Logo
- **File**: `public/logo.png` (original uploaded logo with 4 slashes design)
- **Format**: PNG with transparent background
- **Design**: 4 diagonal slashes (white-white-red-white) on black/dark background
- **Purpose**: Source file for all other variants

## Generated Assets

All assets are automatically generated from the source logo using the `scripts/generate-logo-assets.js` script.

### PWA Icons
- **pwa-192x192.png**: 192×192px PWA icon
- **pwa-512x512.png**: 512×512px PWA icon (also used as maskable icon)

### Apple Touch Icon
- **apple-touch-icon.png**: 180×180px icon for iOS devices

### Favicons
- **favicon-32x32.png**: 32×32px favicon in PNG format
- **favicon.ico**: Multi-resolution ICO file for browsers

## Regenerating Assets

If you need to update the logo, follow these steps:

1. Replace `public/logo.png` with your new logo
2. Run the generation script:
   ```bash
   node scripts/generate-logo-assets.js
   ```
3. All variants will be automatically regenerated

## Implementation

### HTML References (index.html)
```html
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/png" href="/logo.png" sizes="any" />
<link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
```

### PWA Manifest (vite.config.ts)
The PWA manifest is configured in `vite.config.ts` under the `VitePWA` plugin configuration.

Icons are defined for:
- 192×192 (standard)
- 512×512 (standard and maskable)
- 180×180 (Apple Touch Icon)

## Design Specifications

- **Theme Color**: #DC2626 (Red 600)
- **Background**: #0F172A (Slate 900)
- **Logo Design**: 4 diagonal slashes representing the "Notch" brand
- **Colors in Logo**: White and Red slashes on dark background

## Notes

- All icons maintain the original logo's aspect ratio and design
- Icons are generated with black background for consistency
- The favicon uses the same 4-slash design as the main logo for brand recognition
