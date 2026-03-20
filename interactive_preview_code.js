// 🎯 CONTEXT MENU & UI FUNCTIONS

        // Tạo Context Menu UI
        createContextMenu() {
            // Xóa menu cũ nếu có
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
                <div class="menu-item" data-action="crop">
                    <span class="menu-icon">✂️</span>
                    <span class="menu-text">Chỉnh crop</span>
                </div>
                <div class="menu-item" data-action="replace">
                    <span class="menu-icon">🔄</span>
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

            // Add event listeners
            menu.querySelectorAll('.menu-item').forEach(item => {
                item.addEventListener('click', () => {
                    const action = item.dataset.action;
                    this.executeAction(action);
                    this.hideContextMenu();
                });
            });

            // Click outside to close
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target)) {
                    this.hideContextMenu();
                }
            });

            document.body.appendChild(menu);
            console.log('✅ Context Menu created');
        }

        // Show context menu
        showContextMenu(x, y, imageInfo) {
            const menu = document.getElementById('interactiveContextMenu');
            if (!menu) {
                console.error('❌ Context menu not found');
                return;
            }

            menu.style.display = 'block';
            menu.style.left = x + 'px';
            menu.style.top = y + 'px';

            // Adjust position if menu goes off screen
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

        // Hide context menu
        hideContextMenu() {
            const menu = document.getElementById('interactiveContextMenu');
            if (menu) {
                menu.style.display = 'none';
            }
        }

        // Show advanced menu (right-click)
        showAdvancedMenu(x, y, imageInfo) {
            // Tạm thời dùng context menu cũ
            // Sau này có thể tạo advanced menu riêng với nhiều options hơn
            this.showContextMenu(x, y, imageInfo);
        }

        // 🎯 ACTION FUNCTIONS

        // Execute action
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
                case 'crop':
                    this.openCropEditor({ index: imageIndex, position: this.printData.imagePositions[imageIndex] });
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

        // Xoay ảnh
        rotateImage(imageIndex, degrees) {
            const imageData = this.printData.selectedImages[imageIndex];
            if (!imageData) return;

            // Lưu rotation vào imageData
            if (!imageData.rotation) imageData.rotation = 0;
            imageData.rotation = (imageData.rotation + degrees) % 360;

            console.log('🔄 Rotated image', imageIndex, 'by', degrees, '°. New rotation:', imageData.rotation, '°');

            // Update preview
            this.updatePreview();
            this.showToast(`Đã xoay ảnh ${degrees > 0 ? 'phải' : 'trái'}`, 'success');
        }

        // Lật ảnh
        flipImage(imageIndex, direction) {
            const imageData = this.printData.selectedImages[imageIndex];
            if (!imageData) return;

            // Lưu flip state vào imageData
            if (!imageData.flip) {
                imageData.flip = { horizontal: false, vertical: false };
            }

            if (direction === 'horizontal') {
                imageData.flip.horizontal = !imageData.flip.horizontal;
                console.log('↔️ Flipped image', imageIndex, 'horizontally');
                this.showToast('Đã lật ảnh ngang', 'success');
            } else if (direction === 'vertical') {
                imageData.flip.vertical = !imageData.flip.vertical;
                console.log('↕️ Flipped image', imageIndex, 'vertically');
                this.showToast('Đã lật ảnh dọc', 'success');
            }

            // Update preview
            this.updatePreview();
        }

        // Xóa ảnh
        deleteImage(imageIndex) {
            if (!confirm('Bạn có chắc muốn xóa ảnh này?')) return;

            this.printData.selectedImages.splice(imageIndex, 1);
            this.printData.selectedImageIndex = null;

            console.log('🗑️ Deleted image at index', imageIndex);
            this.showToast('Đã xóa ảnh', 'success');

            // Update preview
            this.calculateLayout();
        }

        // Swap 2 ảnh
        swapImages(index1, index2) {
            const temp = this.printData.selectedImages[index1];
            this.printData.selectedImages[index1] = this.printData.selectedImages[index2];
            this.printData.selectedImages[index2] = temp;

            console.log('🔄 Swapped images:', index1, '↔️', index2);
            this.showToast('Đã đổi vị trí ảnh', 'success');

            // Update preview
            this.updatePreview();
        }

        // Open Crop Editor
        openCropEditor(imageInfo) {
            console.log('✂️ Opening Crop Editor for image:', imageInfo.index);
            this.showToast('Crop Editor đang được phát triển...', 'info');

            // TODO: Implement full crop editor
            // For now, navigate to workspace tab for cropping
            const imageData = this.printData.selectedImages[imageInfo.index];
            if (imageData) {
                this.showTab('workspace');
                // Optionally, select the image in workspace
                this.showToast('Vui lòng chỉnh crop trong tab Workspace', 'info');
            }
        }

        // Open Image Replacer
        openImageReplacer(imageIndex) {
            console.log('🔄 Opening Image Replacer for image:', imageIndex);

            // Create modal
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
                        <!-- Images will be inserted here -->
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

            // Populate with available images from gallery
            const grid = document.getElementById('replacerImageGrid');
            this.images.forEach((img, idx) => {
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
                    // Replace image
                    this.printData.selectedImages[imageIndex] = {
                        ...this.images[idx],
                        id: this.printData.selectedImages[imageIndex].id // Keep original ID
                    };
                    this.updatePreview();
                    this.showToast('Đã thay ảnh', 'success');
                    modal.remove();
                });

                grid.appendChild(imgContainer);
            });

            // Close button
            document.getElementById('closeReplacer').addEventListener('click', () => {
                modal.remove();
            });

            // Click outside to close
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        }

        // Handle multi-select
        handleMultiSelect(imageIndex) {
            if (!this.printData.multiSelectedIndices) {
                this.printData.multiSelectedIndices = [];
            }

            const idx = this.printData.multiSelectedIndices.indexOf(imageIndex);
            if (idx > -1) {
                // Deselect
                this.printData.multiSelectedIndices.splice(idx, 1);
            } else {
                // Select
                this.printData.multiSelectedIndices.push(imageIndex);
            }

            console.log('🎯 Multi-selected images:', this.printData.multiSelectedIndices);
            this.updatePreviewWithSelection();
        }

        // Update preview with selection highlight
        updatePreviewWithSelection() {
            // Redraw preview với highlight
            const overlay = document.getElementById('canvasOverlay');
            if (!overlay || !this.printData.imagePositions) return;

            // Clear overlay
            overlay.innerHTML = '';

            const scale = this.previewState?.scale || 1;

            // Draw selected image highlight
            if (this.printData.selectedImageIndex !== null && this.printData.imagePositions[this.printData.selectedImageIndex]) {
                const pos = this.printData.imagePositions[this.printData.selectedImageIndex];
                const highlight = document.createElement('div');
                highlight.style.cssText = `
                    position: absolute;
                    left: ${pos.x * scale}px;
                    top: ${pos.y * scale}px;
                    width: ${pos.width * scale}px;
                    height: ${pos.height * scale}px;
                    border: 3px solid #3b82f6;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
                    pointer-events: none;
                    z-index: 10;
                `;
                overlay.appendChild(highlight);
            }

            // Draw hovered image highlight
            if (this.printData.hoveredImageIndex !== null &&
                this.printData.hoveredImageIndex !== this.printData.selectedImageIndex &&
                this.printData.imagePositions[this.printData.hoveredImageIndex]) {
                const pos = this.printData.imagePositions[this.printData.hoveredImageIndex];
                const highlight = document.createElement('div');
                highlight.style.cssText = `
                    position: absolute;
                    left: ${pos.x * scale}px;
                    top: ${pos.y * scale}px;
                    width: ${pos.width * scale}px;
                    height: ${pos.height * scale}px;
                    border: 2px dashed #6b7280;
                    pointer-events: none;
                    z-index: 9;
                `;
                overlay.appendChild(highlight);
            }

            // Draw multi-selected highlights
            if (this.printData.multiSelectedIndices && this.printData.multiSelectedIndices.length > 0) {
                this.printData.multiSelectedIndices.forEach(idx => {
                    if (this.printData.imagePositions[idx] && idx !== this.printData.selectedImageIndex) {
                        const pos = this.printData.imagePositions[idx];
                        const highlight = document.createElement('div');
                        highlight.style.cssText = `
                            position: absolute;
                            left: ${pos.x * scale}px;
                            top: ${pos.y * scale}px;
                            width: ${pos.width * scale}px;
                            height: ${pos.height * scale}px;
                            border: 2px solid #10b981;
                            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
                            pointer-events: none;
                            z-index: 8;
                        `;
                        overlay.appendChild(highlight);
                    }
                });
            }
        }

        // 🎯 KEYBOARD SHORTCUTS
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                if (!this.printData.interactiveEnabled || this.printData.selectedImageIndex === null) return;

                // Ignore if typing in input field
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
