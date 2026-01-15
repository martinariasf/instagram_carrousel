# Fonts Directory

This directory should contain the following font files for the application to work properly.

## Required Font Files

### Inter
- Inter-Regular.woff2 (or .woff, .ttf)
- Inter-Bold.woff2 (or .woff, .ttf)

### Montserrat
- Montserrat-Regular.woff2 (or .woff, .ttf)
- Montserrat-Bold.woff2 (or .woff, .ttf)

### Poppins
- Poppins-Regular.woff2 (or .woff, .ttf)
- Poppins-Bold.woff2 (or .woff, .ttf)

### Playfair Display
- PlayfairDisplay-Regular.woff2 (or .woff, .ttf)
- PlayfairDisplay-Bold.woff2 (or .woff, .ttf)

### Roboto
- Roboto-Regular.woff2 (or .woff, .ttf)
- Roboto-Bold.woff2 (or .woff, .ttf)

### Oswald
- Oswald-Regular.woff2 (or .woff, .ttf)
- Oswald-Bold.woff2 (or .woff, .ttf)

## Where to Get Fonts

All these fonts are available for free from Google Fonts:
- https://fonts.google.com/specimen/Inter
- https://fonts.google.com/specimen/Montserrat
- https://fonts.google.com/specimen/Poppins
- https://fonts.google.com/specimen/Playfair+Display
- https://fonts.google.com/specimen/Roboto
- https://fonts.google.com/specimen/Oswald

Download and extract the fonts, then place the required files in this directory.

## Font Format Priority

The CSS is set up to try loading fonts in this order:
1. .woff2 (best compression, modern browsers)
2. .woff (good compression, wide support)
3. .ttf (largest files, universal support)

You only need ONE format per font weight - preferably .woff2 for best performance.

## Fallback Behavior

If fonts aren't loaded, the app will fall back to system fonts, which still provides a functional experience. The canvas rendering may look slightly different without the custom fonts.
