/**
 * App Module
 * Main application orchestrator - ties all modules together
 */

const App = (function() {
    'use strict';

    // Application state
    let state = {
        generatedImages: [],
        isGenerating: false
    };

    /**
     * Handle source file added
     * @param {File} file
     */
    async function handleSourceFileAdded(file) {
        try {
            await AIGeneratorModule.addSourceFile(file);
            UIModule.renderUploadedFiles(AIGeneratorModule.getSourceFiles());
        } catch (error) {
            console.error('Error adding file:', error);
            UIModule.showAiStatus('Failed to add file: ' + error.message, 'error');
        }
    }

    /**
     * Handle source file removed
     * @param {string} fileId
     */
    function handleSourceFileRemoved(fileId) {
        AIGeneratorModule.removeSourceFile(fileId);
        UIModule.renderUploadedFiles(AIGeneratorModule.getSourceFiles());
    }

    /**
     * Handle AI text generation
     */
    async function handleGenerateAi() {
        const generateAiBtn = document.getElementById('generateAiBtn');
        const settings = UIModule.getGlobalSettings();
        
        try {
            UIModule.setButtonLoading(generateAiBtn, true);
            UIModule.showAiStatus('Generating text options...', 'info');
            UIModule.hideAiResults();

            const result = await AIGeneratorModule.generateTextOptions(settings.slideCount);
            
            UIModule.renderAiOptions(result.options);
            UIModule.showAiStatus('Generated 3 text options. Choose one below!', 'success');

        } catch (error) {
            console.error('Error generating AI text:', error);
            UIModule.showAiStatus(error.message, 'error');

            // If webhook fails, offer mock data for testing
            if (error.message.includes('Webhook URL not configured') || error.message.includes('fetch')) {
                const useMock = confirm('Webhook not available. Would you like to use sample text for testing?');
                if (useMock) {
                    const mockResult = AIGeneratorModule.createMockResponse(settings.slideCount);
                    UIModule.renderAiOptions(mockResult.options);
                    UIModule.showAiStatus('Using sample text for testing. Configure webhook for real AI generation.', 'success');
                }
            }
        } finally {
            UIModule.setButtonLoading(generateAiBtn, false);
        }
    }

    /**
     * Handle option selection
     * @param {number} optionIndex
     */
    function handleUseOption(optionIndex) {
        const option = AIGeneratorModule.getOption(optionIndex);
        if (option) {
            UIModule.applyOptionToSlides(option);
        }
    }

    /**
     * Handle generate carousel button click
     */
    async function handleGenerate() {
        if (state.isGenerating) return;

        const generateBtn = document.getElementById('generateBtn');
        
        try {
            state.isGenerating = true;
            UIModule.setButtonLoading(generateBtn, true);

            // Get settings and slide data
            const globalSettings = UIModule.getGlobalSettings();
            const slidesData = UIModule.getSlidesData();

            // Validate
            if (slidesData.length === 0) {
                alert('Please add at least one slide.');
                return;
            }

            // Check if any slide has text
            const hasContent = slidesData.some(slide => slide.text.trim() !== '');
            if (!hasContent && globalSettings.backgroundMode === 'color') {
                const proceed = confirm('All slides are empty. Generate anyway?');
                if (!proceed) return;
            }

            // Generate images
            console.log('Generating carousel with settings:', globalSettings);
            console.log('Slides data:', slidesData);

            state.generatedImages = await CanvasModule.generateAllSlides(slidesData, globalSettings);

            console.log(`Generated ${state.generatedImages.length} images`);

            // Update UI
            displayCarousel(state.generatedImages);

        } catch (error) {
            console.error('Error generating carousel:', error);
            alert('An error occurred while generating the carousel. Please try again.');
        } finally {
            state.isGenerating = false;
            UIModule.setButtonLoading(generateBtn, false);
        }
    }

    /**
     * Display the generated carousel in the preview panel
     * @param {string[]} images
     */
    function displayCarousel(images) {
        // Render carousel slides
        UIModule.renderCarouselSlides(images);
        
        // Render dots
        UIModule.renderCarouselDots(images.length, 0);
        
        // Render download buttons
        UIModule.renderDownloadButtons(images);
        
        // Show preview panel
        UIModule.showPreview(images);
        
        // Initialize carousel with new slides
        CarouselModule.setTotalSlides(images.length);
    }

    /**
     * Handle carousel previous button click
     */
    function handleCarouselPrev() {
        CarouselModule.prevSlide();
    }

    /**
     * Handle carousel next button click
     */
    function handleCarouselNext() {
        CarouselModule.nextSlide();
    }

    /**
     * Handle carousel dot click
     * @param {number} index
     */
    function handleCarouselDotClick(index) {
        CarouselModule.goToSlide(index);
    }

    /**
     * Handle carousel slide change
     * @param {number} index
     */
    function handleSlideChange(index) {
        UIModule.updateCarouselDots(index);
    }

    /**
     * Handle download single image
     * @param {number} index
     */
    function handleDownloadSingle(index) {
        if (index < 0 || index >= state.generatedImages.length) return;
        
        const dataUrl = state.generatedImages[index];
        const filename = `gf-carousel-slide-${index + 1}.png`;
        
        CanvasModule.downloadImage(dataUrl, filename);
    }

    /**
     * Handle download all images
     */
    function handleDownloadAll() {
        if (state.generatedImages.length === 0) {
            alert('No images to download. Please generate the carousel first.');
            return;
        }

        // Download all images with a slight delay between each
        CanvasModule.downloadAllIndividually(state.generatedImages, 500);
    }

    /**
     * Handle post to Instagram button click
     */
    function handlePost() {
        alert('Instagram API not connected. Export images to post manually.');
    }

    /**
     * Initialize the application
     */
    function init() {
        console.log('Initializing GF Carousel Studio...');

        // Initialize UI with callbacks
        UIModule.init({
            onGenerate: handleGenerate,
            onGenerateAi: handleGenerateAi,
            onUseOption: handleUseOption,
            onDownloadAll: handleDownloadAll,
            onDownloadSingle: handleDownloadSingle,
            onPost: handlePost,
            onCarouselPrev: handleCarouselPrev,
            onCarouselNext: handleCarouselNext,
            onCarouselDotClick: handleCarouselDotClick,
            onSourceFileAdded: handleSourceFileAdded,
            onSourceFileRemoved: handleSourceFileRemoved
        });

        // Initialize Carousel
        CarouselModule.init({
            container: document.getElementById('carouselContainer'),
            track: document.getElementById('carouselTrack'),
            prevBtn: document.getElementById('carouselPrev'),
            nextBtn: document.getElementById('carouselNext'),
            onSlideChange: handleSlideChange
        });

        // Load existing webhook configuration
        const webhookUrl = AIGeneratorModule.getWebhookUrl();
        if (!webhookUrl) {
            console.log('No webhook URL configured. Click the settings icon to configure.');
        }

        console.log('GF Carousel Studio initialized successfully!');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    return {
        getState: () => ({ ...state }),
        regenerate: handleGenerate
    };
})();
