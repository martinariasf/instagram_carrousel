/**
 * Carousel Module - Handles carousel navigation and touch/swipe
 */
const CarouselModule = (function() {
    'use strict';
    let state = { currentIndex: 0, totalSlides: 0, track: null, onSlideChange: null };
    let touchStartX = 0, touchEndX = 0;

    function init(options) {
        state.track = options.track;
        state.onSlideChange = options.onSlideChange;
        if (options.container) {
            options.container.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX, { passive: true });
            options.container.addEventListener('touchend', e => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); });
        }
        document.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft') prevSlide();
            else if (e.key === 'ArrowRight') nextSlide();
        });
    }

    function handleSwipe() {
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) nextSlide();
            else prevSlide();
        }
    }

    function setTotalSlides(count) {
        state.totalSlides = count;
        state.currentIndex = 0;
        updateTrackPosition();
    }

    function goToSlide(index) {
        if (index >= 0 && index < state.totalSlides) {
            state.currentIndex = index;
            updateTrackPosition();
            if (state.onSlideChange) state.onSlideChange(state.currentIndex);
        }
    }

    function nextSlide() {
        if (state.currentIndex < state.totalSlides - 1) goToSlide(state.currentIndex + 1);
    }

    function prevSlide() {
        if (state.currentIndex > 0) goToSlide(state.currentIndex - 1);
    }

    function updateTrackPosition() {
        if (state.track) {
            state.track.style.transform = `translateX(-${state.currentIndex * 100}%)`;
        }
    }

    function getCurrentIndex() { return state.currentIndex; }

    return { init, setTotalSlides, goToSlide, nextSlide, prevSlide, getCurrentIndex };
})();
