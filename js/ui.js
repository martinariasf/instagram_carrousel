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
            aiPanel: document.getElementById('aiPanel'),
            slidesPanel: document.getElementById('slidesPanel'),
            slidesContainer: document.getElementById('slidesContainer'),
            previewPanel: document.getElementById('previewPanel'),
            
            // AI Section
            sourceUploadArea: document.getElementById('sourceUploadArea'),
            sourceFileInput: document.getElementById('sourceFileInput'),
            sourcePlaceholder: document.getElementById('sourcePlaceholder'),
            uploadedFilesList: document.getElementById('uploadedFilesList'),
            generateAiBtn: document.getElementById('generateAiBtn'),
            aiStatus: document.getElementById('aiStatus'),
            aiResults: document.getElementById('aiResults'),
            aiOptions: document.getElementById('aiOptions'),
            
            // Buttons
            generateBtn: document.getElementById('generateBtn'),
            downloadAllBtn: document.getElementById('downloadAllBtn'),
            postBtn: document.getElementById('postBtn'),
            configBtn: document.getElementById('configBtn'),
            
            // Configuration Modal
            configModal: document.getElementById('configModal'),
            configModalClose: document.getElementById('configModalClose'),
            configModalCancel: document.getElementById('configModalCancel'),
            configModalSave: document.getElementById('configModalSave'),
            webhookUrl: document.getElementById('webhookUrl'),
            
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

        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            displayImagePreview(uploadArea, dataUrl, slideIndex);
        };
        reader.readAsDataURL(file);
    }

    /**
     * Display image preview in the upload area
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
     * Set up configuration modal
     */
    function setupConfigModal() {
        elements.configBtn.addEventListener('click', () => {
            elements.webhookUrl.value = AIGeneratorModule.getWebhookUrl();
            elements.configModal.classList.remove('hidden');
        });

        elements.configModalClose.addEventListener('click', () => {
            elements.configModal.classList.add('hidden');
        });

        elements.configModalCancel.addEventListener('click', () => {
            elements.configModal.classList.add('hidden');
        });

        elements.configModalSave.addEventListener('click', () => {
            const url = elements.webhookUrl.value.trim();
            AIGeneratorModule.setWebhookUrl(url);
            elements.configModal.classList.add('hidden');
            showAiStatus('Configuration saved successfully!', 'success');
            setTimeout(clearAiStatus, 3000);
        });

        elements.configModal.addEventListener('click', (e) => {
            if (e.target === elements.configModal) {
                elements.configModal.classList.add('hidden');
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !elements.configModal.classList.contains('hidden')) {
                elements.configModal.classList.add('hidden');
            }
        });
    }

    /**
     * Set up source file upload handlers
     */
    function setupSourceFileUpload(onFileAdded, onFileRemoved) {
        // Drag and drop
        elements.sourceUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            elements.sourceUploadArea.classList.add('drag-over');
        });

        elements.sourceUploadArea.addEventListener('dragleave', () => {
            elements.sourceUploadArea.classList.remove('drag-over');
        });

        elements.sourceUploadArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            elements.sourceUploadArea.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            for (const file of files) {
                if (isValidSourceFile(file)) {
                    await onFileAdded(file);
                }
            }
        });

        // File input
        elements.sourceFileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            for (const file of files) {
                if (isValidSourceFile(file)) {
                    await onFileAdded(file);
                }
            }
            e.target.value = '';
        });

        // File removal (delegated)
        elements.uploadedFilesList.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.remove-file');
            if (removeBtn) {
                const fileId = removeBtn.dataset.fileId;
                onFileRemoved(fileId);
            }
        });
    }

    /**
     * Check if file is valid source file
     */
    function isValidSourceFile(file) {
        const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        return validTypes.includes(file.type) || file.type.startsWith('image/');
    }

    /**
     * Render uploaded files list
     */
    function renderUploadedFiles(files) {
        if (files.length === 0) {
            elements.uploadedFilesList.innerHTML = '';
            return;
        }

        const html = files.map(file => `
            <div class="uploaded-file" data-file-id="${file.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${file.type === 'application/pdf' 
                        ? '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>'
                        : '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'
                    }
                </svg>
                <span class="file-name">${file.name}</span>
                <button class="remove-file" data-file-id="${file.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        `).join('');

        elements.uploadedFilesList.innerHTML = html;
    }

    /**
     * Show AI status message
     */
    function showAiStatus(message, type = 'info') {
        elements.aiStatus.textContent = message;
        elements.aiStatus.className = 'ai-status';
        if (type === 'error') {
            elements.aiStatus.classList.add('error');
        } else if (type === 'success') {
            elements.aiStatus.classList.add('success');
        }
    }

    /**
     * Clear AI status
     */
    function clearAiStatus() {
        elements.aiStatus.textContent = '';
        elements.aiStatus.className = 'ai-status';
    }

    /**
     * Render AI options
     */
    function renderAiOptions(options) {
        elements.aiResults.classList.remove('hidden');

        options.forEach((option, index) => {
            const previewEl = document.getElementById(`optionPreview${index}`);
            if (previewEl) {
                const slidesHtml = option.slides.map(slide => `
                    <div class="slide-preview">
                        <div class="slide-label">Slide ${slide.slideNumber}</div>
                        <div class="slide-text">${slide.text}</div>
                    </div>
                `).join('');
                previewEl.innerHTML = slidesHtml;
            }
        });
    }

    /**
     * Hide AI results
     */
    function hideAiResults() {
        elements.aiResults.classList.add('hidden');
    }

    /**
     * Apply selected option to slide inputs
     */
    function applyOptionToSlides(option) {
        const textareas = elements.slidesContainer.querySelectorAll('.slide-text');
        
        option.slides.forEach((slide, index) => {
            if (textareas[index]) {
                textareas[index].value = slide.text;
            }
        });

        // Scroll to slides panel
        elements.slidesPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Show success message
        showAiStatus('Text applied to slides! You can edit them before generating.', 'success');
        setTimeout(clearAiStatus, 4000);
    }

    /**
     * Show the preview panel with generated images
     */
    function showPreview(images) {
        elements.previewPanel.classList.remove('hidden');
        
        setTimeout(() => {
            elements.previewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    /**
     * Render carousel slides
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
     */
    function updateCarouselDots(activeIndex) {
        const dots = elements.carouselDots.querySelectorAll('.carousel-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === activeIndex);
        });
    }

    /**
     * Render individual download buttons
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
     */
    function initEventListeners(callbacks) {
        // Generate carousel button
        elements.generateBtn.addEventListener('click', () => {
            if (callbacks.onGenerate) {
                callbacks.onGenerate();
            }
        });

        // Generate AI text button
        elements.generateAiBtn.addEventListener('click', () => {
            if (callbacks.onGenerateAi) {
                callbacks.onGenerateAi();
            }
        });

        // Use option buttons
        elements.aiOptions.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-use-option');
            if (btn) {
                const optionIndex = parseInt(btn.dataset.option, 10);
                if (callbacks.onUseOption) {
                    callbacks.onUseOption(optionIndex);
                }
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
     */
    function init(callbacks) {
        cacheElements();
        setupAlignmentButtons();
        setupBackgroundModeToggle();
        setupSlideCountHandler();
        setupColorInputs();
        setupConfigModal();
        renderSlideInputs();
        initEventListeners(callbacks);

        // Setup source file upload with callbacks
        setupSourceFileUpload(
            callbacks.onSourceFileAdded,
            callbacks.onSourceFileRemoved
        );
    }

    // Public API
    return {
        init,
        elements,
        getGlobalSettings,
        getSlidesData,
        renderSlideInputs,
        renderUploadedFiles,
        showAiStatus,
        clearAiStatus,
        renderAiOptions,
        hideAiResults,
        applyOptionToSlides,
        showPreview,
        renderCarouselSlides,
        renderCarouselDots,
        updateCarouselDots,
        renderDownloadButtons,
        setButtonLoading
    };
})();
