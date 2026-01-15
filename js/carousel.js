/**
 * Carousel Module
 * Handles the carousel slider behavior, including swipe gestures
 */

const CarouselModule = (function() {
    'use strict';

    // State
    let state = {
        currentIndex: 0,
        totalSlides: 0,
        isAnimating: false
    };

    // DOM references
    let elements = {
        container: null,
        track: null,
        prevBtn: null,
        nextBtn: null
    };

    // Touch/swipe tracking
    let touch = {
        startX: 0,
        startY: 0,
        currentX: 0,
        isDragging: false,
        threshold: 50
    };

    // Callbacks
    let callbacks = {
        onSlideChange: null
    };

    /**
     * Initialize the carousel
     * @param {Object} config
     */
    function init(config) {
        elements.container = config.container;
        elements.track = config.track;
        elements.prevBtn = config.prevBtn;
        elements.nextBtn = config.nextBtn;
        callbacks.onSlideChange = config.onSlideChange;

        attachTouchListeners();
        attachKeyboardListeners();
    }

    /**
     * Set the total number of slides
     * @param {number} total
     */
    function setTotalSlides(total) {
        state.totalSlides = total;
        state.currentIndex = 0;
        updatePosition(false);
        updateNavigationState();
    }

    /**
     * Go to a specific slide
     * @param {number} index
     */
    function goToSlide(index) {
        if (state.isAnimating) return;
        if (index < 0 || index >= state.totalSlides) return;
        if (index === state.currentIndex) return;

        state.currentIndex = index;
        updatePosition(true);
        updateNavigationState();
        
        if (callbacks.onSlideChange) {
            callbacks.onSlideChange(state.currentIndex);
        }
    }

    /**
     * Go to the next slide
     */
    function nextSlide() {
        if (state.currentIndex < state.totalSlides - 1) {
            goToSlide(state.currentIndex + 1);
        }
    }

    /**
     * Go to the previous slide
     */
    function prevSlide() {
        if (state.currentIndex > 0) {
            goToSlide(state.currentIndex - 1);
        }
    }

    /**
     * Update the carousel track position
     * @param {boolean} animate
     */
    function updatePosition(animate = true) {
        if (!elements.track) return;

        const offset = -state.currentIndex * 100;
        
        if (animate) {
            state.isAnimating = true;
            elements.track.style.transition = 'transform 400ms ease';
            
            setTimeout(() => {
                state.isAnimating = false;
            }, 400);
        } else {
            elements.track.style.transition = 'none';
        }
        
        elements.track.style.transform = `translateX(${offset}%)`;
    }

    /**
     * Update navigation button states
     */
    function updateNavigationState() {
        if (elements.prevBtn) {
            elements.prevBtn.disabled = state.currentIndex === 0;
        }
        if (elements.nextBtn) {
            elements.nextBtn.disabled = state.currentIndex === state.totalSlides - 1;
        }
    }

    /**
     * Get the current slide index
     * @returns {number}
     */
    function getCurrentIndex() {
        return state.currentIndex;
    }

    /**
     * Attach touch event listeners for swipe support
     */
    function attachTouchListeners() {
        if (!elements.container) return;

        elements.container.addEventListener('touchstart', handleTouchStart, { passive: true });
        elements.container.addEventListener('touchmove', handleTouchMove, { passive: true });
        elements.container.addEventListener('touchend', handleTouchEnd);
        elements.container.addEventListener('touchcancel', handleTouchEnd);

        // Mouse drag support
        elements.container.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    /**
     * Handle touch start
     * @param {TouchEvent} e
     */
    function handleTouchStart(e) {
        if (state.isAnimating) return;
        
        touch.startX = e.touches[0].clientX;
        touch.startY = e.touches[0].clientY;
        touch.isDragging = true;
    }

    /**
     * Handle touch move
     * @param {TouchEvent} e
     */
    function handleTouchMove(e) {
        if (!touch.isDragging) return;
        
        touch.currentX = e.touches[0].clientX;
        const diffX = touch.currentX - touch.startX;
        const diffY = e.touches[0].clientY - touch.startY;

        // Only track horizontal swipes
        if (Math.abs(diffX) > Math.abs(diffY)) {
            const baseOffset = -state.currentIndex * 100;
            const dragOffset = (diffX / elements.container.offsetWidth) * 100;
            elements.track.style.transition = 'none';
            elements.track.style.transform = `translateX(${baseOffset + dragOffset}%)`;
        }
    }

    /**
     * Handle touch end
     */
    function handleTouchEnd() {
        if (!touch.isDragging) return;
        
        touch.isDragging = false;
        const diffX = touch.currentX - touch.startX;

        if (Math.abs(diffX) > touch.threshold) {
            if (diffX > 0) {
                prevSlide();
            } else {
                nextSlide();
            }
        } else {
            // Snap back to current slide
            updatePosition(true);
        }

        touch.startX = 0;
        touch.currentX = 0;
    }

    /**
     * Handle mouse down (for desktop drag)
     * @param {MouseEvent} e
     */
    function handleMouseDown(e) {
        if (state.isAnimating) return;
        
        e.preventDefault();
        touch.startX = e.clientX;
        touch.isDragging = true;
        elements.container.style.cursor = 'grabbing';
    }

    /**
     * Handle mouse move
     * @param {MouseEvent} e
     */
    function handleMouseMove(e) {
        if (!touch.isDragging) return;
        
        touch.currentX = e.clientX;
        const diffX = touch.currentX - touch.startX;
        const baseOffset = -state.currentIndex * 100;
        const dragOffset = (diffX / elements.container.offsetWidth) * 100;
        
        elements.track.style.transition = 'none';
        elements.track.style.transform = `translateX(${baseOffset + dragOffset}%)`;
    }

    /**
     * Handle mouse up
     */
    function handleMouseUp() {
        if (!touch.isDragging) return;
        
        touch.isDragging = false;
        elements.container.style.cursor = 'grab';
        
        const diffX = touch.currentX - touch.startX;

        if (Math.abs(diffX) > touch.threshold) {
            if (diffX > 0) {
                prevSlide();
            } else {
                nextSlide();
            }
        } else {
            updatePosition(true);
        }

        touch.startX = 0;
        touch.currentX = 0;
    }

    /**
     * Attach keyboard event listeners
     */
    function attachKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            // Only respond if preview panel is visible
            const previewPanel = document.getElementById('previewPanel');
            if (!previewPanel || previewPanel.classList.contains('hidden')) return;

            switch (e.key) {
                case 'ArrowLeft':
                    prevSlide();
                    break;
                case 'ArrowRight':
                    nextSlide();
                    break;
            }
        });
    }

    /**
     * Reset the carousel to initial state
     */
    function reset() {
        state.currentIndex = 0;
        state.totalSlides = 0;
        state.isAnimating = false;
        
        if (elements.track) {
            elements.track.style.transform = 'translateX(0)';
        }
    }

    // Public API
    return {
        init,
        setTotalSlides,
        goToSlide,
        nextSlide,
        prevSlide,
        getCurrentIndex,
        reset
    };
})();
