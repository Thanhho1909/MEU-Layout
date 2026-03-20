
            if (folderContent && collapseBtn) {
                const isCollapsed = folderContent.style.display === 'none';
                folderContent.style.display = isCollapsed ? 'block' : 'none';
                collapseBtn.textContent = isCollapsed ? '−' : '+';
                collapseBtn.title = isCollapsed ? 'Thu gọn' : 'Mở rộng';
            }
        }

        // Gửi ảnh đã chọn tới section khác
        async function sendToSection(targetSection) {
            if (selectedFileSystemImages.length === 0) {
                if (window.converter && typeof window.converter.showToast === 'function') {
                    window.converter.showToast('❌ Vui lòng chọn ít nhất một ảnh!', 'warning');
                } else {
                    alert('❌ Vui lòng chọn ít nhất một ảnh!');
                }
                return;
            }

            try {
                // Chuyển đến section trước để khởi tạo methods
                if (window.converter && typeof window.converter.switchToTab === 'function') {
                    window.converter.switchToTab(targetSection);
                }

                // Đợi một chút để section được khởi tạo hoàn toàn
                await new Promise(resolve => setTimeout(resolve, 500));

                const selectedFiles = [];
                for (const fileName of selectedFileSystemImages) {
                    const file = await window.converter.fileSystemStorage.getImageFile(fileName);
                    selectedFiles.push({ name: fileName, file });
                }

                // Gọi hàm loadImagesFromFileSystem với section đã được khởi tạo
                await loadImagesFromFileSystem(targetSection, selectedFiles);

                if (window.converter && typeof window.converter.showToast === 'function') {
                    window.converter.showToast('✅ Đã gửi ' + selectedFiles.length + ' ảnh tới ' + getSectionDisplayName(targetSection) + '!', 'success');
                }

            } catch (error) {
                console.error('Lỗi gửi ảnh:', error);
                if (window.converter && typeof window.converter.showToast === 'function') {
                    window.converter.showToast('❌ Lỗi gửi ảnh: ' + error.message, 'error');
                } else {
                    alert('❌ Lỗi gửi ảnh: ' + error.message);
                }
            }
        }

        // Lấy tên hiển thị của section
        function getSectionDisplayName(section) {
            const names = {
                'convert': 'Convert',
                'crop': 'Crop',
                'templates': 'Templates',
                'gallery': 'Gallery',
                'print': 'Print'
            };
            return names[section] || section;
        }

        // ===== NEW FOLDER STRUCTURE FUNCTIONS =====

        // Cập nhật folder filter options
        function updateFolderFilterOptions(images) {
            const folderSelect = document.getElementById('folderFilterSelect');
            if (!folderSelect) return;

            // Lấy danh sách unique folders
            const folders = [...new Set(images.map(img => img.folder))].sort();

            // Clear current options và thêm "all"
            folderSelect.innerHTML = '<option value="all">📁 Tất cả thư mục</option>';

            folders.forEach(folder => {
                const count = images.filter(img => img.folder === folder).length;
                const option = document.createElement('option');
                option.value = folder;
                option.textContent = `📁 ${folder} (${count})`;
                folderSelect.appendChild(option);
            });

            // Enable dropdown
            folderSelect.disabled = false;
        }

        // Cập nhật folder tree view
        function updateFolderTreeView(images) {
            const treeContainer = document.getElementById('filesystemTreeContainer');
            const treeContent = document.getElementById('filesystemTreeContent');
            const treeStats = document.getElementById('treeStatsText');

            if (!treeContainer || !treeContent || !treeStats) return;

            // Group images by folder
            const folderGroups = {};
            images.forEach(img => {
                if (!folderGroups[img.folder]) {
                    folderGroups[img.folder] = [];
                }
                folderGroups[img.folder].push(img);
            });

            const uniqueFolders = Object.keys(folderGroups).length;
            const totalImages = images.length;
            treeStats.textContent = `${uniqueFolders} thư mục, ${totalImages} ảnh`;

            // Generate tree HTML
            let treeHTML = '';
            Object.keys(folderGroups).sort().forEach(folder => {
                const folderImages = folderGroups[folder];
                const folderId = 'folder-' + folder.replace(/[^a-zA-Z0-9]/g, '-');

                treeHTML += `
                    <div class="tree-folder">
                        <div class="folder-header" onclick="toggleFolderExpansion('${folderId}')">
                            <div class="folder-info">
                                <span class="folder-name">📁 ${folder}</span>
                                <span class="folder-count">${folderImages.length}</span>
                            </div>
                            <button class="folder-toggle" id="toggle-${folderId}">▶</button>
                        </div>
                        <div class="folder-content" id="${folderId}">
                            <div class="folder-image-list">
                                ${folderImages.map(img => `
                                    <div class="folder-image-item" onclick="selectImageFromTree('${img.name}')" title="${img.name}">
                                        <img src="${img.url}" alt="${img.name}">
                                        <div class="folder-image-category">${getCategoryIcon(img.category)}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;
            });

            treeContent.innerHTML = treeHTML;

            // Enable tree toggle button
            const treeToggleBtn = document.getElementById('folderTreeToggleBtn');
            if (treeToggleBtn) {
                treeToggleBtn.disabled = false;
            }
        }

        // Helper function để lấy category icon
        function getCategoryIcon(category) {
            const icons = {
                convert: '🔄',
                crop: '✂️',
                template: '📝',
                gallery: '🖼️',
                print: '🖨️',
                work: '💼',
                archive: '📦',
                other: '📁'
            };
            return icons[category] || '📁';
        }

        // Toggle folder expansion in tree view
        function toggleFolderExpansion(folderId) {
            const folderContent = document.getElementById(folderId);
            const toggleBtn = document.getElementById('toggle-' + folderId);

            if (!folderContent || !toggleBtn) return;

            if (folderContent.classList.contains('expanded')) {
                folderContent.classList.remove('expanded');
                toggleBtn.textContent = '▶';
                toggleBtn.classList.remove('expanded');
            } else {
                folderContent.classList.add('expanded');
                toggleBtn.textContent = '▼';
                toggleBtn.classList.add('expanded');
            }
        }

        // Select image from tree view
        function selectImageFromTree(imageName) {
            const isCurrentlySelected = selectedFileSystemImages.includes(imageName);
            toggleImageSelection(imageName, !isCurrentlySelected);
        }

        // Toggle tree view visibility
        function toggleTreeView() {
            const treeContainer = document.getElementById('filesystemTreeContainer');
            const toggleBtn = document.getElementById('folderTreeToggleBtn');
            const icon = toggleBtn.querySelector('.btn-icon');

            if (!treeContainer || !toggleBtn || !icon) return;

            if (treeContainer.style.display === 'none' || !treeContainer.style.display) {
                treeContainer.style.display = 'block';
                icon.textContent = '🙈';
                toggleBtn.querySelector('.btn-text').textContent = 'Ẩn cây';
            } else {
                treeContainer.style.display = 'none';
                icon.textContent = '🌳';
                toggleBtn.querySelector('.btn-text').textContent = 'Cây thư mục';
            }
        }

        // Filter by folder
        function filterByFolder(selectedFolder) {
            if (selectedFolder === 'all' || !selectedFolder) {
                filteredImages = [...fileSystemImages];
            } else {
                filteredImages = fileSystemImages.filter(img => img.folder === selectedFolder);
            }
            displayFileSystemImages();
        }

        // Filter by category
        function filterByCategory(selectedCategory) {
            if (selectedCategory === 'all' || !selectedCategory) {
                filteredImages = [...fileSystemImages];
            } else {
                filteredImages = fileSystemImages.filter(img => img.category === selectedCategory);
            }
            displayFileSystemImages();
        }

        // Enable File System controls
        function enableFileSystemControls() {
            const controls = [
                'fsSearchInput',
                'fsFormatFilter',
                'fsFolderFilter',
                'fsCategoryFilter',
                'fsTreeView',
                'fsSelectAllBtn',
                'fsExportBtn',
                'fsClearSelectionBtn',
                'fsSizeSlider'
            ];

            controls.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.disabled = false;
                }
            });
        }

    </script>
        // Event Handlers cho File System Section
        window.addEventListener('load', function() {
            // Initialize File System Section Event Handlers

            // Header buttons
            const grantPermissionBtn = document.getElementById('filesystemPermissionBtn');
            const scanImagesBtn = document.getElementById('filesystemScanBtn');
            const fsSelectDirectoryBtn = document.getElementById('fsSelectDirectoryBtn');
            const fsScanBtn = document.getElementById('fsScanBtn');
            const clearAllDataBtn = document.getElementById('clearAllDataBtn');

            // New File System buttons
            if (fsSelectDirectoryBtn) {
                fsSelectDirectoryBtn.addEventListener('click', async () => {
                    try {
                        if (!window.converter) {
                            window.converter = {};
                        }
                        if (!window.converter.fileSystemStorage) {
                            try {
                                if (typeof window.FileSystemStorage === 'function') {
                                    window.converter.fileSystemStorage = new window.FileSystemStorage();
                                } else {
                                    throw new Error('FileSystemStorage class chưa được load');
                                }
                            } catch (error) {
                                throw new Error('Không thể khởi tạo FileSystemStorage: ' + error.message);
                            }
                        }

                        await window.converter.fileSystemStorage.init();

                        // Update UI
                        const dirName = document.getElementById('fsDirectoryName');
                        const dirPath = document.getElementById('fsDirectoryPath');
                        const fsStatus = document.getElementById('fsStatus');
                        const fsToolbar = document.getElementById('fsToolbar');
                        const fsDirectoryStats = document.getElementById('fsDirectoryStats');
                        const fsScanBtn = document.getElementById('fsScanBtn');

                        if (dirName) dirName.textContent = 'Đã chọn thư mục';
                        if (dirPath) dirPath.textContent = 'Đã cấp quyền truy cập thư mục';
                        if (fsStatus) {
                            fsStatus.className = 'fs-status connected';
                            const statusText = document.getElementById('fsStatusText');
                            if (statusText) statusText.textContent = 'Đã kết nối';
                        }
                        if (fsToolbar) fsToolbar.style.display = 'flex';
                        if (fsDirectoryStats) fsDirectoryStats.style.display = 'flex';
                        if (fsScanBtn) fsScanBtn.disabled = false;

                        // Auto scan after granting permission
                        setTimeout(() => {
                            if (typeof scanFileSystemImages === 'function') {
                                scanFileSystemImages();
                            }
                        }, 500);

                    } catch (error) {
                        console.error('Lỗi cấp quyền:', error);
                        if (window.converter && typeof window.converter.showToast === 'function') {
                            if (error.name === 'AbortError') {
                                window.converter.showToast('Đã hủy chọn thư mục', 'warning');
                            } else {
                                window.converter.showToast('❌ Lỗi cấp quyền: ' + error.message, 'error');
                            }
                        }
                    }
                });
            }

            if (fsScanBtn) {
                fsScanBtn.addEventListener('click', () => {
                    if (typeof scanFileSystemImages === 'function') {
                        scanFileSystemImages();
                    }
                });
            }

            // Clear All Data Button - Xóa toàn bộ localStorage
            if (clearAllDataBtn) {
                clearAllDataBtn.addEventListener('click', async () => {
                    // Hiển thị xác nhận trước khi xóa
                    const confirmMessage = '⚠️ BẠN CHẮC CHẮN MUỐN XÓA TOÀN BỘ DỮ LIỆU?\n\n' +
                        'Hành động này sẽ xóa:\n' +
                        '• Tất cả ảnh trong kho (Gallery)\n' +
                        '• Dữ liệu ảnh đã convert\n' +
                        '• Tất cả settings và cấu hình\n' +
                        '• Cache và temporary data\n\n' +
                        'Dữ liệu sẽ KHÔNG THỂ KHÔI PHỤC!';

                    if (!confirm(confirmMessage)) {
                        return;
                    }

                    // Xác nhận lần 2
                    if (!confirm('Xác nhận lần cuối: XÓA TOÀN BỘ DỮ LIỆU?')) {
                        return;
                    }

                    try {
                        // Đếm số items trước khi xóa
                        const itemCount = localStorage.length;
                        const keys = Object.keys(localStorage);

                        console.log('🗑️ Bắt đầu xóa toàn bộ localStorage...');
                        console.log('📊 Tổng số items:', itemCount);
                        console.log('🔑 Keys:', keys);

                        // Xóa toàn bộ localStorage
                        localStorage.clear();

                        console.log('✅ Đã xóa toàn bộ localStorage');

                        // Xóa galleryImages nếu có
                        if (window.converter && window.converter.galleryImages) {
                            window.converter.galleryImages = [];
                            console.log('✅ Đã xóa galleryImages');
                        }

                        // Reset các data structures khác
                        if (window.converter) {
                            window.converter.files = [];
                            window.converter.cropFiles = [];
                            console.log('✅ Đã reset files và cropFiles');
                        }

                        // Hiển thị thông báo thành công
                        if (window.imageConverter && typeof window.imageConverter.showToast === 'function') {
                            window.imageConverter.showToast(`✅ Đã xóa ${itemCount} items khỏi LocalStorage!`, 'success');
                        } else {
                            alert(`✅ Đã xóa toàn bộ dữ liệu!\n\nĐã xóa ${itemCount} items.`);
                        }

                        // Reload trang sau 1.5s
                        setTimeout(() => {
                            console.log('🔄 Reloading page...');
                            window.location.reload();
                        }, 1500);

                    } catch (error) {
                        console.error('❌ Lỗi khi xóa localStorage:', error);
                        if (window.imageConverter && typeof window.imageConverter.showToast === 'function') {
                            window.imageConverter.showToast('❌ Lỗi khi xóa dữ liệu: ' + error.message, 'error');
                        } else {
                            alert('❌ Lỗi khi xóa dữ liệu:\n' + error.message);
                        }
                    }
                });
            }

            if (grantPermissionBtn) {
                grantPermissionBtn.addEventListener('click', async () => {
                    try {
                        if (!window.converter) {
                            window.converter = {};
                        }
                        if (!window.converter.fileSystemStorage) {
                            try {
                                if (typeof window.FileSystemStorage === 'function') {
                                    window.converter.fileSystemStorage = new window.FileSystemStorage();
                                } else {
                                    throw new Error('FileSystemStorage class chưa được load');
                                }
                            } catch (error) {
                                throw new Error('Không thể khởi tạo FileSystemStorage: ' + error.message);
                            }
                        }

                        await window.converter.fileSystemStorage.init();

                        // Update status và UI
                        const statusElement = document.getElementById('fsDirectoryName');
                        if (statusElement) {
                            statusElement.textContent = '✅ Đã cấp quyền';
                        }
                        grantPermissionBtn.textContent = '✅ Đã cấp quyền';
                        grantPermissionBtn.disabled = true;

                        // Auto scan after granting permission
                        setTimeout(() => {
                            if (typeof scanFileSystemImages === 'function') {
                                scanFileSystemImages();
                            }
                        }, 500);

                    } catch (error) {
                        console.error('Lỗi cấp quyền:', error);
                        if (window.converter && typeof window.converter.showToast === 'function') {
                            window.converter.showToast('❌ Lỗi cấp quyền: ' + error.message, 'error');
                        } else {
                            alert('❌ Lỗi cấp quyền: ' + error.message);
                        }
                    }
                });
            }

            if (scanImagesBtn) {
                scanImagesBtn.addEventListener('click', () => {
                    if (typeof scanFileSystemImages === 'function') {
                        scanFileSystemImages();
                    }
                });
            }

            // Search input
            const searchInput = document.getElementById('fsSearchInput');
            if (searchInput) {
                let searchTimeout;
                searchInput.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        if (typeof filterFileSystemImages === 'function') {
                            filterFileSystemImages(e.target.value);
                        }
                    }, 300);
                });
            }

            // Filter select
            const filterSelect = document.getElementById('fsFormatFilter');
            if (filterSelect) {
                filterSelect.addEventListener('change', (e) => {
                    const filterType = e.target.value;
                    if (filterType === 'all') {
                        filteredImages = [...fileSystemImages];
                    } else {
                        filteredImages = fileSystemImages.filter(img => {
                            const ext = img.name.toLowerCase().split('.').pop();
                            if (filterType === 'jpg') return ['jpg', 'jpeg'].includes(ext);
                            return ext === filterType;
                        });
                    }
                    if (typeof displayFileSystemImages === 'function') {
                        displayFileSystemImages();
                    }
                });
            }

            // Folder filter select
            const folderFilterSelect = document.getElementById('folderFilterSelect');
            if (folderFilterSelect) {
                folderFilterSelect.addEventListener('change', (e) => {
                    if (typeof filterByFolder === 'function') {
                        filterByFolder(e.target.value);
                    }
                });
            }

            // Category filter select
            const categoryFilterSelect = document.getElementById('categoryFilterSelect');
            if (categoryFilterSelect) {
                categoryFilterSelect.addEventListener('change', (e) => {
                    if (typeof filterByCategory === 'function') {
                        filterByCategory(e.target.value);
                    }
                });
            }

            // Folder tree toggle button
            const folderTreeToggleBtn = document.getElementById('folderTreeToggleBtn');
            if (folderTreeToggleBtn) {
                folderTreeToggleBtn.addEventListener('click', () => {
                    if (typeof toggleTreeView === 'function') {
                        toggleTreeView();
                    }
                });
            }

            // View toggle buttons
            const gridViewBtn = document.getElementById('filesystemGridView');
            const listViewBtn = document.getElementById('filesystemListView');

            if (gridViewBtn) {
                gridViewBtn.addEventListener('click', () => {
                    currentViewMode = 'grid';
                    setActiveViewMode('grid');
                    if (typeof displayFileSystemImages === 'function') {
                        displayFileSystemImages();
                    }
                });
            }

            if (listViewBtn) {
                listViewBtn.addEventListener('click', () => {
                    currentViewMode = 'list';
                    setActiveViewMode('list');
                    if (typeof displayFileSystemImages === 'function') {
                        displayFileSystemImages();
                    }
                });
            }

            // Selection control buttons
            const selectAllBtn = document.getElementById('filesystemSelectAllBtn');
            const refreshBtn = document.getElementById('filesystemRefreshBtn');

            if (selectAllBtn) {
                selectAllBtn.addEventListener('click', () => {
                    if (typeof selectAllFileSystemImages === 'function') {
                        selectAllFileSystemImages();
                    }
                });
            }


            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    // Clear current data
                    fileSystemImages = [];
                    filteredImages = [];
                    selectedFileSystemImages = [];

                    // Rescan
                    if (typeof scanFileSystemImages === 'function') {
                        scanFileSystemImages();
                    }
                });
            }

            // Check if permission already granted on page load
            setTimeout(() => {
                if (window.converter && window.converter.fileSystemStorage && window.converter.fileSystemStorage.directoryHandle) {
                    const statusElement = document.getElementById('fsDirectoryName');
                    if (statusElement) {
                        statusElement.textContent = '✅ Đã cấp quyền';
                    }
                    if (grantPermissionBtn) {
                        grantPermissionBtn.textContent = '✅ Đã cấp quyền';
                        grantPermissionBtn.disabled = true;
                    }
                }
            }, 1000);
        });

        // Helper functions for UI updates
        function setActiveViewMode(mode) {
            document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
            const modeMap = {
                'grid': 'filesystemGridView',
                'list': 'filesystemListView'
            };
            const activeBtn = document.getElementById(modeMap[mode]);
            if (activeBtn) activeBtn.classList.add('active');
        }

        // ===== AUTO PRINT SECTION CLASS =====
        class AutoPrintSection {
            constructor() {
                this.selectedFolder = null;
                this.files = [];
                this.analyzedFiles = [];
                this.classifiedImages = null;
                this.printPages = [];
                this.exportedFiles = [];
                this.config = {
                    autoCrop: true,
                    autoClassify: true,
                    autoLayout: true,
                    autoExport: true
                };
                this.isProcessing = false;
            }

            // Initialize Auto Print Section
            init() {
                console.log('🤖 Initializing Auto Print Section...');
                this.setupEventListeners();
                this.resetUI();
            }

            // Setup event listeners
            setupEventListeners() {
                // Folder selection button
                const selectFolderBtn = document.getElementById('apSelectFolderBtn');
                if (selectFolderBtn) {
                    selectFolderBtn.addEventListener('click', () => this.selectFolder());
                }

                // Start button
                const startBtn = document.getElementById('apStartBtn');
                if (startBtn) {
                    startBtn.addEventListener('click', () => this.startAutoProcess());
                }

                // Reset button
                const resetBtn = document.getElementById('apResetBtn');
                if (resetBtn) {
                    resetBtn.addEventListener('click', () => this.reset());
                }

                // Config checkboxes
                const autoCropCheckbox = document.getElementById('apAutoCrop');
                const autoClassifyCheckbox = document.getElementById('apAutoClassify');
                const autoLayoutCheckbox = document.getElementById('apAutoLayout');
                const autoExportCheckbox = document.getElementById('apAutoExport');

                if (autoCropCheckbox) {
                    autoCropCheckbox.addEventListener('change', (e) => {
                        this.config.autoCrop = e.target.checked;
                    });
                }
                if (autoClassifyCheckbox) {
                    autoClassifyCheckbox.addEventListener('change', (e) => {
                        this.config.autoClassify = e.target.checked;
                    });
                }
                if (autoLayoutCheckbox) {
                    autoLayoutCheckbox.addEventListener('change', (e) => {
                        this.config.autoLayout = e.target.checked;
                    });
                }
                if (autoExportCheckbox) {
                    autoExportCheckbox.addEventListener('change', (e) => {
                        this.config.autoExport = e.target.checked;
                    });
                }

                console.log('✅ Auto Print event listeners initialized');
            }

            // Select folder using File System Access API
            async selectFolder() {
                try {
                    if (!('showDirectoryPicker' in window)) {
                        alert('Trình duyệt của bạn không hỗ trợ File System Access API.\nVui lòng sử dụng Chrome, Edge hoặc trình duyệt hiện đại khác.');
                        return;
                    }

                    const dirHandle = await window.showDirectoryPicker();
                    this.selectedFolder = dirHandle;

                    // Check if scan subfolders option is enabled
                    const scanSubfoldersCheckbox = document.getElementById('apScanSubfolders');
                    const recursive = scanSubfoldersCheckbox ? scanSubfoldersCheckbox.checked : true;

                    console.log(`📁 Scanning folder: ${dirHandle.name} (recursive: ${recursive})`);

                    // Scan files in folder
                    await this.scanFolder(dirHandle, recursive);

                } catch (error) {
                    if (error.name !== 'AbortError') {
                        console.error('❌ Error selecting folder:', error);
                        alert('Lỗi khi chọn thư mục: ' + error.message);
                    }
                }
            }

            // Scan folder for image files
            async scanFolder(dirHandle, recursive = true) {
                this.files = [];
                this.updateStatus('🔍 Đang quét thư mục...');

                console.group('🔍 Scanning Folder');
                console.log('Folder:', dirHandle.name);
                console.log('Recursive:', recursive);

                try {
                    await this.scanFolderRecursive(dirHandle, recursive, 0);

                    console.log('');
                    console.log(`✅ SCAN COMPLETE: Found ${this.files.length} image files`);
                    console.groupEnd();

                    // Update UI
                    this.updateFolderInfo(dirHandle.name, this.files.length);

                    // Analyze files
                    if (this.files.length > 0) {
                        await this.analyzeFiles();
                    } else {
                        console.groupEnd(); // Close group if opened
                        alert('❌ Không tìm thấy ảnh nào trong thư mục này!\n\n' +
                              'Kiểm tra:\n' +
                              '• Thư mục có chứa file ảnh không?\n' +
                              '• File có đuôi .jpg, .jpeg, .png không?\n' +
                              '• Nếu ảnh ở thư mục con, bật "Quét cả thư mục con"\n\n' +
                              'Mở Console (F12) để xem chi tiết.');
                    }

                } catch (error) {
                    console.error('❌ Error scanning folder:', error);
                    console.groupEnd();
                    alert('Lỗi khi quét thư mục: ' + error.message);
                }
            }

            // Recursive folder scanner
            async scanFolderRecursive(dirHandle, recursive = true, depth = 0) {
                const indent = '  '.repeat(depth);
                let scannedCount = 0;
                let imageCount = 0;

                console.log(`${indent}📂 Scanning: ${dirHandle.name}`);

                for await (const entry of dirHandle.values()) {
                    scannedCount++;

                    if (entry.kind === 'file') {
                        try {
                            const file = await entry.getFile();

                            // Check if it's an image file by MIME type OR file extension
                            const isImageByType = file.type && file.type.startsWith('image/');
                            const isImageByExt = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name);

                            if (isImageByType || isImageByExt) {
                                this.files.push(file);
                                imageCount++;
                                console.log(`${indent}  ✅ ${file.name} (${file.size} bytes, ${file.type || 'detect by ext'})`);
                            } else {
                                // Only log skipped files if verbose mode
                                // console.log(`${indent}  ⏭️  ${file.name} (${file.type || 'no type'})`);
                            }
                        } catch (error) {
                            console.warn(`${indent}  ⚠️ Cannot read ${entry.name}:`, error.message);
                        }
                    } else if (entry.kind === 'directory' && recursive) {
                        // Scan subfolder
                        await this.scanFolderRecursive(entry, recursive, depth + 1);
                    }
                }

                if (imageCount > 0) {
                    console.log(`${indent}  📊 Found ${imageCount} images (scanned ${scannedCount} items)`);
                }
            }

            // Parse filename to extract metadata
            parseFileName(filename) {
                // Remove file extension
                const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');

                // Multiple regex patterns to match different naming conventions
                const patterns = [
                    // Pattern 1: "Card 5.5x8.5cm - mẫu 1a mặt trước"
                    /(?:card\s*)?(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*cm.*?(\d+)([ab])\s*(mặt\s*)?(trước|sau|front|back)/i,

                    // Pattern 2: "5.5x8.5_1a_front"
                    /(\d+\.?\d*)\s*x\s*(\d+\.?\d*)[_\s-]+(\d+)([ab])[_\s-]*(front|back|trước|sau)/i,

                    // Pattern 3: "5.5x8.5 - 1a - front"
                    /(\d+\.?\d*)\s*x\s*(\d+\.?\d*)[_\s-]+(\d+)([ab])[_\s-]+(front|back|trước|sau)/i,

                    // Pattern 4: Simple "1a front" or "1b back"
                    /(\d+)([ab])[_\s-]*(front|back|trước|sau)/i
                ];

                for (const pattern of patterns) {
                    const match = nameWithoutExt.match(pattern);
                    if (match) {
                        const result = {
                            width: match[1] ? parseFloat(match[1]) : null,
                            height: match[2] ? parseFloat(match[2]) : null,
                            id: match[3] || match[1], // ID number
                            letter: match[4] ? match[4].toLowerCase() : null, // 'a' or 'b'
                            side: null,
                            rawFilename: filename
                        };

                        // Determine side (front/back)
                        const sideText = match[match.length - 1].toLowerCase();
                        if (sideText === 'front' || sideText === 'trước' || result.letter === 'a') {
                            result.side = 'front';
                        } else if (sideText === 'back' || sideText === 'sau' || result.letter === 'b') {
                            result.side = 'back';
                        }

                        return result;
                    }
                }

                // No pattern matched
                return {
                    width: null,
                    height: null,
                    id: null,
                    letter: null,
                    side: null,
                    rawFilename: filename,
                    parseError: 'Không nhận diện được pattern'
                };
            }

            // Analyze all files
            async analyzeFiles() {
                this.updateStatus('🔍 Đang phân tích file...');
                this.analyzedFiles = [];

                const sizeMap = new Map();
                const pairMap = new Map();
                let needsCrop = 0;

                for (const file of this.files) {
                    const parsed = this.parseFileName(file.name);

                    // Get image dimensions
                    const dimensions = await this.getImageDimensions(file);

                    const analyzed = {
                        file,
                        parsed,
                        dimensions,
                        needsCrop: false
                    };

                    // Check if needs crop
                    if (parsed.width && parsed.height) {
                        const expectedWidth = this.cmToPixels(parsed.width);
                        const expectedHeight = this.cmToPixels(parsed.height);

                        const tolerance = 0.05; // 5% tolerance
                        const widthMatch = Math.abs(dimensions.width - expectedWidth) / expectedWidth < tolerance;
                        const heightMatch = Math.abs(dimensions.height - expectedHeight) / expectedHeight < tolerance;

                        if (!widthMatch || !heightMatch) {
                            analyzed.needsCrop = true;
                            needsCrop++;
                        }
                    }

                    this.analyzedFiles.push(analyzed);

                    // Track sizes
                    if (parsed.width && parsed.height) {
                        const sizeKey = `${parsed.width}x${parsed.height}`;
                        sizeMap.set(sizeKey, (sizeMap.get(sizeKey) || 0) + 1);
                    }

                    // Track pairs
                    if (parsed.id) {
                        if (!pairMap.has(parsed.id)) {
                            pairMap.set(parsed.id, { front: null, back: null });
                        }
                        const pair = pairMap.get(parsed.id);
                        if (parsed.side === 'front') {
                            pair.front = file.name;
                        } else if (parsed.side === 'back') {
                            pair.back = file.name;
                        }
                    }
                }

                // Determine mode (simplex/duplex)
                let mode = 'unknown';
                let hasFront = false;
                let hasBack = false;
                for (const [id, pair] of pairMap) {
                    if (pair.front) hasFront = true;
                    if (pair.back) hasBack = true;
                }
                if (hasFront && hasBack) {
                    mode = 'Duplex (2 mặt)';
                } else if (hasFront || hasBack) {
                    mode = 'Simplex (1 mặt)';
                }

                // Get most common size
                let mostCommonSize = '-';
                let maxCount = 0;
                for (const [size, count] of sizeMap) {
                    if (count > maxCount) {
                        mostCommonSize = size + 'cm';
                        maxCount = count;
                    }
                }

                // Update analysis UI
                this.displayAnalysisResults({
                    totalFiles: this.files.length,
                    detectedSize: mostCommonSize,
                    printMode: mode,
                    needsCrop: needsCrop,
                    pairs: pairMap
                });

                console.log('✅ Analysis complete:', {
                    total: this.files.length,
                    size: mostCommonSize,
                    mode,
                    needsCrop
                });
            }

            // Get image dimensions
            getImageDimensions(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = new Image();
                        img.onload = () => {
                            resolve({ width: img.width, height: img.height });
                        };
                        img.onerror = reject;
                        img.src = e.target.result;
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }

            // Convert cm to pixels (assuming 300 DPI)
            cmToPixels(cm, dpi = 300) {
                return Math.round((cm / 2.54) * dpi);
            }

            // Update folder info UI
            updateFolderInfo(folderName, fileCount) {
                const folderInfo = document.getElementById('apFolderInfo');
                const folderNameEl = document.getElementById('apFolderName');
                const fileCountEl = document.getElementById('apFileCount');

                if (folderInfo) folderInfo.style.display = 'flex';
                if (folderNameEl) folderNameEl.textContent = folderName;
                if (fileCountEl) fileCountEl.textContent = `${fileCount} file`;
            }

            // Display analysis results
            displayAnalysisResults(results) {
                // Show analysis step
                const analysisStep = document.getElementById('apAnalysisStep');
                if (analysisStep) analysisStep.style.display = 'block';

                // Update values
                const detectedCount = document.getElementById('apDetectedCount');
                const detectedSize = document.getElementById('apDetectedSize');
                const printMode = document.getElementById('apPrintMode');
                const needsCrop = document.getElementById('apNeedsCrop');

                if (detectedCount) detectedCount.textContent = `${results.totalFiles} ảnh`;
                if (detectedSize) detectedSize.textContent = results.detectedSize;
                if (printMode) printMode.textContent = results.printMode;
                if (needsCrop) needsCrop.textContent = `${results.needsCrop} ảnh`;

                // Show detected pairs
                if (results.pairs.size > 0) {
                    const pairsContainer = document.getElementById('apDetectedPairs');
                    const pairsList = document.getElementById('apPairsList');

                    if (pairsContainer && pairsList) {
                        pairsContainer.style.display = 'block';
                        pairsList.innerHTML = '';

                        for (const [id, pair] of results.pairs) {
                            const pairEl = document.createElement('div');
                            pairEl.style.cssText = 'padding: 8px; background: var(--surface); border-radius: 6px; font-size: 13px;';

                            const frontText = pair.front ? `✅ ${pair.front}` : '❌ Thiếu mặt trước';
                            const backText = pair.back ? `✅ ${pair.back}` : '❌ Thiếu mặt sau';

                            pairEl.innerHTML = `
                                <strong>Cặp ${id}:</strong><br>
                                <span style="color: var(--text-secondary);">${frontText}</span><br>
                                <span style="color: var(--text-secondary);">${backText}</span>
                            `;
                            pairsList.appendChild(pairEl);
                        }
                    }
                }

                // Show config step
                const configStep = document.getElementById('apConfigStep');
                if (configStep) configStep.style.display = 'block';

                // Show start button
                const startBtn = document.getElementById('apStartBtn');
                if (startBtn) startBtn.style.display = 'inline-flex';

                const resetBtn = document.getElementById('apResetBtn');
                if (resetBtn) resetBtn.style.display = 'inline-flex';

                this.updateStatus('✅ Sẵn sàng xử lý');
            }

            // Start automatic processing
            async startAutoProcess() {
                if (this.isProcessing) return;
                if (this.analyzedFiles.length === 0) {
                    alert('Chưa có file nào để xử lý!');
                    return;
                }

                this.isProcessing = true;
                this.updateStatus('🚀 Đang xử lý...');

                // Show progress section
                const progressSection = document.getElementById('apProgressSection');
                if (progressSection) progressSection.style.display = 'block';

                // Hide action buttons
                const startBtn = document.getElementById('apStartBtn');
                const resetBtn = document.getElementById('apResetBtn');
                if (startBtn) startBtn.style.display = 'none';
                if (resetBtn) resetBtn.style.display = 'none';

                try {
                    // Step 1: Auto Crop (if enabled)
                    if (this.config.autoCrop) {
                        await this.performAutoCrop();
                    }

                    // Step 2: Auto Classify (if enabled)
                    if (this.config.autoClassify) {
                        await this.performAutoClassify();
                    }

                    // Step 3: Auto Layout (if enabled)
                    if (this.config.autoLayout) {
                        await this.performAutoLayout();
                    }

                    // Step 4: Auto Export (if enabled)
                    if (this.config.autoExport) {
                        await this.performAutoExport();
                    }

                    // Show success
                    this.showSuccess();

                } catch (error) {
                    console.error('❌ Error during auto process:', error);
                    alert('Lỗi trong quá trình xử lý: ' + error.message);
                    this.updateStatus('❌ Xử lý thất bại');
                } finally {
                    this.isProcessing = false;
                }
            }

            // Perform auto crop
            async performAutoCrop() {
                this.updateProgress(10, 'Đang crop ảnh...');

                if (!window.converter) {
                    console.warn('⚠️ ImageConverter not found, skipping crop');
                    return;
                }

                let croppedCount = 0;
                const imagesToCrop = this.analyzedFiles.filter(f => f.needsCrop);

                console.log(`🔧 Starting auto crop for ${imagesToCrop.length} images...`);

                for (let i = 0; i < imagesToCrop.length; i++) {
                    const analyzed = imagesToCrop[i];
                    const { file, parsed } = analyzed;

                    if (!parsed.width || !parsed.height) {
                        console.warn(`⚠️ Skipping ${file.name} - no size info`);
                        continue;
                    }

                    try {
                        // Set crop config
                        window.converter.cropData = window.converter.cropData || {};
                        window.converter.cropData.config = {
                            width: parsed.width,
                            height: parsed.height
                        };

                        // Create fileData structure
                        const fileData = { file };

                        // Perform center crop
                        const croppedBlob = await window.converter.cropImageAuto(fileData);

                        // Replace original file with cropped version
                        const croppedFile = new File([croppedBlob], file.name, { type: 'image/jpeg' });
                        analyzed.file = croppedFile;
                        analyzed.needsCrop = false;

                        croppedCount++;

                        // Update progress
                        const progress = 10 + Math.round((i / imagesToCrop.length) * 15);
                        this.updateProgress(progress, `Đang crop ảnh ${i + 1}/${imagesToCrop.length}...`);

                    } catch (error) {
                        console.error(`❌ Error cropping ${file.name}:`, error);
                    }
                }

                console.log(`✅ Auto crop complete: ${croppedCount}/${imagesToCrop.length} images cropped`);
                this.updateProgress(25, `Đã crop ${croppedCount} ảnh`);
            }

            // Perform auto classify - SMART LOGIC
            async performAutoClassify() {
                this.updateProgress(30, 'Đang phân loại ảnh thông minh...');

                let frontImages = [];
                let backImages = [];
                const templateImages = [];
                const unclassified = [];

                // ===== BƯỚC 1: PHÂN LOẠI BAN ĐẦU =====
                for (const analyzed of this.analyzedFiles) {
                    const { file, parsed } = analyzed;

                    // Detect template/background files
                    if (/template|background|mau.*sau|back.*template|mat.*sau/i.test(file.name)) {
                        console.log(`📋 Template detected: ${file.name}`);
                        templateImages.push(file);
                        backImages.push(file); // Templates usually are back side
                        continue;
                    }

                    // Check explicit side in filename
                    if (parsed.side === 'front' || /front|truoc|mat.*truoc/i.test(file.name)) {
                        frontImages.push(file);
                    } else if (parsed.side === 'back' || /back|sau|mat.*sau/i.test(file.name)) {
                        backImages.push(file);
                    } else {
                        // Không parse được side → mặc định là FRONT
                        console.log(`⚠️ No side detected for "${file.name}", defaulting to FRONT`);
                        frontImages.push(file);
                    }
                }

                console.log('📊 Initial classification:', {
                    front: frontImages.length,
                    back: backImages.length,
                    templates: templateImages.length,
                    unclassified: unclassified.length
                });

                // ===== BƯỚC 2: SMART LOGIC =====

                // Case 1: 1 back template cho tất cả front
                if (backImages.length === 1 && frontImages.length > 1) {
                    console.log(`🧠 Smart Case 1: Nhân bản 1 back template cho ${frontImages.length} front images`);
                    const backTemplate = backImages[0];
                    backImages = Array(frontImages.length).fill(backTemplate);
                    this.updateProgress(35, `Smart: 1 back cho ${frontImages.length} front`);
                }

                // Case 2: 1 front template cho nhiều back (ít gặp)
                else if (frontImages.length === 1 && backImages.length > 1) {
                    console.log(`🧠 Smart Case 2: Nhân bản 1 front template cho ${backImages.length} back images`);
                    const frontTemplate = frontImages[0];
                    frontImages = Array(backImages.length).fill(frontTemplate);
                    this.updateProgress(35, `Smart: 1 front cho ${backImages.length} back`);
                }

                // Case 3: Số lượng không khớp - duplicate last item
                else if (frontImages.length > backImages.length && backImages.length > 0) {
                    const diff = frontImages.length - backImages.length;
                    const lastBack = backImages[backImages.length - 1];
                    console.log(`🧠 Smart Case 3: Nhân bản back cuối ${diff} lần để khớp với ${frontImages.length} front`);
                    backImages.push(...Array(diff).fill(lastBack));
                    this.updateProgress(35, `Smart: Đã cân bằng số lượng`);
                }

                else if (backImages.length > frontImages.length && frontImages.length > 0) {
                    const diff = backImages.length - frontImages.length;
                    const lastFront = frontImages[frontImages.length - 1];
                    console.log(`🧠 Smart Case 4: Nhân bản front cuối ${diff} lần để khớp với ${backImages.length} back`);
                    frontImages.push(...Array(diff).fill(lastFront));
                    this.updateProgress(35, `Smart: Đã cân bằng số lượng`);
                }

                // ===== BƯỚC 3: XÁC ĐỊNH CHẾ ĐỘ IN =====
                const isDuplex = frontImages.length > 0 && backImages.length > 0;
                const mode = isDuplex ? 'Duplex (2 mặt)' : 'Simplex (1 mặt)';

                // Store classified images for layout step
                this.classifiedImages = {
                    front: frontImages,
                    back: backImages,
                    unclassified: unclassified,
                    isDuplex: isDuplex,
                    smartApplied: true,
                    mode: mode
                };

                console.log(`✅ Smart classify complete:`, {
                    front: frontImages.length,
                    back: backImages.length,
                    unclassified: unclassified.length,
                    isDuplex: isDuplex,
                    mode: mode,
                    balanced: frontImages.length === backImages.length
                });

                this.updateProgress(50, `Phân loại: ${frontImages.length} front, ${backImages.length} back (${mode})`);
            }

            // Perform auto layout - TÍCH HỢP 100% VỚI PRINT SECTION
            async performAutoLayout() {
                this.updateProgress(55, 'Đang tạo layout in với Print Section...');

                if (!this.classifiedImages) {
                    console.warn('⚠️ No classified images, skipping layout');
                    return;
                }

                if (!window.converter) {
                    throw new Error('❌ Print Section (window.converter) not available');
                }

                const { front, back, isDuplex } = this.classifiedImages;

                console.log(`🖼️ Preparing layout using Print Section:`, {
                    isDuplex,
                    frontCount: front.length,
                    backCount: back.length
                });

                // ===== LOAD IMAGE OBJECTS =====
                this.updateProgress(60, 'Đang load ảnh...');
                const frontImageObjects = await this.loadImageObjects(front);

                let backImageObjects = [];
                if (isDuplex) {
                    backImageObjects = await this.loadImageObjects(back);
                }

                // ===== SETUP PRINT DATA - GIỐNG HỆT PRINT SECTION =====
                this.updateProgress(65, 'Đang setup Print Section...');

                // Initialize printData với config đầy đủ
                if (!window.converter.printData || !window.converter.printData.config || !window.converter.printData.config.paperSize) {
                    console.log('🔧 Initializing printData with full config...');
                    window.converter.printData = {
                        selectedImages: [],
                        frontImages: {},
                        backImages: {},
                        currentPage: 0,
                        maxPhotosPerPage: 10,
                        totalPages: 1,
                        config: {
                            paperSize: { width: 210, height: 297 }, // A4 mm
                            photoSize: { width: 5.5, height: 8.5 }, // cm
                            margins: { top: 5, bottom: 5, left: 5, right: 5 }, // mm
                            gutter: { x: 3, y: 5 }, // mm
                            dpi: 300,
                            orientation: 'portrait',
                            fitMode: 'fill',
                            printMode: 'single',
                            duplexFlip: 'long-edge',
                            duplexPhysicalOffset: { x: 0, y: 0 },
                            backSideBleed: 0.3,
                            backSideBleedEnabled: true,
                            cuttingGuides: {
                                outerCuttingLines: true,
                                betweenImages: true,
                                cornerMarks: true,
                                gridHelperLines: false
                            }
                        }
                    };
                }

                // Get max photos per page from current config
                const maxPhotosPerPage = window.converter.printData.maxPhotosPerPage || 10;

                if (isDuplex) {
                    // ===== DUPLEX MODE =====
                    console.log(`📄 Setting up DUPLEX mode (${maxPhotosPerPage} photos/page)`);

                    window.converter.printData.isDuplexMode = true;
                    window.converter.printData.frontImages = {};
                    window.converter.printData.backImages = {};
                    window.converter.printData.selectedImages = [];

                    // Populate front images theo format của Print Section
                    frontImageObjects.forEach((imgObj, idx) => {
                        const pageNum = Math.floor(idx / maxPhotosPerPage);
                        const slotNum = idx % maxPhotosPerPage;

                        if (!window.converter.printData.frontImages[pageNum]) {
                            window.converter.printData.frontImages[pageNum] = {};
                        }
                        window.converter.printData.frontImages[pageNum][slotNum] = imgObj;
                    });

                    // Populate back images
                    backImageObjects.forEach((imgObj, idx) => {
                        const pageNum = Math.floor(idx / maxPhotosPerPage);
                        const slotNum = idx % maxPhotosPerPage;

                        if (!window.converter.printData.backImages[pageNum]) {
                            window.converter.printData.backImages[pageNum] = {};
                        }
                        window.converter.printData.backImages[pageNum][slotNum] = imgObj;
                    });

                    // Calculate total pages
                    const totalPages = Math.max(
                        Math.ceil(frontImageObjects.length / maxPhotosPerPage),
                        Math.ceil(backImageObjects.length / maxPhotosPerPage)
                    );
                    window.converter.printData.totalPages = totalPages;

                    console.log(`✅ Duplex data ready:`, {
                        totalPages,
                        frontPages: Object.keys(window.converter.printData.frontImages).length,
                        backPages: Object.keys(window.converter.printData.backImages).length
                    });

                } else {
                    // ===== SIMPLEX MODE =====
                    console.log(`📄 Setting up SIMPLEX mode`);

                    window.converter.printData.isDuplexMode = false;
                    window.converter.printData.selectedImages = frontImageObjects;
                    window.converter.printData.frontImages = {};
                    window.converter.printData.backImages = {};

                    const totalPages = Math.ceil(frontImageObjects.length / maxPhotosPerPage);
                    window.converter.printData.totalPages = totalPages;

                    console.log(`✅ Simplex data ready:`, {
                        totalPages,
                        images: frontImageObjects.length
                    });
                }

                // ===== GỌI UPDATE PREVIEW CỦA PRINT SECTION =====
                this.updateProgress(70, 'Đang render preview...');
                console.log(`🖼️ Calling Print Section updatePreview()...`);

                try {
                    window.converter.updatePreview();
                    console.log('✅ Preview updated successfully');
                } catch (error) {
                    console.error('⚠️ Error updating preview:', error);
                    // Continue anyway - preview might work during export
                }

                // Store print pages info
                this.printPages = {
                    ready: true,
                    isDuplex: isDuplex,
                    totalPages: window.converter.printData.totalPages,
                    maxPhotosPerPage: maxPhotosPerPage,
                    frontCount: frontImageObjects.length,
                    backCount: backImageObjects.length
                };

                console.log(`✅ Auto layout complete using Print Section`);
                this.updateProgress(80, `Đã tạo ${this.printPages.totalPages} trang in`);
            }

            // Helper: Load image objects with proper structure
            async loadImageObjects(files) {
                const imageObjects = [];

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];

                    try {
                        const imgObj = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                const img = new Image();
                                img.onload = () => {
                                    resolve({
                                        file: file,
                                        src: e.target.result,
                                        dataUrl: e.target.result,
                                        img: img,
                                        name: file.name,
                                        id: `auto_${Date.now()}_${i}`
                                    });
                                };
                                img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
                                img.src = e.target.result;
                            };
                            reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
                            reader.readAsDataURL(file);
                        });

                        imageObjects.push(imgObj);
                    } catch (error) {
                        console.error(`❌ Error loading ${file.name}:`, error);
                    }
                }

                console.log(`✅ Loaded ${imageObjects.length}/${files.length} images`);
                return imageObjects;
            }

            // Perform auto export - DÙNG PRINT SECTION METHODS
            async performAutoExport() {
                this.updateProgress(85, 'Đang xuất file JPG 100% với Print Section...');

                if (!this.printPages || !this.printPages.ready) {
                    console.warn('⚠️ No print pages ready for export');
                    return;
                }

                if (!window.converter) {
                    throw new Error('❌ Print Section not available');
                }

                this.exportedFiles = [];
                const { isDuplex, totalPages } = this.printPages;

                console.log(`📤 Exporting ${isDuplex ? 'DUPLEX' : 'SIMPLEX'} mode, ${totalPages} pages`);

                try {
                    if (isDuplex) {
                        // ===== EXPORT DUPLEX MODE =====
                        await this.exportDuplexPages(totalPages);
                    } else {
                        // ===== EXPORT SIMPLEX MODE =====
                        await this.exportSimplexPages(totalPages);
                    }

                    console.log(`✅ Export complete: ${this.exportedFiles.length} files`);
                    this.updateProgress(100, `Hoàn thành! ${this.exportedFiles.length} file JPG`);

                } catch (error) {
                    console.error('❌ Export error:', error);
                    throw error;
                }
            }

            // Export Duplex Pages using Print Section
            async exportDuplexPages(totalPages) {
                for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
                    const pageNum = String(pageIndex + 1).padStart(3, '0');

                    // ===== EXPORT FRONT PAGE =====
                    try {
                        console.log(`📄 Generating front page ${pageIndex + 1}...`);
                        const frontCanvas = await window.converter.generateMasterCanvas(pageIndex);

                        if (frontCanvas) {
                            const frontBlob = await this.canvasToJPGBlob(frontCanvas);
                            this.exportedFiles.push({
                                blob: frontBlob,
                                filename: `Print_Page_${pageNum}_Front.jpg`,
                                side: 'front',
                                pageNumber: pageIndex + 1
                            });
                            console.log(`✅ Front page ${pageIndex + 1} exported`);
                        }
                    } catch (error) {
                        console.error(`❌ Error exporting front page ${pageIndex + 1}:`, error);
                    }

                    // ===== EXPORT BACK PAGE =====
                    try {
                        console.log(`📄 Generating back page ${pageIndex + 1}...`);
                        const backCanvas = await window.converter.generateMasterCanvasBack(pageIndex);

                        if (backCanvas) {
                            const backBlob = await this.canvasToJPGBlob(backCanvas);
                            this.exportedFiles.push({
                                blob: backBlob,
                                filename: `Print_Page_${pageNum}_Back.jpg`,
                                side: 'back',
                                pageNumber: pageIndex + 1
                            });
                            console.log(`✅ Back page ${pageIndex + 1} exported`);
                        }
                    } catch (error) {
                        console.error(`❌ Error exporting back page ${pageIndex + 1}:`, error);
                    }

                    // Update progress
                    const progress = 85 + Math.round((pageIndex / totalPages) * 15);
                    this.updateProgress(progress, `Đã xuất trang ${pageIndex + 1}/${totalPages}...`);
                }
            }

            // Export Simplex Pages using Print Section
            async exportSimplexPages(totalPages) {
                for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
                    const pageNum = String(pageIndex + 1).padStart(3, '0');

                    try {
                        console.log(`📄 Generating page ${pageIndex + 1}...`);
                        const canvas = await window.converter.generateMasterCanvas(pageIndex);

                        if (canvas) {
                            const blob = await this.canvasToJPGBlob(canvas);
                            this.exportedFiles.push({
                                blob: blob,
                                filename: `Print_Page_${pageNum}.jpg`,
                                side: 'simplex',
                                pageNumber: pageIndex + 1
                            });
                            console.log(`✅ Page ${pageIndex + 1} exported`);
                        }
                    } catch (error) {
                        console.error(`❌ Error exporting page ${pageIndex + 1}:`, error);
                    }

                    // Update progress
                    const progress = 85 + Math.round((pageIndex / totalPages) * 15);
                    this.updateProgress(progress, `Đã xuất trang ${pageIndex + 1}/${totalPages}...`);
                }
            }

            // Convert canvas to JPG blob with DPI metadata
            async canvasToJPGBlob(canvas) {
                return new Promise((resolve) => {
                    canvas.toBlob(async (blob) => {
                        // Add DPI metadata using Print Section method
                        if (window.converter && typeof window.converter.addDPIMetadata === 'function') {
                            try {
                                const enhancedBlob = await window.converter.addDPIMetadata(blob, 300);
                                resolve(enhancedBlob);
                            } catch (error) {
                                console.warn('⚠️ Could not add DPI metadata:', error);
                                resolve(blob);
                            }
                        } else {
                            resolve(blob);
                        }
                    }, 'image/jpeg', 1.0); // 100% quality
                });
            }

            // Download all exported files
            downloadExportedFiles() {
                if (!this.exportedFiles || this.exportedFiles.length === 0) {
                    alert('Không có file nào để tải!');
                    return;
                }

                // Download each file
                this.exportedFiles.forEach(({ blob, filename }) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                });

                console.log(`📥 Downloaded ${this.exportedFiles.length} files`);
            }

            // Show success screen
            showSuccess() {
                const progressSection = document.getElementById('apProgressSection');
                const successSection = document.getElementById('apSuccessSection');

                if (progressSection) progressSection.style.display = 'none';
                if (successSection) successSection.style.display = 'block';

                this.updateStatus('✅ Hoàn thành!');

                // Update success stats
                const successStats = document.getElementById('apSuccessStats');
                if (successStats) {
                    successStats.innerHTML = `
                        <div style="display: flex; gap: 32px; justify-content: center;">
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: 700; color: var(--primary);">${this.analyzedFiles.length}</div>
                                <div style="font-size: 14px; color: var(--text-secondary);">Ảnh đã xử lý</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: 700; color: var(--primary);">${this.printPages.length}</div>
                                <div style="font-size: 14px; color: var(--text-secondary);">Trang in</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: 700; color: var(--primary);">${this.exportedFiles.length}</div>
                                <div style="font-size: 14px; color: var(--text-secondary);">File JPG</div>
                            </div>
                        </div>
                    `;
                }

                // Setup download button
                const downloadBtn = document.getElementById('apDownloadBtn');
                if (downloadBtn) {
                    downloadBtn.onclick = () => this.downloadExportedFiles();
                }
            }

            // Update progress
            updateProgress(percentage, message) {
                const progressFill = document.getElementById('apProgressFill');
                const progressPercent = document.getElementById('apProgressPercent');
                const progressSteps = document.getElementById('apProgressSteps');

                if (progressFill) progressFill.style.width = percentage + '%';
                if (progressPercent) progressPercent.textContent = percentage + '%';

                if (progressSteps && message) {
                    progressSteps.innerHTML = `
                        <div class="progress-step">
                            <div class="step-icon">${percentage === 100 ? '✅' : '⏳'}</div>
                            <div class="step-text">${message}</div>
                        </div>
                    `;
                }
            }

            // Update status badge
            updateStatus(status) {
                const statusBadge = document.getElementById('autoPrintStatus');
                if (statusBadge) statusBadge.textContent = status;
            }

            // Reset UI
            resetUI() {
                const analysisStep = document.getElementById('apAnalysisStep');
                const configStep = document.getElementById('apConfigStep');
                const progressSection = document.getElementById('apProgressSection');
                const successSection = document.getElementById('apSuccessSection');
                const folderInfo = document.getElementById('apFolderInfo');
                const startBtn = document.getElementById('apStartBtn');
                const resetBtn = document.getElementById('apResetBtn');

                if (analysisStep) analysisStep.style.display = 'none';
                if (configStep) configStep.style.display = 'none';
                if (progressSection) progressSection.style.display = 'none';
                if (successSection) successSection.style.display = 'none';
                if (folderInfo) folderInfo.style.display = 'none';
                if (startBtn) startBtn.style.display = 'none';
                if (resetBtn) resetBtn.style.display = 'none';

                this.updateStatus('⚪ Chưa khởi động');
            }

            // Reset everything
            reset() {
                this.selectedFolder = null;
                this.files = [];
                this.analyzedFiles = [];
                this.classifiedImages = null;
                this.printPages = [];
                this.exportedFiles = [];
                this.isProcessing = false;
                this.resetUI();
                console.log('🔄 Auto Print reset');
            }

            // Utility: delay
            delay(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
        }

        // Initialize Auto Print Section when page loads
        window.addEventListener('load', () => {
            window.autoPrint = new AutoPrintSection();
            console.log('✅ Auto Print Section loaded');
        });
