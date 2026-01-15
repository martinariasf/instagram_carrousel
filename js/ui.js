/**
 * UI Module
 * Handles all DOM rendering and user interface interactions
 */

const UIModule = (function() {
    'use strict';

    // DOM element references (cached)
    let elements = {};

    /**
     * Initialize DOM element references
     */
    function cacheElements() {
        elements = {
            // Settings
            slideCount: document.getElementById('slideCount'),
            fontFamily: document.getElementById('fontFamily'),
            fontSize: document.getElementById('fontSize'),
            textColor: document.getElementById('textColor'),
            textColorValue: document.getElementById('textColorValue'),
            textAlign: document.getElementById('textAlign'),
            backgroundMode: document.getElementById('backgroundMode'),
            backgroundColor: document.getElementById('backgroundColor'),
            backgroundColorValue: document.getElementById('backgroundColorValue'),
            backgroundColorGroup: document.getElementById('backgroundColorGroup'),
            
            // Panels
            settingsPanel: document.getElementById('settingsPanel'),
            slidesPanel: document.getElementById('slidesPanel'),
            slidesContainer: document.getElementById('slidesContainer'),
            previewPanel: document.getElementById('previewPanel'),
            
            // Buttons
            generateBtn: document.getElementById('generateBtn'),
            downloadAllBtn: document.getElementById('downloadAllBtn'),
            postBtn: document.getElementById('postBtn'),
            
            // Carousel
            carouselContainer: document.getElementById('carouselContainer'),
            carouselTrack: document.getElementById('carouselTrack'),
            carouselDots: document.getElementById('carouselDots'),
            carouselPrev: document.getElementById('carouselPrev'),
            carouselNext: document.getElementById('carouselNext'),
            
            // Export
            individualDownloads: document.getElementById('individualDownloads'),
            
            // Canvas container
            canvasContainer: document.getElementById('canvasContainer')
        };
    }

    /**
     * Get current global settings from the UI
     * @returns {Object}
     */
    function getGlobalSettings() {
        const alignButtons = elements.textAlign.querySelectorAll('.align-btn');
        let textAlign = 'center';
        alignButtons.forEach(btn => {
            if (btn.classList.contains('active')) {
                textAlign = btn.dataset.align;
            }
        });

        const modeButtons = elements.backgroundMode.querySelectorAll('.toggle-btn');
        let backgroundMode = 'color';
        modeButtons.forEach(btn => {
            if (btn.classList.contains('active')) {
                backgroundMode = btn.dataset.mode;
            }
        });

        return {
            slideCount: parseInt(elements.slideCount.value, 10) || 3,
            fontFamily: elements.fontFamily.value,
            fontSize: parseInt(elements.fontSize.value, 10) || 64,
            textColor: elements.textColor.value,
            textAlign,
            backgroundMode,
            backgroundColor: elements.backgroundColor.value
        };
    }

    /**
     * Get slides data from the UI
     * @returns {Array}
     */
    function getSlidesData() {
        const slides = [];
        const slideGroups = elements.slidesContainer.querySelectorAll('.slide-input-group');

        slideGroups.forEach((group, index) => {
            const textInput = group.querySelector('.slide-text');
            const imageInput = group.querySelector('.slide-image-input');
            const preview = group.querySelector('.image-preview');

            slides.push({
                index,
                text: textInput ? textInput.value : '',
                backgroundImage: preview && preview.src ? preview.src : null
            });
        });

        return slides;
    }

    /**
     * Create the HTML for a single slide input group
     * @param {number} index
     * @param {boolean} showImageUpload
     * @returns {string}
     */
    function createSlideInputHTML(index, showImageUpload) {
        const slideNumber = index + 1;
        
        let imageUploadHTML = '';
        if (showImageUpload) {
            imageUploadHTML = `
                <div class="image-upload-area" data-slide="${index}">
                    <div class="upload-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <span>Click to upload background image</span>
                    </div>
                    <input type="file" accept="image/*" class="slide-image-input" data-slide="${index}">
                </div>
            `;
        }

        return `
            <div class="slide-input-group" data-slide-index="${index}">
                <div class="slide-header">
                    <span class="slide-number">Slide ${slideNumber}</span>
                    <span class="slide-badge">${CanvasModule.CANVAS_WIDTH} × ${CanvasModule.CANVAS_HEIGHT}</span>
                </div>
                <div class="slide-content">
                    <textarea 
                        class="slide-text" 
                        placeholder="Enter your text for slide ${slideNumber}..."
                        data-slide="${index}"
                    ></textarea>
                    ${imageUploadHTML}
                </div>
            </div>
        `;
    }

    /**
     * Render all slide input groups based on current settings
     */
    function renderSlideInputs() {
        const settings = getGlobalSettings();
        const { slideCount, backgroundMode } = settings;
        const showImageUpload = backgroundMode === 'image';

        let html = '';
        for (let i = 0; i < slideCount; i++) {
            html += createSlideInputHTML(i, showImageUpload);
        }

        elements.slidesContainer.innerHTML = html;

        // Attach event listeners for image uploads
        if (showImageUpload) {
            attachImageUploadListeners();
        }
    }

    /**
     * Attach event listeners to image upload inputs
     */
    function attachImageUploadListeners() {
        const imageInputs = elements.slidesContainer.querySelectorAll('.slide-image-input');
        
        imageInputs.forEach(input => {
            input.addEventListener('change', handleImageUpload);
        });
    }

    /**
     * Handle image upload for a slide
     * @param {Event} event
     */
    function handleImageUpload(event) {
        const input = event.target;
        const slideIndex = input.dataset.slide;
        const file = input.files[0];
        const uploadArea = input.closest('.image-upload-area');

        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        // Read and display the image
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            displayImagePreview(uploadArea, dataUrl, slideIndex);
        };
        reader.readAsDataURL(file);
    }

    /**
     * Display image preview in the upload area
     * @param {HTMLElement} uploadArea
     * @param {string} dataUrl
     * @param {number} slideIndex
     */
    function displayImagePreview(uploadArea, dataUrl, slideIndex) {
        uploadArea.classList.add('has-image');
        uploadArea.innerHTML = `
            <img class="image-preview" src="${dataUrl}" alt="Slide ${parseInt(slideIndex) + 1} background">
            <button type="button" class="remove-image-btn" data-slide="${slideIndex}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
            <input type="file" accept="image/*" class="slide-image-input" data-slide="${slideIndex}">
        `;

        // Re-attach listeners
        const newInput = uploadArea.querySelector('.slide-image-input');
        newInput.addEventListener('change', handleImageUpload);

        const removeBtn = uploadArea.querySelector('.remove-image-btn');
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            removeImagePreview(uploadArea, slideIndex);
        });
    }

    /**
     * Remove image preview from upload area
     * @param {HTMLElement} uploadArea
     * @param {number} slideIndex
     */
    function removeImagePreview(uploadArea, slideIndex) {
        uploadArea.classList.remove('has-image');
        uploadArea.innerHTML = `
            <div class="upload-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>Click to upload background image</span>
            </div>
            <input type="file" accept="image/*" class="slide-image-input" data-slide="${slideIndex}">
        `;

        const newInput = uploadArea.querySelector('.slide-image-input');
        newInput.addEventListener('change', handleImageUpload);
    }

    /**
     * Update color value display
     * @param {HTMLInputElement} colorInput
     * @param {HTMLElement} valueDisplay
     */
    function updateColorValue(colorInput, valueDisplay) {
        valueDisplay.textContent = colorInput.value;
    }

    /**
     * Set up alignment button behavior
     */
    function setupAlignmentButtons() {
        const buttons = elements.textAlign.querySelectorAll('.align-btn');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    /**
     * Set up background mode toggle
     */
    function setupBackgroundModeToggle() {
        const buttons = elements.backgroundMode.querySelectorAll('.toggle-btn');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const mode = btn.dataset.mode;
                if (mode === 'color') {
                    elements.backgroundColorGroup.classList.remove('hidden');
                } else {
                    elements.backgroundColorGroup.classList.add('hidden');
                }

                // Re-render slide inputs when mode changes
                renderSlideInputs();
            });
        });
    }

    /**
     * Set up slide count change handler
     */
    function setupSlideCountHandler() {
        elements.slideCount.addEventListener('change', () => {
            const count = parseInt(elements.slideCount.value, 10);
            if (count < 1) elements.slideCount.value = 1;
            if (count > 10) elements.slideCount.value = 10;
            renderSlideInputs();
        });
    }

    /**
     * Set up color input handlers
     */
    function setupColorInputs() {
        elements.textColor.addEventListener('input', () => {
            updateColorValue(elements.textColor, elements.textColorValue);
        });

        elements.backgroundColor.addEventListener('input', () => {
            updateColorValue(elements.backgroundColor, elements.backgroundColorValue);
        });
    }

    /**
     * Show the preview panel with generated images
     * @param {string[]} images - Array of data URLs
     */
    function showPreview(images) {
        elements.previewPanel.classList.remove('hidden');
        
        // Smooth scroll to preview
        setTimeout(() => {
            elements.previewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    /**
     * Render carousel slides
     * @param {string[]} images - Array of data URLs
     */
    function renderCarouselSlides(images) {
        let slidesHTML = '';
        images.forEach((dataUrl, index) => {
            slidesHTML += `
                <div class="carousel-slide" data-index="${index}">
                    <img src="${dataUrl}" alt="Slide ${index + 1}">
                </div>
            `;
        });
        elements.carouselTrack.innerHTML = slidesHTML;
    }

    /**
     * Render carousel dots
     * @param {number} count
     * @param {number} activeIndex
     */
    function renderCarouselDots(count, activeIndex = 0) {
        let dotsHTML = '';
        for (let i = 0; i < count; i++) {
            dotsHTML += `
                <button class="carousel-dot ${i === activeIndex ? 'active' : ''}" data-index="${i}"></button>
            `;
        }
        elements.carouselDots.innerHTML = dotsHTML;
    }

    /**
     * Update active carousel dot
     * @param {number} activeIndex
     */
    function updateCarouselDots(activeIndex) {
        const dots = elements.carouselDots.querySelectorAll('.carousel-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === activeIndex);
        });
    }

    /**
     * Render individual download buttons
     * @param {string[]} images - Array of data URLs
     */
    function renderDownloadButtons(images) {
        let buttonsHTML = '';
        images.forEach((dataUrl, index) => {
            buttonsHTML += `
                <button class="individual-download-btn" data-index="${index}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Slide ${index + 1}
                </button>
            `;
        });
        elements.individualDownloads.innerHTML = buttonsHTML;
    }

    /**
     * Set button loading state
     * @param {HTMLButtonElement} button
     * @param {boolean} loading
     */
    function setButtonLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    /**
     * Initialize all UI event listeners
     * @param {Object} callbacks
     */
    function initEventListeners(callbacks) {
        // Generate button
        elements.generateBtn.addEventListener('click', () => {
            if (callbacks.onGenerate) {
                callbacks.onGenerate();
            }
        });

        // Download all button
        elements.downloadAllBtn.addEventListener('click', () => {
            if (callbacks.onDownloadAll) {
                callbacks.onDownloadAll();
            }
        });

        // Post to Instagram button
        elements.postBtn.addEventListener('click', () => {
            if (callbacks.onPost) {
                callbacks.onPost();
            }
        });

        // Carousel navigation
        elements.carouselPrev.addEventListener('click', () => {
            if (callbacks.onCarouselPrev) {
                callbacks.onCarouselPrev();
            }
        });

        elements.carouselNext.addEventListener('click', () => {
            if (callbacks.onCarouselNext) {
                callbacks.onCarouselNext();
            }
        });

        // Carousel dots
        elements.carouselDots.addEventListener('click', (e) => {
            if (e.target.classList.contains('carousel-dot')) {
                const index = parseInt(e.target.dataset.index, 10);
                if (callbacks.onCarouselDotClick) {
                    callbacks.onCarouselDotClick(index);
                }
            }
        });

        // Individual downloads
        elements.individualDownloads.addEventListener('click', (e) => {
            const btn = e.target.closest('.individual-download-btn');
            if (btn) {
                const index = parseInt(btn.dataset.index, 10);
                if (callbacks.onDownloadSingle) {
                    callbacks.onDownloadSingle(index);
                }
            }
        });
    }

    /**
     * Initialize the UI module
     * @param {Object} callbacks
     */
    function init(callbacks) {
        cacheElements();
        setupAlignmentButtons();
        setupBackgroundModeToggle();
        setupSlideCountHandler();
        setupColorInputs();
        renderSlideInputs();
        initEventListeners(callbacks);
    }

    // Public API
    return {
        init,
        elements,
        getGlobalSettings,
        getSlidesData,
        renderSlideInputs,
        showPreview,
        renderCarouselSlides,
        renderCarouselDots,
        updateCarouselDots,
        renderDownloadButtons,
        setButtonLoading
    };
})();
