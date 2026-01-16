/**
 * UI Module - Continuous scroll with sidebar navigation
 */
const UIModule = (function() {
    'use strict';
    let elements = {};
    let currentSlideData = [];
    let logoSettings = { enabled: false, image: null, position: 'bottom-left', size: 80 };

    function cacheElements() {
        elements = {
            sidebar: document.getElementById('sidebar'),
            sidebarOverlay: document.getElementById('sidebarOverlay'),
            menuToggle: document.getElementById('menuToggle'),
            mainContent: document.getElementById('mainContent'),
            navLinks: document.querySelectorAll('.nav-link'),
            openConfigBtn: document.getElementById('openConfigBtn'),
            mobileConfigBtn: document.getElementById('mobileConfigBtn'),
            configModal: document.getElementById('configModal'),
            configModalClose: document.getElementById('configModalClose'),
            configModalCancel: document.getElementById('configModalCancel'),
            configModalSave: document.getElementById('configModalSave'),
            webhookTextUrl: document.getElementById('webhookTextUrl'),
            webhookImageUrl: document.getElementById('webhookImageUrl'),
            webhookScheduleUrl: document.getElementById('webhookScheduleUrl'),
            slideCount: document.getElementById('slideCount'),
            slidesDecrease: document.getElementById('slidesDecrease'),
            slidesIncrease: document.getElementById('slidesIncrease'),
            fontFamily: document.getElementById('fontFamily'),
            fontSize: document.getElementById('fontSize'),
            fontSizeRange: document.getElementById('fontSizeRange'),
            textColor: document.getElementById('textColor'),
            textColorHex: document.getElementById('textColorHex'),
            textAlign: document.getElementById('textAlign'),
            backgroundColor: document.getElementById('backgroundColor'),
            backgroundColorHex: document.getElementById('backgroundColorHex'),
            logoEnabled: document.getElementById('logoEnabled'),
            logoSettingsContent: document.getElementById('logoSettingsContent'),
            logoUploadArea: document.getElementById('logoUploadArea'),
            logoFileInput: document.getElementById('logoFileInput'),
            logoPlaceholder: document.getElementById('logoPlaceholder'),
            logoPreview: document.getElementById('logoPreview'),
            logoPosition: document.getElementById('logoPosition'),
            logoSize: document.getElementById('logoSize'),
            logoSizeRange: document.getElementById('logoSizeRange'),
            aiUploadZone: document.getElementById('aiUploadZone'),
            sourceFileInput: document.getElementById('sourceFileInput'),
            uploadedFilesList: document.getElementById('uploadedFilesList'),
            generateTextBtn: document.getElementById('generateTextBtn'),
            aiStatusBar: document.getElementById('aiStatusBar'),
            aiStatusText: document.getElementById('aiStatusText'),
            aiTextResults: document.getElementById('aiTextResults'),
            slidesEditor: document.getElementById('slidesEditor'),
            carouselTrack: document.getElementById('carouselTrack'),
            carouselDots: document.getElementById('carouselDots'),
            carouselPrev: document.getElementById('carouselPrev'),
            carouselNext: document.getElementById('carouselNext'),
            generateCarouselBtn: document.getElementById('generateCarouselBtn'),
            downloadAllBtn: document.getElementById('downloadAllBtn'),
            individualDownloads: document.getElementById('individualDownloads'),
            postNowBtn: document.getElementById('postNowBtn'),
            schedulePostBtn: document.getElementById('schedulePostBtn'),
            scheduleModal: document.getElementById('scheduleModal'),
            scheduleModalClose: document.getElementById('scheduleModalClose'),
            scheduleModalCancel: document.getElementById('scheduleModalCancel'),
            scheduleModalConfirm: document.getElementById('scheduleModalConfirm'),
            scheduleDate: document.getElementById('scheduleDate'),
            scheduleTime: document.getElementById('scheduleTime'),
            scheduleCaption: document.getElementById('scheduleCaption'),
            aiImageModal: document.getElementById('aiImageModal'),
            aiImageModalClose: document.getElementById('aiImageModalClose'),
            aiImageModalCancel: document.getElementById('aiImageModalCancel'),
            aiImageModalConfirm: document.getElementById('aiImageModalConfirm'),
            aiImageSlideNumber: document.getElementById('aiImageSlideNumber'),
            aiImageGrid: document.getElementById('aiImageGrid'),
            toastContainer: document.getElementById('toastContainer')
        };
    }

    function init(callbacks) {
        cacheElements();
        setupNavigation();
        setupConfigModal();
        setupSettings();
        setupLogoSettings();
        setupAiSection(callbacks);
        setupSlides(callbacks);
        setupPreview(callbacks);
        setupModals(callbacks);
        loadConfig();
        renderSlideInputs();
    }

    function setupNavigation() {
        // Sidebar toggle
        elements.menuToggle?.addEventListener('click', () => {
            elements.sidebar.classList.add('open');
            elements.sidebarOverlay.classList.add('active');
        });
        elements.sidebarOverlay?.addEventListener('click', () => {
            elements.sidebar.classList.remove('open');
            elements.sidebarOverlay.classList.remove('active');
        });

        // Smooth scroll + active state
        elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').slice(1);
                const target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    elements.sidebar.classList.remove('open');
                    elements.sidebarOverlay.classList.remove('active');
                }
            });
        });

        // Update active nav on scroll
        const sections = document.querySelectorAll('.content-section');
        const observerOptions = { rootMargin: '-20% 0px -70% 0px' };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    elements.navLinks.forEach(link => {
                        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                    });
                }
            });
        }, observerOptions);
        sections.forEach(section => observer.observe(section));
    }

    function setupConfigModal() {
        const openModal = () => elements.configModal.classList.remove('hidden');
        const closeModal = () => elements.configModal.classList.add('hidden');
        
        elements.openConfigBtn?.addEventListener('click', openModal);
        elements.mobileConfigBtn?.addEventListener('click', openModal);
        elements.configModalClose?.addEventListener('click', closeModal);
        elements.configModalCancel?.addEventListener('click', closeModal);
        elements.configModal?.addEventListener('click', e => { if (e.target === elements.configModal) closeModal(); });
        
        elements.configModalSave?.addEventListener('click', () => {
            AIGeneratorModule.saveConfig({
                webhookTextUrl: elements.webhookTextUrl.value.trim(),
                webhookImageUrl: elements.webhookImageUrl.value.trim(),
                webhookScheduleUrl: elements.webhookScheduleUrl.value.trim()
            });
            closeModal();
            showToast('Configuration saved!', 'success');
        });
    }

    function loadConfig() {
        const config = AIGeneratorModule.getConfig();
        elements.webhookTextUrl.value = config.webhookTextUrl || '';
        elements.webhookImageUrl.value = config.webhookImageUrl || '';
        elements.webhookScheduleUrl.value = config.webhookScheduleUrl || '';
    }

    function setupSettings() {
        elements.slidesDecrease?.addEventListener('click', () => { if (parseInt(elements.slideCount.value) > 1) { elements.slideCount.value = parseInt(elements.slideCount.value) - 1; renderSlideInputs(); }});
        elements.slidesIncrease?.addEventListener('click', () => { if (parseInt(elements.slideCount.value) < 10) { elements.slideCount.value = parseInt(elements.slideCount.value) + 1; renderSlideInputs(); }});
        elements.slideCount?.addEventListener('change', renderSlideInputs);
        elements.fontSizeRange?.addEventListener('input', () => elements.fontSize.value = elements.fontSizeRange.value);
        elements.fontSize?.addEventListener('change', () => elements.fontSizeRange.value = elements.fontSize.value);
        elements.textColor?.addEventListener('input', () => elements.textColorHex.value = elements.textColor.value);
        elements.textColorHex?.addEventListener('change', () => { if (/^#[0-9A-Fa-f]{6}$/.test(elements.textColorHex.value)) elements.textColor.value = elements.textColorHex.value; });
        elements.backgroundColor?.addEventListener('input', () => elements.backgroundColorHex.value = elements.backgroundColor.value);
        elements.backgroundColorHex?.addEventListener('change', () => { if (/^#[0-9A-Fa-f]{6}$/.test(elements.backgroundColorHex.value)) elements.backgroundColor.value = elements.backgroundColorHex.value; });
        elements.textAlign?.querySelectorAll('.btn-icon').forEach(btn => {
            btn.addEventListener('click', () => { elements.textAlign.querySelectorAll('.btn-icon').forEach(b => b.classList.remove('active')); btn.classList.add('active'); });
        });
    }

    function setupLogoSettings() {
        elements.logoEnabled?.addEventListener('change', () => {
            logoSettings.enabled = elements.logoEnabled.checked;
            elements.logoSettingsContent.classList.toggle('hidden', !logoSettings.enabled);
        });

        elements.logoFileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    logoSettings.image = ev.target.result;
                    elements.logoPreview.src = ev.target.result;
                    elements.logoPreview.classList.remove('hidden');
                    elements.logoPlaceholder.classList.add('hidden');
                };
                reader.readAsDataURL(file);
            }
        });

        elements.logoPosition?.querySelectorAll('.position-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                elements.logoPosition.querySelectorAll('.position-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                logoSettings.position = btn.dataset.position;
            });
        });

        elements.logoSizeRange?.addEventListener('input', () => {
            elements.logoSize.value = elements.logoSizeRange.value;
            logoSettings.size = parseInt(elements.logoSizeRange.value);
        });
        elements.logoSize?.addEventListener('change', () => {
            elements.logoSizeRange.value = elements.logoSize.value;
            logoSettings.size = parseInt(elements.logoSize.value);
        });
    }

    function setupAiSection(callbacks) {
        ['dragover', 'dragenter'].forEach(e => elements.aiUploadZone?.addEventListener(e, ev => { ev.preventDefault(); elements.aiUploadZone.classList.add('drag-over'); }));
        ['dragleave', 'drop'].forEach(e => elements.aiUploadZone?.addEventListener(e, () => elements.aiUploadZone.classList.remove('drag-over')));
        elements.aiUploadZone?.addEventListener('drop', async e => { e.preventDefault(); for (const f of e.dataTransfer.files) if (isValidFile(f)) await callbacks.onSourceFileAdded(f); });
        elements.sourceFileInput?.addEventListener('change', async e => { for (const f of e.target.files) if (isValidFile(f)) await callbacks.onSourceFileAdded(f); e.target.value = ''; });
        elements.uploadedFilesList?.addEventListener('click', e => { const btn = e.target.closest('.remove-file'); if (btn) callbacks.onSourceFileRemoved(btn.dataset.fileId); });
        elements.generateTextBtn?.addEventListener('click', () => callbacks.onGenerateText());
        elements.aiTextResults?.addEventListener('click', e => { const btn = e.target.closest('[data-use-option]'); if (btn) callbacks.onUseTextOption(parseInt(btn.dataset.useOption)); });
    }

    function isValidFile(file) { return ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.type.startsWith('image/'); }

    function renderUploadedFiles(files) {
        elements.uploadedFilesList.innerHTML = files.map(f => `<div class="uploaded-file-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${f.type === 'application/pdf' ? '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>' : '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'}</svg><span class="file-name">${f.name}</span><button class="remove-file" data-file-id="${f.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`).join('');
    }

    function setAiStatus(msg, loading = false) { elements.aiStatusText.textContent = msg; elements.aiStatusBar.classList.toggle('loading', loading); }

    function renderTextOptions(options) {
        elements.aiTextResults.classList.remove('hidden');
        options.forEach((opt, i) => {
            const el = document.getElementById(`textOptionPreview${i}`);
            if (el) el.innerHTML = opt.slides.map(s => `<div class="slide-preview-item"><span class="slide-label">Slide ${s.slideNumber}</span><p>${s.text}</p></div>`).join('');
        });
    }

    function hideTextOptions() { elements.aiTextResults.classList.add('hidden'); }

    function setupSlides(callbacks) {
        elements.slidesEditor?.addEventListener('click', e => {
            const bgBtn = e.target.closest('.bg-type-btn');
            if (bgBtn) {
                const card = bgBtn.closest('.slide-card'), idx = parseInt(card.dataset.slideIndex), type = bgBtn.dataset.bgType;
                card.querySelectorAll('.bg-type-btn').forEach(b => b.classList.remove('active')); bgBtn.classList.add('active');
                card.querySelectorAll('.bg-option').forEach(o => o.classList.toggle('active', o.dataset.bgType === type));
                currentSlideData[idx].backgroundType = type;
            }
            const aiBtn = e.target.closest('.ai-image-btn');
            if (aiBtn) callbacks.onGenerateAiImage(parseInt(aiBtn.dataset.slideIndex));
            const rmBtn = e.target.closest('.remove-image');
            if (rmBtn) { currentSlideData[parseInt(rmBtn.dataset.slideIndex)].backgroundImage = null; renderSlideInputs(); }
        });
        elements.slidesEditor?.addEventListener('input', e => { if (e.target.classList.contains('slide-text-input')) currentSlideData[parseInt(e.target.dataset.slideIndex)].text = e.target.value; });
        elements.slidesEditor?.addEventListener('change', e => {
            const idx = parseInt(e.target.dataset.slideIndex);
            if (e.target.classList.contains('slide-bg-color')) { currentSlideData[idx].backgroundColor = e.target.value; const hex = e.target.parentElement.querySelector('.slide-bg-color-hex'); if (hex) hex.value = e.target.value; }
            if (e.target.classList.contains('slide-bg-color-hex') && /^#[0-9A-Fa-f]{6}$/.test(e.target.value)) { currentSlideData[idx].backgroundColor = e.target.value; const col = e.target.parentElement.querySelector('.slide-bg-color'); if (col) col.value = e.target.value; }
            if (e.target.classList.contains('slide-image-input') && e.target.files[0]) { const reader = new FileReader(); reader.onload = ev => { currentSlideData[idx].backgroundImage = ev.target.result; renderSlideInputs(); }; reader.readAsDataURL(e.target.files[0]); }
        });
    }

    function renderSlideInputs() {
        const count = parseInt(elements.slideCount.value) || 3, defBg = elements.backgroundColor.value || '#211D58';
        while (currentSlideData.length < count) currentSlideData.push({ text: '', backgroundType: 'color', backgroundColor: defBg, backgroundImage: null });
        while (currentSlideData.length > count) currentSlideData.pop();
        elements.slidesEditor.innerHTML = currentSlideData.map((s, i) => `<div class="slide-card" data-slide-index="${i}"><div class="slide-card-header"><h3>Slide ${i+1}</h3><span class="slide-dimensions">1080 × 1350</span></div><div class="slide-card-body"><div class="slide-form-group"><label>Text Content</label><textarea class="slide-text-input" data-slide-index="${i}" placeholder="Enter slide text...">${s.text}</textarea></div><div class="slide-form-group"><label>Background</label><div class="background-type-toggle"><button type="button" class="bg-type-btn ${s.backgroundType==='color'?'active':''}" data-bg-type="color">Color</button><button type="button" class="bg-type-btn ${s.backgroundType==='image'?'active':''}" data-bg-type="image">Image</button></div><div class="background-options"><div class="bg-option ${s.backgroundType==='color'?'active':''}" data-bg-type="color"><div class="bg-color-picker"><input type="color" class="slide-bg-color" data-slide-index="${i}" value="${s.backgroundColor}"><input type="text" class="slide-bg-color-hex" data-slide-index="${i}" value="${s.backgroundColor}" maxlength="7"></div></div><div class="bg-option ${s.backgroundType==='image'?'active':''}" data-bg-type="image">${s.backgroundImage?`<div class="image-preview-container"><img src="${s.backgroundImage}" alt="Slide ${i+1}"><button type="button" class="remove-image" data-slide-index="${i}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`:`<div class="image-upload-area"><div class="upload-text"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span>Upload image</span></div><input type="file" class="slide-image-input" data-slide-index="${i}" accept="image/*"></div>`}<button type="button" class="ai-image-btn" data-slide-index="${i}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>Generate with AI</button></div></div></div></div></div>`).join('');
    }

    function applyTextToSlides(option) { option.slides.forEach((s, i) => { if (currentSlideData[i]) currentSlideData[i].text = s.text; }); renderSlideInputs(); document.getElementById('slides')?.scrollIntoView({ behavior: 'smooth' }); showToast('Text applied!', 'success'); }
    function setSlideImage(idx, img) { if (currentSlideData[idx]) { currentSlideData[idx].backgroundImage = img; currentSlideData[idx].backgroundType = 'image'; renderSlideInputs(); }}

    function setupPreview(callbacks) {
        elements.generateCarouselBtn?.addEventListener('click', () => callbacks.onGenerateCarousel());
        elements.downloadAllBtn?.addEventListener('click', () => callbacks.onDownloadAll());
        elements.postNowBtn?.addEventListener('click', () => callbacks.onPostNow());
        elements.schedulePostBtn?.addEventListener('click', () => callbacks.onSchedulePost());
        elements.carouselPrev?.addEventListener('click', () => callbacks.onCarouselPrev());
        elements.carouselNext?.addEventListener('click', () => callbacks.onCarouselNext());
        elements.carouselDots?.addEventListener('click', e => { if (e.target.classList.contains('carousel-dot')) callbacks.onCarouselDotClick(parseInt(e.target.dataset.index)); });
        elements.individualDownloads?.addEventListener('click', e => { const btn = e.target.closest('.download-slide-btn'); if (btn) callbacks.onDownloadSingle(parseInt(btn.dataset.index)); });
    }

    function renderCarouselSlides(images) { elements.carouselTrack.innerHTML = images.length ? images.map((img, i) => `<div class="carousel-slide" data-index="${i}"><img src="${img}" alt="Slide ${i+1}"></div>`).join('') : '<div class="carousel-slide"><div class="empty-slide"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg><span>Generate to preview</span></div></div>'; }
    function renderCarouselDots(count, active = 0) { elements.carouselDots.innerHTML = Array.from({length: count}, (_, i) => `<button class="carousel-dot ${i===active?'active':''}" data-index="${i}"></button>`).join(''); }
    function updateCarouselDots(active) { elements.carouselDots.querySelectorAll('.carousel-dot').forEach((d, i) => d.classList.toggle('active', i === active)); }
    function renderDownloadButtons(images) { elements.individualDownloads.innerHTML = images.map((_, i) => `<button class="download-slide-btn" data-index="${i}">Slide ${i+1}</button>`).join(''); }

    function setupModals(callbacks) {
        // Schedule Modal
        elements.scheduleModalClose?.addEventListener('click', hideScheduleModal);
        elements.scheduleModalCancel?.addEventListener('click', hideScheduleModal);
        elements.scheduleModalConfirm?.addEventListener('click', () => { const d = elements.scheduleDate.value, t = elements.scheduleTime.value; if (!d || !t) { showToast('Select date and time', 'error'); return; } callbacks.onConfirmSchedule({ scheduledTime: `${d}T${t}:00`, caption: elements.scheduleCaption.value }); hideScheduleModal(); });
        elements.scheduleModal?.addEventListener('click', e => { if (e.target === elements.scheduleModal) hideScheduleModal(); });

        // AI Image Modal
        elements.aiImageModalClose?.addEventListener('click', hideAiImageModal);
        elements.aiImageModalCancel?.addEventListener('click', hideAiImageModal);
        elements.aiImageGrid?.addEventListener('click', e => { const opt = e.target.closest('.ai-image-option'); if (opt && opt.querySelector('img')) { elements.aiImageGrid.querySelectorAll('.ai-image-option').forEach(o => o.classList.remove('selected')); opt.classList.add('selected'); elements.aiImageModalConfirm.disabled = false; }});
        elements.aiImageModalConfirm?.addEventListener('click', () => { const sel = elements.aiImageGrid.querySelector('.ai-image-option.selected img'); if (sel) callbacks.onSelectAiImage(sel.src); hideAiImageModal(); });
        elements.aiImageModal?.addEventListener('click', e => { if (e.target === elements.aiImageModal) hideAiImageModal(); });
    }

    function showScheduleModal() { const now = new Date(); elements.scheduleDate.value = now.toISOString().split('T')[0]; elements.scheduleTime.value = now.toTimeString().slice(0,5); elements.scheduleCaption.value = ''; elements.scheduleModal.classList.remove('hidden'); }
    function hideScheduleModal() { elements.scheduleModal.classList.add('hidden'); }
    function showAiImageModal(idx) { elements.aiImageSlideNumber.textContent = `Slide ${idx+1}`; elements.aiImageGrid.querySelectorAll('.ai-image-option').forEach(o => { o.classList.remove('selected'); o.innerHTML = '<div class="image-placeholder"><div class="spinner"></div></div>'; }); elements.aiImageModalConfirm.disabled = true; elements.aiImageModal.classList.remove('hidden'); elements.aiImageModal.dataset.slideIndex = idx; }
    function hideAiImageModal() { elements.aiImageModal.classList.add('hidden'); }
    function setAiImageOptions(images) { elements.aiImageGrid.querySelectorAll('.ai-image-option').forEach((o, i) => { if (images[i]) o.innerHTML = `<img src="${images[i]}" alt="Option ${i+1}">`; }); }
    function showToast(msg, type = 'info') { const t = document.createElement('div'); t.className = `toast ${type}`; t.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${type==='success'?'<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>':type==='error'?'<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>':'<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'}</svg><span>${msg}</span>`; elements.toastContainer.appendChild(t); setTimeout(() => t.remove(), 4000); }
    function setButtonLoading(btn, loading) { btn?.classList.toggle('loading', loading); if(btn) btn.disabled = loading; }
    function getGlobalSettings() { let align = 'center'; elements.textAlign?.querySelectorAll('.btn-icon').forEach(b => { if (b.classList.contains('active')) align = b.dataset.align; }); return { slideCount: parseInt(elements.slideCount?.value)||3, fontFamily: elements.fontFamily?.value||'Montserrat', fontSize: parseInt(elements.fontSize?.value)||64, textColor: elements.textColor?.value||'#ffffff', textAlign: align, backgroundColor: elements.backgroundColor?.value||'#211D58' }; }
    function getSlidesData() { return currentSlideData.map((s, i) => ({ index: i, text: s.text, backgroundType: s.backgroundType, backgroundColor: s.backgroundColor, backgroundImage: s.backgroundImage })); }
    function getLogoSettings() { return { ...logoSettings }; }

    return { init, renderUploadedFiles, setAiStatus, renderTextOptions, hideTextOptions, applyTextToSlides, renderSlideInputs, setSlideImage, renderCarouselSlides, renderCarouselDots, updateCarouselDots, renderDownloadButtons, showScheduleModal, hideScheduleModal, showAiImageModal, hideAiImageModal, setAiImageOptions, showToast, setButtonLoading, getGlobalSettings, getSlidesData, getLogoSettings, get currentSlideIndex() { return elements.aiImageModal?.dataset.slideIndex; } };
})();
