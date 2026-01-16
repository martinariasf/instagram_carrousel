/**
 * App Module - Main orchestrator with logo support
 */
const App = (function() {
    'use strict';
    let state = { generatedImages: [], isGenerating: false, currentAiImageSlide: null };

    async function handleSourceFileAdded(file) {
        try {
            await AIGeneratorModule.addSourceFile(file);
            UIModule.renderUploadedFiles(AIGeneratorModule.getSourceFiles());
        } catch (e) {
            UIModule.showToast('Failed to add file: ' + e.message, 'error');
        }
    }

    function handleSourceFileRemoved(fileId) {
        AIGeneratorModule.removeSourceFile(fileId);
        UIModule.renderUploadedFiles(AIGeneratorModule.getSourceFiles());
    }

    async function handleGenerateText() {
        const btn = document.getElementById('generateTextBtn');
        const settings = UIModule.getGlobalSettings();
        try {
            UIModule.setButtonLoading(btn, true);
            UIModule.setAiStatus('Generating text options...', true);
            UIModule.hideTextOptions();
            const result = await AIGeneratorModule.generateTextOptions(settings.slideCount);
            UIModule.renderTextOptions(result.options);
            UIModule.setAiStatus('Choose a style below', false);
        } catch (e) {
            UIModule.setAiStatus(e.message, false);
            if (e.message.includes('not configured') || e.message.includes('fetch')) {
                if (confirm('Webhook unavailable. Use sample text for testing?')) {
                    const mock = AIGeneratorModule.createMockTextResponse(settings.slideCount);
                    UIModule.renderTextOptions(mock.options);
                    UIModule.setAiStatus('Using sample text', false);
                }
            }
        } finally {
            UIModule.setButtonLoading(btn, false);
        }
    }

    function handleUseTextOption(index) {
        const option = AIGeneratorModule.getTextOption(index);
        if (option) UIModule.applyTextToSlides(option);
    }

    async function handleGenerateAiImage(slideIndex) {
        state.currentAiImageSlide = slideIndex;
        UIModule.showAiImageModal(slideIndex);
        const slides = UIModule.getSlidesData();
        const slideText = slides[slideIndex]?.text || '';
        try {
            const result = await AIGeneratorModule.generateImagesForSlide(slideIndex, slideText);
            UIModule.setAiImageOptions(result.images);
        } catch (e) {
            if (e.message.includes('not configured')) {
                const mock = AIGeneratorModule.createMockImageResponse(slideIndex);
                UIModule.setAiImageOptions(mock.images);
            } else {
                UIModule.showToast('Image generation failed: ' + e.message, 'error');
                UIModule.hideAiImageModal();
            }
        }
    }

    function handleSelectAiImage(imageData) {
        if (state.currentAiImageSlide !== null) {
            UIModule.setSlideImage(state.currentAiImageSlide, imageData);
            UIModule.showToast('Image applied to slide!', 'success');
        }
    }

    async function handleGenerateCarousel() {
        if (state.isGenerating) return;
        const btn = document.getElementById('generateCarouselBtn');
        try {
            state.isGenerating = true;
            UIModule.setButtonLoading(btn, true);
            const settings = UIModule.getGlobalSettings();
            const slides = UIModule.getSlidesData();
            const logoSettings = UIModule.getLogoSettings();
            state.generatedImages = await CanvasModule.generateAllSlides(slides, settings, logoSettings);
            UIModule.renderCarouselSlides(state.generatedImages);
            UIModule.renderCarouselDots(state.generatedImages.length, 0);
            UIModule.renderDownloadButtons(state.generatedImages);
            CarouselModule.setTotalSlides(state.generatedImages.length);
            UIModule.showToast('Carousel generated!', 'success');
        } catch (e) {
            UIModule.showToast('Generation failed: ' + e.message, 'error');
        } finally {
            state.isGenerating = false;
            UIModule.setButtonLoading(btn, false);
        }
    }

    function handleCarouselPrev() { CarouselModule.prevSlide(); }
    function handleCarouselNext() { CarouselModule.nextSlide(); }
    function handleCarouselDotClick(index) { CarouselModule.goToSlide(index); }
    function handleSlideChange(index) { UIModule.updateCarouselDots(index); }

    function handleDownloadSingle(index) {
        if (index >= 0 && index < state.generatedImages.length) {
            CanvasModule.downloadImage(state.generatedImages[index], `gf-carousel-slide-${index + 1}.png`);
        }
    }

    function handleDownloadAll() {
        if (state.generatedImages.length === 0) {
            UIModule.showToast('Generate carousel first', 'error');
            return;
        }
        CanvasModule.downloadAllIndividually(state.generatedImages, 500);
        UIModule.showToast('Downloading all slides...', 'success');
    }

    async function handlePostNow() {
        if (state.generatedImages.length === 0) {
            UIModule.showToast('Generate carousel first', 'error');
            return;
        }
        try {
            await AIGeneratorModule.postNow({ images: state.generatedImages });
            UIModule.showToast('Posted successfully!', 'success');
        } catch (e) {
            UIModule.showToast(e.message, 'error');
        }
    }

    function handleSchedulePost() {
        if (state.generatedImages.length === 0) {
            UIModule.showToast('Generate carousel first', 'error');
            return;
        }
        UIModule.showScheduleModal();
    }

    async function handleConfirmSchedule(data) {
        try {
            await AIGeneratorModule.schedulePost({ images: state.generatedImages, scheduledTime: data.scheduledTime, caption: data.caption });
            UIModule.showToast('Post scheduled!', 'success');
        } catch (e) {
            UIModule.showToast(e.message, 'error');
        }
    }

    function init() {
        UIModule.init({
            onSourceFileAdded: handleSourceFileAdded,
            onSourceFileRemoved: handleSourceFileRemoved,
            onGenerateText: handleGenerateText,
            onUseTextOption: handleUseTextOption,
            onGenerateAiImage: handleGenerateAiImage,
            onSelectAiImage: handleSelectAiImage,
            onGenerateCarousel: handleGenerateCarousel,
            onCarouselPrev: handleCarouselPrev,
            onCarouselNext: handleCarouselNext,
            onCarouselDotClick: handleCarouselDotClick,
            onDownloadSingle: handleDownloadSingle,
            onDownloadAll: handleDownloadAll,
            onPostNow: handlePostNow,
            onSchedulePost: handleSchedulePost,
            onConfirmSchedule: handleConfirmSchedule
        });
        CarouselModule.init({
            container: document.getElementById('carouselContainer'),
            track: document.getElementById('carouselTrack'),
            prevBtn: document.getElementById('carouselPrev'),
            nextBtn: document.getElementById('carouselNext'),
            onSlideChange: handleSlideChange
        });
        UIModule.renderCarouselSlides([]);
        console.log('GF Carousel Studio v4 initialized');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    return { getState: () => ({...state}) };
})();
