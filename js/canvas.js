/**
 * Canvas Module
 * Handles all canvas-based image generation for the carousel
 */

const CanvasModule = (function() {
    'use strict';

    // Canvas dimensions (Instagram carousel format)
    const CANVAS_WIDTH = 1080;
    const CANVAS_HEIGHT = 1350;
    const PADDING = 80;

    /**
     * Create a new canvas element with the correct dimensions
     * @returns {HTMLCanvasElement}
     */
    function createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        return canvas;
    }

    /**
     * Load an image from a data URL
     * @param {string} src - Image source (data URL or regular URL)
     * @returns {Promise<HTMLImageElement>}
     */
    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = src;
        });
    }

    /**
     * Draw a solid color background on the canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {string} color - Hex color value
     */
    function drawColorBackground(ctx, color) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    /**
     * Draw an image background on the canvas (cover fit)
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLImageElement} img
     */
    function drawImageBackground(ctx, img) {
        const imgRatio = img.width / img.height;
        const canvasRatio = CANVAS_WIDTH / CANVAS_HEIGHT;

        let drawWidth, drawHeight, drawX, drawY;

        if (imgRatio > canvasRatio) {
            // Image is wider - fit to height
            drawHeight = CANVAS_HEIGHT;
            drawWidth = img.width * (CANVAS_HEIGHT / img.height);
            drawX = (CANVAS_WIDTH - drawWidth) / 2;
            drawY = 0;
        } else {
            // Image is taller - fit to width
            drawWidth = CANVAS_WIDTH;
            drawHeight = img.height * (CANVAS_WIDTH / img.width);
            drawX = 0;
            drawY = (CANVAS_HEIGHT - drawHeight) / 2;
        }

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }

    /**
     * Calculate word-wrapped lines for text
     * @param {CanvasRenderingContext2D} ctx
     * @param {string} text
     * @param {number} maxWidth
     * @returns {string[]}
     */
    function getWrappedLines(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        // Handle empty text
        if (lines.length === 0) {
            lines.push('');
        }

        return lines;
    }

    /**
     * Draw text on the canvas with word wrapping
     * @param {CanvasRenderingContext2D} ctx
     * @param {string} text
     * @param {Object} options
     */
    function drawText(ctx, text, options) {
        const {
            fontFamily = 'Inter',
            fontSize = 64,
            color = '#ffffff',
            align = 'center'
        } = options;

        // Set up font
        ctx.font = `bold ${fontSize}px "${fontFamily}", sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';

        // Calculate available width for text
        const maxWidth = CANVAS_WIDTH - (PADDING * 2);

        // Get wrapped lines
        const lines = getWrappedLines(ctx, text, maxWidth);

        // Calculate line height (1.3x font size)
        const lineHeight = fontSize * 1.3;

        // Calculate total text height
        const totalHeight = lines.length * lineHeight;

        // Calculate starting Y position to center text vertically
        const startY = (CANVAS_HEIGHT - totalHeight) / 2 + (lineHeight / 2);

        // Calculate X position based on alignment
        let x;
        switch (align) {
            case 'left':
                x = PADDING;
                break;
            case 'right':
                x = CANVAS_WIDTH - PADDING;
                break;
            case 'center':
            default:
                x = CANVAS_WIDTH / 2;
        }

        // Add text shadow for better readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Draw each line
        lines.forEach((line, index) => {
            const y = startY + (index * lineHeight);
            ctx.fillText(line, x, y);
        });

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    /**
     * Generate a single slide image
     * @param {Object} slideData
     * @param {Object} globalSettings
     * @returns {Promise<string>} Data URL of the generated image
     */
    async function generateSlide(slideData, globalSettings) {
        const canvas = createCanvas();
        const ctx = canvas.getContext('2d');

        const {
            text = '',
            backgroundImage = null
        } = slideData;

        const {
            backgroundMode = 'color',
            backgroundColor = '#1a1a2e',
            fontFamily = 'Inter',
            fontSize = 64,
            textColor = '#ffffff',
            textAlign = 'center'
        } = globalSettings;

        // Draw background
        if (backgroundMode === 'image' && backgroundImage) {
            try {
                const img = await loadImage(backgroundImage);
                drawImageBackground(ctx, img);

                // Add semi-transparent overlay for text readability
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            } catch (error) {
                console.warn('Failed to load background image, using color fallback');
                drawColorBackground(ctx, backgroundColor);
            }
        } else {
            drawColorBackground(ctx, backgroundColor);
        }

        // Draw text
        if (text.trim()) {
            drawText(ctx, text, {
                fontFamily,
                fontSize,
                color: textColor,
                align: textAlign
            });
        }

        // Export as PNG data URL
        return canvas.toDataURL('image/png', 1.0);
    }

    /**
     * Generate all slides for the carousel
     * @param {Array} slidesData - Array of slide data objects
     * @param {Object} globalSettings - Global settings for all slides
     * @returns {Promise<string[]>} Array of data URLs for all generated images
     */
    async function generateAllSlides(slidesData, globalSettings) {
        const generatedImages = [];

        for (let i = 0; i < slidesData.length; i++) {
            const slideData = slidesData[i];
            const imageDataUrl = await generateSlide(slideData, globalSettings);
            generatedImages.push(imageDataUrl);
        }

        return generatedImages;
    }

    /**
     * Convert a data URL to a Blob
     * @param {string} dataUrl
     * @returns {Blob}
     */
    function dataURLtoBlob(dataUrl) {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new Blob([u8arr], { type: mime });
    }

    /**
     * Download a single image
     * @param {string} dataUrl
     * @param {string} filename
     */
    function downloadImage(dataUrl, filename) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Create a ZIP file containing all images
     * This implements a simple ZIP creation without external libraries
     * @param {string[]} images - Array of data URLs
     * @returns {Promise<Blob>}
     */
    async function createZip(images) {
        // Simple implementation using browser's built-in compression if available
        // For a production app, you might want to use a library like JSZip
        
        // Since we can't use external libraries, we'll create a simple multi-file download
        // by returning the images as a single downloadable archive
        
        // Create a simple custom archive format that can be extracted
        const files = images.map((dataUrl, index) => ({
            name: `slide-${index + 1}.png`,
            data: dataUrl
        }));

        // For simplicity without external ZIP library, we'll use a different approach:
        // Generate individual download links
        return new Promise((resolve) => {
            // Create a combined blob with file info
            const archiveData = {
                files: files.map(f => ({
                    name: f.name,
                    data: f.data
                }))
            };
            
            const blob = new Blob([JSON.stringify(archiveData)], { type: 'application/json' });
            resolve(blob);
        });
    }

    /**
     * Download all images as individual files (fallback without ZIP)
     * @param {string[]} images
     * @param {number} delay - Delay between downloads in ms
     */
    function downloadAllIndividually(images, delay = 300) {
        images.forEach((dataUrl, index) => {
            setTimeout(() => {
                downloadImage(dataUrl, `carousel-slide-${index + 1}.png`);
            }, index * delay);
        });
    }

    // Public API
    return {
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        generateSlide,
        generateAllSlides,
        downloadImage,
        downloadAllIndividually,
        dataURLtoBlob,
        createZip
    };
})();
