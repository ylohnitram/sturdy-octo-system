# Splash Screen Guide

This document explains the splash screen implementation for the Notch PWA application.

## Problem

When opening a PWA on mobile devices, the operating system displays a splash screen while the app loads. By default, this splash screen is auto-generated from your app icon and background color, which often results in:

- ❌ Small, centered icon with awkward spacing
- ❌ Inconsistent colors around the icon
- ❌ Unprofessional appearance
- ❌ Poor first impression

## Solution

We've implemented custom splash screens that provide:

- ✅ **Consistent branding** - Black background matching app theme (#0F172A)
- ✅ **Properly sized logo** - Centered and sized appropriately for each device
- ✅ **Professional appearance** - Clean, polished loading experience
- ✅ **Full device coverage** - Splash screens for all iOS devices and adaptive icons for Android

## Generated Assets

### iOS Splash Screens

Custom splash screen images for all iPhone and iPad models:

| File | Resolution | Devices |
|------|------------|---------|
| `apple-splash-750-1334.png` | 750×1334 | iPhone SE, 8, 7, 6s, 6 |
| `apple-splash-828-1792.png` | 828×1792 | iPhone XR, 11 |
| `apple-splash-1125-2436.png` | 1125×2436 | iPhone X, XS, 11 Pro, 12 Mini, 13 Mini |
| `apple-splash-1170-2532.png` | 1170×2532 | iPhone 14, 13, 12, 11 Pro |
| `apple-splash-1284-2778.png` | 1284×2778 | iPhone 14 Plus, 13 Pro Max, 12 Pro Max |
| `apple-splash-1536-2048.png` | 1536×2048 | iPad Mini, Air |
| `apple-splash-1620-2160.png` | 1620×2160 | iPad 10.2" |
| `apple-splash-1668-2388.png` | 1668×2388 | iPad Pro 11" |
| `apple-splash-2048-2732.png` | 2048×2732 | iPad Pro 12.9" |

### Android Adaptive Icon

- **`pwa-512x512-maskable.png`** - Maskable icon with safe zone margins
  - Logo occupies 60% of canvas (safe zone = 20% on each side)
  - Works with any icon shape (circle, squircle, rounded square, etc.)
  - Black background for consistent appearance

## Design Specifications

### Layout
- **Background**: #0F172A (Slate 900) - matches app theme
- **Logo size**: ~25% of screen height (optimized for readability)
- **Logo position**: Centered vertically and horizontally
- **App name**: "NOTCH" text below logo in red (#DC2626)

### Safe Zones (Android Maskable Icons)
Following [Google's adaptive icon guidelines](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive):
- Outer 20% of icon = safe zone (may be cropped)
- Logo constrained to inner 60% of canvas
- Ensures visibility regardless of device launcher shape

## Implementation

### index.html

All splash screens are linked using media queries that match specific device dimensions:

```html
<!-- iOS Splash Screens -->
<link rel="apple-touch-startup-image" 
      media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" 
      href="/apple-splash-1170-2532.png" />
<!-- ... (repeated for each device size) -->
```

### vite.config.ts

PWA manifest includes the maskable icon:

```typescript
icons: [
  {
    src: 'pwa-512x512-maskable.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'maskable'
  }
]
```

## Regenerating Splash Screens

If you update the logo and need to regenerate splash screens:

1. Update `public/logo.png` with the new logo
2. Run the generation script:
   ```bash
   node scripts/generate-splash-screens.js
   ```
3. All splash screens will be regenerated automatically

## Testing

### iOS
1. Install the PWA to home screen (Share → Add to Home Screen)
2. Close the app completely
3. Reopen from home screen icon
4. Observe the splash screen during launch

### Android
1. Install the PWA (Chrome → Menu → Install app)
2. Close the app completely
3. Reopen from app drawer or home screen
4. Observe the splash screen during launch

### Simulator Testing
- **iOS**: Use Xcode Simulator (add to home screen in Safari)
- **Android**: Use Android Studio Emulator (install via Chrome)

## Troubleshooting

### Splash screen not updating on iOS
- iOS aggressively caches splash screens
- Solution: Delete the app, clear Safari cache, reinstall

### Wrong splash screen size showing
- Ensure media queries exactly match device specifications
- Check device's actual resolution vs logical resolution

### Android adaptive icon cropped incorrectly
- Verify safe zone margins (logo should be ≤60% of canvas)
- Test on multiple launcher apps (some crop more aggressively)

### Background color mismatch
- Ensure `background_color` in manifest matches splash screen background
- Currently set to `#0F172A` (Slate 900)

## Resources

- [Apple Human Interface Guidelines - Launch Screens](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Android Adaptive Icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)
- [PWA Splash Screen Generator Tools](https://progressier.com/pwa-splash-screen-generator)
- [Media Queries for iOS Devices](https://www.paintcodeapp.com/news/ultimate-guide-to-iphone-resolutions)

## Notes

- Splash screens only appear when launching from home screen (installed PWA)
- They do NOT appear when opening the app in a browser tab
- File sizes are optimized (PNG with compression)
- All splash screens use the same design template for consistency
