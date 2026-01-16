/**
 * AI Generator Module
 * Handles webhook communication for AI-powered text and image generation
 */

const AIGeneratorModule = (function() {
    'use strict';

    const CONFIG_KEY = 'gf_carousel_config_v3';
    
    let state = {
        sourceFiles: [],
        generatedTextOptions: null,
        generatedImages: {},
        isGeneratingText: false,
        isGeneratingImages: false
    };

    function getConfig() {
        try {
            const stored = localStorage.getItem(CONFIG_KEY);
            return stored ? JSON.parse(stored) : {
                webhookTextUrl: '',
                webhookImageUrl: '',
                webhookScheduleUrl: ''
            };
        } catch (e) {
            return { webhookTextUrl: '', webhookImageUrl: '', webhookScheduleUrl: '' };
        }
    }

    function saveConfig(config) {
        try {
            localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
            return true;
        } catch (e) {
            return false;
        }
    }

    function getWebhookUrls() {
        const config = getConfig();
        return {
            text: config.webhookTextUrl || '',
            image: config.webhookImageUrl || '',
            schedule: config.webhookScheduleUrl || ''
        };
    }

    function setWebhookUrl(type, url) {
        const config = getConfig();
        if (type === 'text') config.webhookTextUrl = url;
        else if (type === 'image') config.webhookImageUrl = url;
        else if (type === 'schedule') config.webhookScheduleUrl = url;
        return saveConfig(config);
    }

    async function addSourceFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileData = {
                    id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result
                };
                state.sourceFiles.push(fileData);
                resolve(fileData);
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    function removeSourceFile(fileId) {
        state.sourceFiles = state.sourceFiles.filter(f => f.id !== fileId);
    }

    function getSourceFiles() {
        return [...state.sourceFiles];
    }

    function clearSourceFiles() {
        state.sourceFiles = [];
    }

    async function generateTextOptions(slideCount) {
        const urls = getWebhookUrls();
        if (!urls.text) throw new Error('Text generation webhook URL not configured.');
        if (state.sourceFiles.length === 0) throw new Error('Please upload at least one source file.');
        if (state.isGeneratingText) throw new Error('Text generation already in progress.');
        
        state.isGeneratingText = true;
        
        try {
            const payload = {
                slideCount,
                sources: state.sourceFiles.map(file => ({
                    name: file.name,
                    type: file.type,
                    data: file.data
                })),
                options: { language: 'en', tones: ['professional', 'engaging', 'concise'] }
            };
            
            const response = await fetch(urls.text, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) throw new Error(`Webhook returned status ${response.status}`);
            
            const result = await response.json();
            if (!result.options || result.options.length !== 3) throw new Error('Invalid response format.');
            
            state.generatedTextOptions = result.options;
            return result;
        } finally {
            state.isGeneratingText = false;
        }
    }

    async function generateImagesForSlide(slideIndex, slideText, context = '') {
        const urls = getWebhookUrls();
        if (!urls.image) throw new Error('Image generation webhook URL not configured.');
        
        const payload = {
            slideIndex,
            slideText,
            context,
            sourceInfo: state.sourceFiles.map(f => ({ name: f.name, type: f.type })),
            imageCount: 3,
            dimensions: { width: 1080, height: 1350 }
        };
        
        const response = await fetch(urls.image, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error(`Image webhook returned status ${response.status}`);
        
        const result = await response.json();
        if (!result.images || result.images.length !== 3) throw new Error('Invalid image response.');
        
        state.generatedImages[slideIndex] = result.images;
        return result;
    }

    function getGeneratedImages(slideIndex) {
        return state.generatedImages[slideIndex] || null;
    }

    async function schedulePost(postData) {
        const urls = getWebhookUrls();
        if (!urls.schedule) throw new Error('Schedule webhook URL not configured.');
        
        const payload = {
            images: postData.images,
            caption: postData.caption || '',
            scheduledTime: postData.scheduledTime,
            postNow: postData.postNow || false,
            metadata: { slideCount: postData.images.length, createdAt: new Date().toISOString() }
        };
        
        const response = await fetch(urls.schedule, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error(`Schedule webhook returned status ${response.status}`);
        return await response.json();
    }

    async function postNow(postData) {
        return schedulePost({ ...postData, postNow: true });
    }

    function getGeneratedTextOptions() {
        return state.generatedTextOptions;
    }

    function getTextOption(index) {
        if (!state.generatedTextOptions || index < 0 || index >= state.generatedTextOptions.length) return null;
        return state.generatedTextOptions[index];
    }

    function isGenerating() {
        return state.isGeneratingText || state.isGeneratingImages;
    }

    function reset() {
        state.sourceFiles = [];
        state.generatedTextOptions = null;
        state.generatedImages = {};
        state.isGeneratingText = false;
        state.isGeneratingImages = false;
    }

    function createMockTextResponse(slideCount) {
        return {
            options: [
                {
                    tone: 'professional', label: 'Professional', description: 'Formal and authoritative tone',
                    slides: Array.from({ length: slideCount }, (_, i) => ({
                        slideNumber: i + 1,
                        text: `Professional slide ${i + 1}: Strategic insights driving innovation and sustainable growth.`
                    }))
                },
                {
                    tone: 'engaging', label: 'Engaging', description: 'Dynamic and captivating tone',
                    slides: Array.from({ length: slideCount }, (_, i) => ({
                        slideNumber: i + 1,
                        text: `🚀 Slide ${i + 1}: Discover how technology is transforming businesses worldwide!`
                    }))
                },
                {
                    tone: 'concise', label: 'Concise', description: 'Short and punchy tone',
                    slides: Array.from({ length: slideCount }, (_, i) => ({
                        slideNumber: i + 1,
                        text: `Slide ${i + 1}: Innovation. Impact. Results.`
                    }))
                }
            ]
        };
    }

    function createMockImageResponse(slideIndex) {
        const placeholderBase = 'data:image/svg+xml;base64,';
        const svgTemplate = (color, num) => btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><rect fill="${color}" width="1080" height="1350"/><text x="540" y="675" font-family="Arial" font-size="48" fill="white" text-anchor="middle">AI Image ${num}</text></svg>`);
        return { images: [placeholderBase + svgTemplate('#211D58', 1), placeholderBase + svgTemplate('#2d4a3e', 2), placeholderBase + svgTemplate('#4a2d4a', 3)] };
    }

    return {
        getConfig, saveConfig, getWebhookUrls, setWebhookUrl,
        addSourceFile, removeSourceFile, getSourceFiles, clearSourceFiles,
        generateTextOptions, generateImagesForSlide, getGeneratedImages,
        schedulePost, postNow, getGeneratedTextOptions, getTextOption,
        isGenerating, reset, createMockTextResponse, createMockImageResponse
    };
})();
