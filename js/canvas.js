/**
 * Canvas Module - Image generation with logo overlay support
 */
const CanvasModule = (function() {
    'use strict';
    const CANVAS_WIDTH = 1080;
    const CANVAS_HEIGHT = 1350;
    const PADDING = 80;
    const LOGO_PADDING = 40;

    function createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        return canvas;
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = src;
        });
    }

    function drawColorBackground(ctx, color) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    function drawImageBackground(ctx, img) {
        const imgRatio = img.width / img.height;
        const canvasRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
        let drawWidth, drawHeight, drawX, drawY;
        if (imgRatio > canvasRatio) {
            drawHeight = CANVAS_HEIGHT;
            drawWidth = img.width * (CANVAS_HEIGHT / img.height);
            drawX = (CANVAS_WIDTH - drawWidth) / 2;
            drawY = 0;
        } else {
            drawWidth = CANVAS_WIDTH;
            drawHeight = img.height * (CANVAS_WIDTH / img.width);
            drawX = 0;
            drawY = (CANVAS_HEIGHT - drawHeight) / 2;
        }
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }

    function getWrappedLines(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (ctx.measureText(testLine).width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines.length ? lines : [''];
    }

    function drawText(ctx, text, options) {
        const { fontFamily = 'Montserrat', fontSize = 64, color = '#ffffff', align = 'center' } = options;
        ctx.font = `bold ${fontSize}px "${fontFamily}", sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        const maxWidth = CANVAS_WIDTH - (PADDING * 2);
        const lines = getWrappedLines(ctx, text, maxWidth);
        const lineHeight = fontSize * 1.3;
        const totalHeight = lines.length * lineHeight;
        const startY = (CANVAS_HEIGHT - totalHeight) / 2 + (lineHeight / 2);
        let x = align === 'left' ? PADDING : align === 'right' ? CANVAS_WIDTH - PADDING : CANVAS_WIDTH / 2;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        lines.forEach((line, i) => ctx.fillText(line, x, startY + (i * lineHeight)));
        ctx.shadowColor = 'transparent';
    }

    function drawLogo(ctx, logoImg, options) {
        const { position = 'bottom-left', size = 80 } = options;
        
        // Calculate logo dimensions maintaining aspect ratio
        const aspectRatio = logoImg.width / logoImg.height;
        let logoWidth, logoHeight;
        if (aspectRatio >= 1) {
            logoWidth = size;
            logoHeight = size / aspectRatio;
        } else {
            logoHeight = size;
            logoWidth = size * aspectRatio;
        }

        // Calculate position
        let x, y;
        switch (position) {
            case 'top-left':
                x = LOGO_PADDING;
                y = LOGO_PADDING;
                break;
            case 'top-right':
                x = CANVAS_WIDTH - logoWidth - LOGO_PADDING;
                y = LOGO_PADDING;
                break;
            case 'bottom-left':
                x = LOGO_PADDING;
                y = CANVAS_HEIGHT - logoHeight - LOGO_PADDING;
                break;
            case 'bottom-right':
                x = CANVAS_WIDTH - logoWidth - LOGO_PADDING;
                y = CANVAS_HEIGHT - logoHeight - LOGO_PADDING;
                break;
            default:
                x = LOGO_PADDING;
                y = CANVAS_HEIGHT - logoHeight - LOGO_PADDING;
        }

        ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
    }

    async function generateSlide(slideData, globalSettings, logoSettings = null) {
        const canvas = createCanvas();
        const ctx = canvas.getContext('2d');
        const { text = '', backgroundType = 'color', backgroundColor = '#211D58', backgroundImage = null } = slideData;
        const { fontFamily = 'Montserrat', fontSize = 64, textColor = '#ffffff', textAlign = 'center' } = globalSettings;

        // Draw background
        if (backgroundType === 'image' && backgroundImage) {
            try {
                const img = await loadImage(backgroundImage);
                drawImageBackground(ctx, img);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            } catch (e) {
                drawColorBackground(ctx, backgroundColor);
            }
        } else {
            drawColorBackground(ctx, backgroundColor);
        }

        // Draw text
        if (text.trim()) {
            drawText(ctx, text, { fontFamily, fontSize, color: textColor, align: textAlign });
        }

        // Draw logo if enabled
        if (logoSettings && logoSettings.enabled && logoSettings.image) {
            try {
                const logoImg = await loadImage(logoSettings.image);
                drawLogo(ctx, logoImg, { position: logoSettings.position, size: logoSettings.size });
            } catch (e) {
                console.error('Failed to draw logo:', e);
            }
        }

        return canvas.toDataURL('image/png', 1.0);
    }

    async function generateAllSlides(slidesData, globalSettings, logoSettings = null) {
        const images = [];
        for (const slide of slidesData) {
            images.push(await generateSlide(slide, globalSettings, logoSettings));
        }
        return images;
    }

    function downloadImage(dataUrl, filename) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function downloadAllIndividually(images, delay = 300) {
        images.forEach((dataUrl, i) => {
            setTimeout(() => downloadImage(dataUrl, `gf-carousel-slide-${i + 1}.png`), i * delay);
        });
    }

    return { CANVAS_WIDTH, CANVAS_HEIGHT, generateSlide, generateAllSlides, downloadImage, downloadAllIndividually };
})();
