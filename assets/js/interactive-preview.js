        // 🎯 INTERACTIVE PREVIEW CLASS - Quản lý tương tác với ảnh trên canvas
        class InteractivePreview {
            constructor(app) {
                this.app = app;
                this.printData = app.printData;
                this.enabled = false;
                this.contextMenu = null;

                console.log('🎨 InteractivePreview initialized');
            }

            // Khởi tạo interactive mode
            init() {
                if (this.enabled) return;

                this.createContextMenu();
                this.setupCanvasInteraction();
                this.setupKeyboardShortcuts();
                this.showInteractiveHint();

                // Enable pointer events on overlay
                const overlay = document.getElementById('canvasOverlay');
                if (overlay) {
                    overlay.style.pointerEvents = 'auto';
                }

                this.enabled = true;

                console.log('✅ Interactive Preview enabled');
            }

            // Tắt interactive mode
            destroy() {
                this.enabled = false;
                this.hideContextMenu();
                this.hideInteractiveHint();

                // Disable pointer events on overlay
                const overlay = document.getElementById('canvasOverlay');
                if (overlay) {
                    overlay.style.pointerEvents = 'none';
                    overlay.style.cursor = 'default';
                }

                // Clear selection highlights
                this.printData.selectedImageIndex = null;
                this.printData.hoveredImageIndex = null;
                this.printData.multiSelectedIndices = [];
                this.updatePreviewWithSelection();

                // Remove event listeners would go here
                console.log('🔴 Interactive Preview disabled');
            }

            // Hiển thị hint badge
            showInteractiveHint() {
                // Xóa hint cũ nếu có
                this.hideInteractiveHint();

                const hint = document.createElement('div');
                hint.id = 'interactiveHint';
                hint.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                    z-index: 9999;
                    font-family: system-ui, -apple-system, sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    animation: slideInUp 0.3s ease-out;
                    cursor: pointer;
                    transition: all 0.2s;
                `;

                hint.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 18px;">🎯</span>
                        <span>Interactive Mode: Click ảnh để tương tác</span>
                    </div>
                `;

                hint.addEventListener('mouseenter', () => {
                    hint.style.transform = 'translateY(-2px)';
                    hint.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                });

                hint.addEventListener('mouseleave', () => {
                    hint.style.transform = 'translateY(0)';
                    hint.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                });

                hint.addEventListener('click', () => {
                    hint.remove();
                });

                // Add animation
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes slideInUp {
                        from {
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `;
                if (!document.getElementById('interactiveHintStyles')) {
                    style.id = 'interactiveHintStyles';
                    document.head.appendChild(style);
                }

                document.body.appendChild(hint);

                // Auto hide sau 5 giây
                setTimeout(() => {
                    if (hint.parentNode) {
                        hint.style.opacity = '0';
                        hint.style.transform = 'translateY(20px)';
                        setTimeout(() => hint.remove(), 300);
                    }
                }, 5000);
            }

            hideInteractiveHint() {
                const hint = document.getElementById('interactiveHint');
                if (hint) {
                    hint.remove();
                }
            }

            // Setup canvas interaction
            setupCanvasInteraction() {
                const overlay = document.getElementById('canvasOverlay');
                const canvas = document.getElementById('printCanvas');

                if (!overlay || !canvas) {
                    console.warn('⚠️ Canvas overlay or canvas not found');
                    return;
                }

                // Mouse move - detect hover
                overlay.addEventListener('mousemove', (e) => {
                    if (!this.enabled) return;

                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    const imageIndex = this.getImageAtPosition(x, y);

                    if (imageIndex !== this.printData.hoveredImageIndex) {
                        this.printData.hoveredImageIndex = imageIndex;
                        this.updatePreviewWithSelection();

                        // Change cursor
                        if (imageIndex !== null) {
                            overlay.style.cursor = 'pointer';
                        } else {
                            overlay.style.cursor = 'default';
                        }
                    }
                });

                // Click - select image
                overlay.addEventListener('click', (e) => {
                    if (!this.enabled) return;

                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    const imageIndex = this.getImageAtPosition(x, y);

                    if (e.ctrlKey || e.metaKey) {
                        // Multi-select
                        this.handleMultiSelect(imageIndex);
                    } else {
                        // Single select
                        this.printData.selectedImageIndex = imageIndex;
                        this.printData.multiSelectedIndices = [];
                        this.updatePreviewWithSelection();

                        if (imageIndex !== null) {
                            console.log('🎯 Selected image:', imageIndex);
                        }
                    }
                });

                // Right click - context menu
                overlay.addEventListener('contextmenu', (e) => {
                    if (!this.enabled) return;
                    e.preventDefault();

                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    const imageIndex = this.getImageAtPosition(x, y);

                    if (imageIndex !== null) {
                        this.printData.selectedImageIndex = imageIndex;
                        this.updatePreviewWithSelection();
                        this.showContextMenu(e.clientX, e.clientY, { index: imageIndex });
                    }
                });

                // Mouse leave - clear hover
                overlay.addEventListener('mouseleave', () => {
                    if (this.printData.hoveredImageIndex !== null) {
                        this.printData.hoveredImageIndex = null;
                        this.updatePreviewWithSelection();
                        overlay.style.cursor = 'default';
                    }
                });

                console.log('✅ Canvas interaction setup complete');
            }

            // Tìm ảnh tại vị trí x, y
            getImageAtPosition(x, y) {
                if (!this.printData.imagePositions || this.printData.imagePositions.length === 0) {
                    return null;
                }

                // Tính scale chính xác từ master canvas và preview canvas
                const masterCanvas = this.printData.masterCanvas;
                const previewCanvas = document.getElementById('printCanvas');

                if (!masterCanvas || !previewCanvas) {
                    console.warn('⚠️ Canvas not found for scale calculation');
                    return null;
                }

                const scale = previewCanvas.width / masterCanvas.width;

                // Duyệt ngược để ưu tiên ảnh trên cùng
                for (let i = this.printData.imagePositions.length - 1; i >= 0; i--) {
                    const pos = this.printData.imagePositions[i];
                    if (!pos) continue;

                    const scaledX = pos.x * scale;
                    const scaledY = pos.y * scale;
                    const scaledWidth = pos.width * scale;
                    const scaledHeight = pos.height * scale;

                    if (x >= scaledX && x <= scaledX + scaledWidth &&
                        y >= scaledY && y <= scaledY + scaledHeight) {
                        return i;
                    }
                }

                return null;
            }

            // 🎯 CONTEXT MENU
            createContextMenu() {
                const oldMenu = document.getElementById('interactiveContextMenu');
                if (oldMenu) oldMenu.remove();

                const menu = document.createElement('div');
                menu.id = 'interactiveContextMenu';
                menu.className = 'interactive-context-menu';
                menu.style.cssText = `
                    position: fixed;
                    display: none;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10000;
                    min-width: 200px;
                    padding: 8px 0;
                    font-family: system-ui, -apple-system, sans-serif;
                `;

                menu.innerHTML = `
                    <div class="menu-item" data-action="rotate-right">
                        <span class="menu-icon">🔄</span>
                        <span class="menu-text">Xoay phải</span>
                        <span class="menu-shortcut">R</span>
                    </div>
                    <div class="menu-item" data-action="rotate-left">
                        <span class="menu-icon">🔄</span>
                        <span class="menu-text">Xoay trái</span>
                    </div>
                    <div class="menu-divider"></div>
                    <div class="menu-item" data-action="flip-vertical">
                        <span class="menu-icon">↕️</span>
                        <span class="menu-text">Lật dọc</span>
                        <span class="menu-shortcut">V</span>
                    </div>
                    <div class="menu-item" data-action="flip-horizontal">
                        <span class="menu-icon">↔️</span>
                        <span class="menu-text">Lật ngang</span>
                        <span class="menu-shortcut">H</span>
                    </div>
                    <div class="menu-divider"></div>
                    <div class="menu-item" data-action="swap">
                        <span class="menu-icon">🔀</span>
                        <span class="menu-text">Đổi chỗ ảnh</span>
                    </div>
                    <div class="menu-item" data-action="replace">
                        <span class="menu-icon">🖼️</span>
                        <span class="menu-text">Thay ảnh</span>
                    </div>
                    <div class="menu-divider"></div>
                    <div class="menu-item" data-action="delete">
                        <span class="menu-icon">🗑️</span>
                        <span class="menu-text">Xóa ảnh</span>
                        <span class="menu-shortcut">Del</span>
                    </div>
                `;

                // Add styles
                const style = document.createElement('style');
                style.textContent = `
                    .interactive-context-menu .menu-item {
                        display: flex;
                        align-items: center;
                        padding: 10px 16px;
                        cursor: pointer;
                        transition: background 0.15s;
                        font-size: 14px;
                    }
                    .interactive-context-menu .menu-item:hover {
                        background: #f3f4f6;
                    }
                    .interactive-context-menu .menu-icon {
                        width: 24px;
                        margin-right: 12px;
                        font-size: 16px;
                    }
                    .interactive-context-menu .menu-text {
                        flex: 1;
                        color: #374151;
                    }
                    .interactive-context-menu .menu-shortcut {
                        font-size: 12px;
                        color: #9ca3af;
                        background: #f3f4f6;
                        padding: 2px 6px;
                        border-radius: 4px;
                    }
                    .interactive-context-menu .menu-divider {
                        height: 1px;
                        background: #e5e7eb;
                        margin: 4px 0;
                    }
                `;

                if (!document.getElementById('interactiveMenuStyles')) {
                    style.id = 'interactiveMenuStyles';
                    document.head.appendChild(style);
                }

                // Event listeners cho menu items
                menu.querySelectorAll('.menu-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const action = item.dataset.action;
                        this.executeAction(action);
                        this.hideContextMenu();
                    });
                });

                // Click outside để đóng
                document.addEventListener('click', (e) => {
                    if (!menu.contains(e.target)) {
                        this.hideContextMenu();
                    }
                });

                document.body.appendChild(menu);
                this.contextMenu = menu;
                console.log('✅ Context Menu created');
            }

            showContextMenu(x, y, imageInfo) {
                const menu = document.getElementById('interactiveContextMenu');
                if (!menu) return;

                menu.style.display = 'block';
                menu.style.left = x + 'px';
                menu.style.top = y + 'px';

                // Điều chỉnh nếu menu ra ngoài màn hình
                setTimeout(() => {
                    const rect = menu.getBoundingClientRect();
                    if (rect.right > window.innerWidth) {
                        menu.style.left = (x - rect.width) + 'px';
                    }
                    if (rect.bottom > window.innerHeight) {
                        menu.style.top = (y - rect.height) + 'px';
                    }
                }, 0);
            }

            hideContextMenu() {
                const menu = document.getElementById('interactiveContextMenu');
                if (menu) {
                    menu.style.display = 'none';
                }
            }

            // 🎯 ACTIONS
            executeAction(action) {
                if (this.printData.selectedImageIndex === null) {
                    console.warn('⚠️ No image selected');
                    return;
                }

                const imageIndex = this.printData.selectedImageIndex;
                const imageData = this.printData.selectedImages[imageIndex];

                if (!imageData) {
                    console.error('❌ Image data not found');
                    return;
                }

                console.log('⚡ Executing action:', action, 'on image:', imageIndex);

                switch (action) {
                    case 'rotate-right':
                        this.rotateImage(imageIndex, 90);
                        break;
                    case 'rotate-left':
                        this.rotateImage(imageIndex, -90);
                        break;
                    case 'flip-vertical':
                        this.flipImage(imageIndex, 'vertical');
                        break;
                    case 'flip-horizontal':
                        this.flipImage(imageIndex, 'horizontal');
                        break;
                    case 'swap':
                        this.startSwapMode(imageIndex);
                        break;
                    case 'replace':
                        this.openImageReplacer(imageIndex);
                        break;
                    case 'delete':
                        this.deleteImage(imageIndex);
                        break;
                    default:
                        console.warn('⚠️ Unknown action:', action);
                }
            }

            rotateImage(imageIndex, degrees) {
                const imageData = this.printData.selectedImages[imageIndex];
                if (!imageData) return;

                if (!imageData.rotation) imageData.rotation = 0;
                imageData.rotation = (imageData.rotation + degrees) % 360;

                console.log('🔄 Rotated image', imageIndex, 'by', degrees, '°. New rotation:', imageData.rotation, '°');

                this.app.updatePreview();
                this.app.showToast(`Đã xoay ảnh ${degrees > 0 ? 'phải' : 'trái'}`, 'success');
            }

            flipImage(imageIndex, direction) {
                const imageData = this.printData.selectedImages[imageIndex];
                if (!imageData) return;

                if (!imageData.flip) {
                    imageData.flip = { horizontal: false, vertical: false };
                }

                if (direction === 'horizontal') {
                    imageData.flip.horizontal = !imageData.flip.horizontal;
                    console.log('↔️ Flipped image', imageIndex, 'horizontally');
                    this.app.showToast('Đã lật ảnh ngang', 'success');
                } else if (direction === 'vertical') {
                    imageData.flip.vertical = !imageData.flip.vertical;
                    console.log('↕️ Flipped image', imageIndex, 'vertically');
                    this.app.showToast('Đã lật ảnh dọc', 'success');
                }

                this.app.updatePreview();
            }

            deleteImage(imageIndex) {
                if (!confirm('Bạn có chắc muốn xóa ảnh này?')) return;

                this.printData.selectedImages.splice(imageIndex, 1);
                this.printData.selectedImageIndex = null;

                console.log('🗑️ Deleted image at index', imageIndex);
                this.app.showToast('Đã xóa ảnh', 'success');

                this.app.calculateLayout();
            }

            startSwapMode(imageIndex) {
                this.app.showToast('Click vào ảnh khác để đổi chỗ', 'info');
                this.printData.swapSourceIndex = imageIndex;

                // Thêm listener tạm thời cho việc chọn ảnh thứ 2
                const overlay = document.getElementById('canvasOverlay');
                const swapListener = (e) => {
                    const rect = document.getElementById('printCanvas').getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const targetIndex = this.getImageAtPosition(x, y);

                    if (targetIndex !== null && targetIndex !== imageIndex) {
                        this.swapImages(imageIndex, targetIndex);
                        overlay.removeEventListener('click', swapListener);
                        delete this.printData.swapSourceIndex;
                    }
                };

                overlay.addEventListener('click', swapListener);
            }

            swapImages(index1, index2) {
                const temp = this.printData.selectedImages[index1];
                this.printData.selectedImages[index1] = this.printData.selectedImages[index2];
                this.printData.selectedImages[index2] = temp;

                console.log('🔄 Swapped images:', index1, '↔️', index2);
                this.app.showToast('Đã đổi vị trí ảnh', 'success');

                this.app.updatePreview();
            }

            openImageReplacer(imageIndex) {
                console.log('🔄 Opening Image Replacer for image:', imageIndex);

                const modal = document.createElement('div');
                modal.id = 'imageReplacerModal';
                modal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    z-index: 10001;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                `;

                modal.innerHTML = `
                    <div style="background: white; border-radius: 12px; padding: 24px; max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto;">
                        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Chọn ảnh thay thế</h3>
                        <div id="replacerImageGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; margin-bottom: 16px;">
                        </div>
                        <button id="closeReplacer" style="
                            width: 100%;
                            padding: 12px;
                            background: #6b7280;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                        ">Hủy</button>
                    </div>
                `;

                document.body.appendChild(modal);

                // Populate với ảnh từ gallery
                const grid = document.getElementById('replacerImageGrid');
                this.app.images.forEach((img, idx) => {
                    const imgContainer = document.createElement('div');
                    imgContainer.style.cssText = `
                        cursor: pointer;
                        border: 2px solid transparent;
                        border-radius: 6px;
                        overflow: hidden;
                        transition: all 0.2s;
                    `;
                    imgContainer.innerHTML = `
                        <img src="${img.thumbnail || img.src}" style="width: 100%; height: 100px; object-fit: cover; display: block;">
                    `;

                    imgContainer.addEventListener('mouseenter', () => {
                        imgContainer.style.borderColor = '#3b82f6';
                        imgContainer.style.transform = 'scale(1.05)';
                    });
                    imgContainer.addEventListener('mouseleave', () => {
                        imgContainer.style.borderColor = 'transparent';
                        imgContainer.style.transform = 'scale(1)';
                    });

                    imgContainer.addEventListener('click', () => {
                        this.printData.selectedImages[imageIndex] = {
                            ...this.app.images[idx],
                            id: this.printData.selectedImages[imageIndex].id
                        };
                        this.app.updatePreview();
                        this.app.showToast('Đã thay ảnh', 'success');
                        modal.remove();
                    });

                    grid.appendChild(imgContainer);
                });

                document.getElementById('closeReplacer').addEventListener('click', () => {
                    modal.remove();
                });

                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                    }
                });
            }

            handleMultiSelect(imageIndex) {
                if (!this.printData.multiSelectedIndices) {
                    this.printData.multiSelectedIndices = [];
                }

                const idx = this.printData.multiSelectedIndices.indexOf(imageIndex);
                if (idx > -1) {
                    this.printData.multiSelectedIndices.splice(idx, 1);
                } else {
                    this.printData.multiSelectedIndices.push(imageIndex);
                }

                console.log('🎯 Multi-selected images:', this.printData.multiSelectedIndices);
                this.updatePreviewWithSelection();
            }

            updatePreviewWithSelection() {
                const overlay = document.getElementById('canvasOverlay');
                if (!overlay || !this.printData.imagePositions) return;

                // Xóa highlights cũ (chỉ xóa highlights, giữ lại các elements khác như grid)
                const oldHighlights = overlay.querySelectorAll('.image-highlight');
                oldHighlights.forEach(h => h.remove());

                // Tính scale chính xác từ master canvas và preview canvas
                const masterCanvas = this.printData.masterCanvas;
                const previewCanvas = document.getElementById('printCanvas');

                if (!masterCanvas || !previewCanvas) {
                    console.warn('⚠️ Canvas not found for updatePreviewWithSelection');
                    return;
                }

                const scale = previewCanvas.width / masterCanvas.width;

                // Vẽ selected image highlight
                if (this.printData.selectedImageIndex !== null && this.printData.imagePositions[this.printData.selectedImageIndex]) {
                    const pos = this.printData.imagePositions[this.printData.selectedImageIndex];
                    const highlight = document.createElement('div');
                    highlight.className = 'image-highlight selected';
                    highlight.style.cssText = `
                        position: absolute;
                        left: ${pos.x * scale}px;
                        top: ${pos.y * scale}px;
                        width: ${pos.width * scale}px;
                        height: ${pos.height * scale}px;
                        border: 3px solid #3b82f6;
                        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3), inset 0 0 0 2000px rgba(59, 130, 246, 0.05);
                        pointer-events: none;
                        z-index: 10;
                        transition: all 0.15s ease;
                        border-radius: 2px;
                    `;
                    overlay.appendChild(highlight);
                }

                // Vẽ hovered image highlight
                if (this.printData.hoveredImageIndex !== null &&
                    this.printData.hoveredImageIndex !== this.printData.selectedImageIndex &&
                    this.printData.imagePositions[this.printData.hoveredImageIndex]) {
                    const pos = this.printData.imagePositions[this.printData.hoveredImageIndex];
                    const highlight = document.createElement('div');
                    highlight.className = 'image-highlight hovered';
                    highlight.style.cssText = `
                        position: absolute;
                        left: ${pos.x * scale}px;
                        top: ${pos.y * scale}px;
                        width: ${pos.width * scale}px;
                        height: ${pos.height * scale}px;
                        border: 2px solid #10b981;
                        box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.2), inset 0 0 0 2000px rgba(16, 185, 129, 0.03);
                        pointer-events: none;
                        z-index: 9;
                        transition: all 0.15s ease;
                        border-radius: 2px;
                    `;
                    overlay.appendChild(highlight);
                }

                // Vẽ multi-selected highlights
                if (this.printData.multiSelectedIndices && this.printData.multiSelectedIndices.length > 0) {
                    this.printData.multiSelectedIndices.forEach(idx => {
                        if (this.printData.imagePositions[idx] && idx !== this.printData.selectedImageIndex) {
                            const pos = this.printData.imagePositions[idx];
                            const highlight = document.createElement('div');
                            highlight.className = 'image-highlight multi-selected';
                            highlight.style.cssText = `
                                position: absolute;
                                left: ${pos.x * scale}px;
                                top: ${pos.y * scale}px;
                                width: ${pos.width * scale}px;
                                height: ${pos.height * scale}px;
                                border: 2px solid #f59e0b;
                                box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.2), inset 0 0 0 2000px rgba(245, 158, 11, 0.03);
                                pointer-events: none;
                                z-index: 8;
                                transition: all 0.15s ease;
                                border-radius: 2px;
                            `;
                            overlay.appendChild(highlight);
                        }
                    });
                }
            }

            // ⌨️ KEYBOARD SHORTCUTS
            setupKeyboardShortcuts() {
                document.addEventListener('keydown', (e) => {
                    if (!this.enabled || this.printData.selectedImageIndex === null) return;

                    // Bỏ qua nếu đang gõ trong input
                    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

                    switch (e.key.toLowerCase()) {
                        case 'r':
                            this.rotateImage(this.printData.selectedImageIndex, 90);
                            break;
                        case 'v':
                            this.flipImage(this.printData.selectedImageIndex, 'vertical');
                            break;
                        case 'h':
                            this.flipImage(this.printData.selectedImageIndex, 'horizontal');
                            break;
                        case 'delete':
                        case 'backspace':
                            e.preventDefault();
                            this.deleteImage(this.printData.selectedImageIndex);
                            break;
                        case 'escape':
                            this.printData.selectedImageIndex = null;
                            this.hideContextMenu();
                            this.updatePreviewWithSelection();
                            break;
                    }
                });

                console.log('⌨️ Keyboard shortcuts initialized');
            }
        }

        // Export để app có thể sử dụng
        window.InteractivePreview = InteractivePreview;
