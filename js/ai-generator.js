/**
 * AI Generator Module
 * Handles webhook communication for AI-powered text generation
 */

const AIGeneratorModule = (function() {
    'use strict';

    // Configuration
    const CONFIG_KEY = 'gf_carousel_config';
    
    // State
    let state = {
        sourceFiles: [],
        generatedOptions: null,
        isGenerating: false
    };

    /**
     * Get stored configuration from localStorage
     * @returns {Object}
     */
    function getConfig() {
        try {
            const stored = localStorage.getItem(CONFIG_KEY);
            return stored ? JSON.parse(stored) : { webhookUrl: '' };
        } catch (e) {
            console.error('Error reading config:', e);
            return { webhookUrl: '' };
        }
    }

    /**
     * Save configuration to localStorage
     * @param {Object} config
     */
    function saveConfig(config) {
        try {
            localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
        } catch (e) {
            console.error('Error saving config:', e);
        }
    }

    /**
     * Get the webhook URL from configuration
     * @returns {string}
     */
    function getWebhookUrl() {
        return getConfig().webhookUrl || '';
    }

    /**
     * Set the webhook URL
     * @param {string} url
     */
    function setWebhookUrl(url) {
        const config = getConfig();
        config.webhookUrl = url;
        saveConfig(config);
    }

    /**
     * Add a source file to the list
     * @param {File} file
     * @returns {Promise<Object>}
     */
    async function addSourceFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const fileData = {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result // Base64 data URL
                };
                
                state.sourceFiles.push(fileData);
                resolve(fileData);
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    /**
     * Remove a source file by ID
     * @param {string} fileId
     */
    function removeSourceFile(fileId) {
        state.sourceFiles = state.sourceFiles.filter(f => f.id !== fileId);
    }

    /**
     * Get all source files
     * @returns {Array}
     */
    function getSourceFiles() {
        return [...state.sourceFiles];
    }

    /**
     * Clear all source files
     */
    function clearSourceFiles() {
        state.sourceFiles = [];
    }

    /**
     * Generate text options via webhook
     * @param {number} slideCount - Number of slides to generate text for
     * @returns {Promise<Object>}
     */
    async function generateTextOptions(slideCount) {
        const webhookUrl = getWebhookUrl();
        
        if (!webhookUrl) {
            throw new Error('Webhook URL not configured. Please set it in the configuration.');
        }
        
        if (state.sourceFiles.length === 0) {
            throw new Error('Please upload at least one source file (PDF or image).');
        }
        
        if (state.isGenerating) {
            throw new Error('Generation already in progress.');
        }
        
        state.isGenerating = true;
        
        try {
            // Prepare the payload
            const payload = {
                slideCount: slideCount,
                sources: state.sourceFiles.map(file => ({
                    name: file.name,
                    type: file.type,
                    data: file.data
                })),
                options: {
                    language: 'en',
                    tones: ['professional', 'engaging', 'concise']
                }
            };
            
            console.log('Sending request to webhook:', webhookUrl);
            console.log('Payload:', { ...payload, sources: `[${payload.sources.length} files]` });
            
            // Send request to webhook
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`Webhook returned status ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Validate response structure
            if (!result.options || !Array.isArray(result.options) || result.options.length !== 3) {
                throw new Error('Invalid response format from webhook. Expected 3 options.');
            }
            
            // Store the generated options
            state.generatedOptions = result.options;
            
            return result;
            
        } finally {
            state.isGenerating = false;
        }
    }

    /**
     * Get the generated options
     * @returns {Array|null}
     */
    function getGeneratedOptions() {
        return state.generatedOptions;
    }

    /**
     * Get a specific option by index
     * @param {number} index
     * @returns {Object|null}
     */
    function getOption(index) {
        if (!state.generatedOptions || index < 0 || index >= state.generatedOptions.length) {
            return null;
        }
        return state.generatedOptions[index];
    }

    /**
     * Check if generation is in progress
     * @returns {boolean}
     */
    function isGenerating() {
        return state.isGenerating;
    }

    /**
     * Reset the generator state
     */
    function reset() {
        state.sourceFiles = [];
        state.generatedOptions = null;
        state.isGenerating = false;
    }

    /**
     * Create mock response for testing (when webhook is not available)
     * @param {number} slideCount
     * @returns {Object}
     */
    function createMockResponse(slideCount) {
        const mockOptions = [
            {
                tone: 'professional',
                label: 'Professional',
                description: 'Formal and authoritative tone',
                slides: Array.from({ length: slideCount }, (_, i) => ({
                    slideNumber: i + 1,
                    text: `Professional slide ${i + 1}: This formal presentation highlights key developments in the industry with precision and clarity.`
                }))
            },
            {
                tone: 'engaging',
                label: 'Engaging',
                description: 'Dynamic and captivating tone',
                slides: Array.from({ length: slideCount }, (_, i) => ({
                    slideNumber: i + 1,
                    text: `🚀 Exciting news! Slide ${i + 1} brings you the latest breakthroughs that are reshaping our world!`
                }))
            },
            {
                tone: 'concise',
                label: 'Concise',
                description: 'Short and punchy tone',
                slides: Array.from({ length: slideCount }, (_, i) => ({
                    slideNumber: i + 1,
                    text: `Slide ${i + 1}: Key insight. Quick facts. Big impact.`
                }))
            }
        ];
        
        return { options: mockOptions };
    }

    // Public API
    return {
        getConfig,
        saveConfig,
        getWebhookUrl,
        setWebhookUrl,
        addSourceFile,
        removeSourceFile,
        getSourceFiles,
        clearSourceFiles,
        generateTextOptions,
        getGeneratedOptions,
        getOption,
        isGenerating,
        reset,
        createMockResponse
    };
})();
