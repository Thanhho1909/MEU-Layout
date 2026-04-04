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
                            },
                            printLabel: {
                                enabled: false,
                                text: '',
                                usePerPageText: false,
                                pageTexts: {},
                                corner: 'tl',
                                fontMm: 3,
                                extraInsetMm: 1,
                                color: '#111827'
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

        // ===== A4 TEST PRINT SECTION =====
        class A4TestPrintSection {
            constructor() {
                this.images = [];
                this.canvas = null;
                this.ctx = null;
                this.spacing = 8; // mm
                this.a4Width = 210; // mm
                this.a4Height = 297; // mm
                this.dpi = 300;
                this.pixelsPerMm = this.dpi / 25.4;
                this.canvasWidth = this.a4Width * this.pixelsPerMm;
                this.canvasHeight = this.a4Height * this.pixelsPerMm;
                this.listenersSetup = false; // Flag to prevent duplicate event listeners
            }

            init() {
                if (this.listenersSetup) {
                    console.log('📄 A4 Test Print Section already initialized');
                    return; // Already initialized, skip
                }
                console.log('📄 Initializing A4 Test Print Section...');
                this.setupEventListeners();
                this.setupCanvas();
                this.listenersSetup = true;
            }

            setupEventListeners() {
                // Only setup once
                if (this.listenersSetup) {
                    return;
                }

                const uploadZone = document.getElementById('a4UploadZone');
                const fileInput = document.getElementById('a4FileInput');
                const spacingInput = document.getElementById('a4Spacing');
                const regenerateBtn = document.getElementById('a4RegenerateBtn');
                const clearBtn = document.getElementById('a4ClearBtn');
                const exportBtn = document.getElementById('a4ExportBtn');

                // Upload zone click and drag-drop handlers
                if (uploadZone && fileInput) {
                    uploadZone.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        fileInput.click();
                    });
                    
                    uploadZone.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        uploadZone.classList.add('dragover');
                    });
                    
                    uploadZone.addEventListener('dragleave', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        uploadZone.classList.remove('dragover');
                    });
                    
                    uploadZone.addEventListener('drop', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        uploadZone.classList.remove('dragover');
                        if (e.dataTransfer && e.dataTransfer.files.length > 0) {
                            this.handleFiles(e.dataTransfer.files);
                        }
                    });
                }

                // File input change handler
                if (fileInput) {
                    fileInput.addEventListener('change', (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            this.handleFiles(e.target.files);
                            // Reset input value to allow selecting same files again
                            setTimeout(() => {
                                e.target.value = '';
                            }, 100);
                        }
                    });
                }

                // Spacing input
                if (spacingInput) {
                    spacingInput.addEventListener('change', (e) => {
                        this.spacing = parseFloat(e.target.value) || 8;
                        if (this.images.length > 0) {
                            this.generateLayout();
                        }
                    });
                }

                // Regenerate button
                if (regenerateBtn) {
                    regenerateBtn.addEventListener('click', () => {
                        if (this.images.length > 0) {
                            this.generateLayout();
                        }
                    });
                }

                // Clear button
                if (clearBtn) {
                    clearBtn.addEventListener('click', () => {
                        this.clearAll();
                    });
                }

                // Export button
                if (exportBtn) {
                    exportBtn.addEventListener('click', () => {
                        this.exportToPNG();
                    });
                }
            }

            setupCanvas() {
                this.canvas = document.getElementById('a4PreviewCanvas');
                if (!this.canvas) return;

                this.canvas.width = this.canvasWidth;
                this.canvas.height = this.canvasHeight;
                this.ctx = this.canvas.getContext('2d');
                
                // Set canvas display size (for preview)
                const maxDisplayWidth = 800;
                const scale = maxDisplayWidth / this.canvasWidth;
                this.canvas.style.width = (this.canvasWidth * scale) + 'px';
                this.canvas.style.height = (this.canvasHeight * scale) + 'px';
            }

            async handleFiles(files) {
                const imageFiles = Array.from(files).filter(file => 
                    file.type.startsWith('image/')
                );

                if (imageFiles.length === 0) {
                    alert('Vui lòng chọn file ảnh hợp lệ!');
                    return;
                }

                console.log(`📷 Loading ${imageFiles.length} images...`);

                for (const file of imageFiles) {
                    try {
                        const imageData = await this.loadImage(file);
                        this.images.push(imageData);
                    } catch (error) {
                        console.error('Error loading image:', error);
                    }
                }

                if (this.images.length > 0) {
                    document.getElementById('a4PreviewSection').style.display = 'block';
                    this.generateLayout();
                }
            }

            loadImage(file) {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    const reader = new FileReader();

                    reader.onload = (e) => {
                        img.onload = () => {
                            // Get original dimensions in mm (assuming 300 DPI)
                            const originalWidthMm = (img.naturalWidth / this.pixelsPerMm);
                            const originalHeightMm = (img.naturalHeight / this.pixelsPerMm);

                            resolve({
                                file: file,
                                image: img,
                                originalWidth: img.naturalWidth,
                                originalHeight: img.naturalHeight,
                                originalWidthMm: originalWidthMm,
                                originalHeightMm: originalHeightMm,
                                aspectRatio: img.naturalWidth / img.naturalHeight,
                                name: file.name
                            });
                        };
                        img.onerror = reject;
                        img.src = e.target.result;
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }

            generateLayout() {
                if (!this.ctx || this.images.length === 0) return;

                // Clear canvas
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

                // Calculate layout
                const layout = this.calculateLayout();
                
                // Draw images - CRITICAL: iterate only through images.length
                // Items are created in same order as images, so items[i] = images[i]
                let renderedCount = 0;
                for (let i = 0; i < this.images.length; i++) {
                    if (i < layout.items.length) {
                        const item = layout.items[i];
                        const imageData = this.images[i];
                        this.drawImage(item, imageData);
                        renderedCount++;
                    }
                }
                
                // Verification: must render exactly images.length
                if (renderedCount !== this.images.length) {
                    console.error(`⚠️ Layout error: rendered ${renderedCount} images but expected ${this.images.length}`);
                } else {
                    console.log(`✅ Rendered exactly ${renderedCount} images (matches images.length)`);
                }
            }

            calculateLayout() {
                // A4 Test Print Layout Engine
                // Algorithm: Tìm scale LỚN NHẤT có thể để tất cả ảnh fit trong A4
                // 1. Dùng binary search để tìm scale lớn nhất
                // 2. Scale phải đảm bảo tất cả ảnh fit trong canvas với flow layout
                // 3. Ảnh hiển thị TO NHẤT CÓ THỂ (cùng tỉ lệ) miễn sao dàn đủ trong A4
                // 4. Tận dụng tối đa không gian A4
                // 5. Never duplicate: always loop for (let i = 0; i < images.length; i++)

                // Giảm margin tối thiểu để tận dụng TỐI ĐA không gian A4
                const margin = 2 * this.pixelsPerMm; // 2mm margin tối thiểu
                const gap = this.spacing * this.pixelsPerMm; // Fixed gap between images
                const availableWidth = this.canvasWidth - (margin * 2);
                const availableHeight = this.canvasHeight - (margin * 2);

                const numImages = this.images.length;
                
                if (numImages === 0) return { items: [], scale: 0 };
                
                // Tìm scale lớn nhất có thể bằng binary search
                const maxScale = this.findMaximumScale(availableWidth, availableHeight, gap, margin);
                
                // Apply flow layout with the maximum scale
                return this.applyFlowLayout(maxScale, availableWidth, availableHeight, gap, margin);
            }

            findMaximumScale(availableWidth, availableHeight, gap, margin) {
                // Tìm scale lớn nhất có thể để tất cả ảnh fit trong A4 và tận dụng tối đa không gian
                
                // Tính scale tối đa cho từng ảnh riêng lẻ
                let individualMaxScale = Infinity;
                for (let i = 0; i < this.images.length; i++) {
                    const img = this.images[i];
                    const scaleX = availableWidth / img.originalWidth;
                    const scaleY = availableHeight / img.originalHeight;
                    const imgMaxScale = Math.min(scaleX, scaleY);
                    individualMaxScale = Math.min(individualMaxScale, imgMaxScale);
                }

                // Binary search với độ chính xác CAO để tìm scale LỚN NHẤT có thể
                // Mục tiêu: Tận dụng TỐI ĐA không gian A4
                let minScale = 0;
                let maxScale = individualMaxScale * 1.5; // Start much higher to find true maximum
                let bestScale = 0;
                let bestLayout = null;
                const iterations = 150; // Tăng iterations để tìm scale chính xác nhất
                const precision = 0.00001; // Độ chính xác rất cao

                for (let iteration = 0; iteration < iterations; iteration++) {
                    const testScale = (minScale + maxScale) / 2;
                    const layout = this.tryFlowLayout(testScale, availableWidth, availableHeight, gap, margin);
                    
                    if (layout && layout.fits && layout.items.length === this.images.length) {
                        // Scale này fit, thử scale lớn hơn để tận dụng tối đa
                        minScale = testScale;
                        if (testScale > bestScale) {
                            bestScale = testScale;
                            bestLayout = layout;
                        }
                        
                        // Nếu đã đạt độ chính xác mong muốn, dừng lại
                        if (maxScale - minScale < precision) {
                            break;
                        }
                    } else {
                        // Scale này không fit, thử scale nhỏ hơn
                        maxScale = testScale;
                    }
                }

                // Sau khi tìm được scale tốt, thử tăng thêm để TẬN DỤNG TỐI ĐA
                // Fine-tuning: Tăng scale từng bước nhỏ cho đến khi không fit
                if (bestScale > 0 && bestLayout && bestLayout.fits) {
                    // Bước 1: Tăng scale với bước lớn hơn (0.5%) để tìm nhanh
                    let fineTuneScale = bestScale;
                    for (let fineTune = 0; fineTune < 100; fineTune++) {
                        const testFineScale = fineTuneScale * 1.005; // Tăng 0.5%
                        const fineLayout = this.tryFlowLayout(testFineScale, availableWidth, availableHeight, gap, margin);
                        if (fineLayout && fineLayout.fits && fineLayout.items.length === this.images.length) {
                            fineTuneScale = testFineScale;
                            bestLayout = fineLayout;
                        } else {
                            break; // Không fit nữa, dừng lại
                        }
                    }
                    
                    // Bước 2: Tinh chỉnh với bước nhỏ hơn (0.01%) để đạt độ chính xác cao
                    for (let fineTune = 0; fineTune < 200; fineTune++) {
                        const testFineScale = fineTuneScale * 1.0001; // Tăng 0.01%
                        const fineLayout = this.tryFlowLayout(testFineScale, availableWidth, availableHeight, gap, margin);
                        if (fineLayout && fineLayout.fits && fineLayout.items.length === this.images.length) {
                            fineTuneScale = testFineScale;
                            bestLayout = fineLayout;
                        } else {
                            break; // Không fit nữa, dừng lại
                        }
                    }
                    
                    bestScale = fineTuneScale;
                }

                // Nếu chưa tìm được scale tốt, thử lại với scale nhỏ hơn một chút
                if (bestScale === 0 || !bestLayout || !bestLayout.fits) {
                    // Fallback: thử với scale nhỏ hơn
                    const fallbackScale = individualMaxScale * 0.8;
                    const fallbackLayout = this.tryFlowLayout(fallbackScale, availableWidth, availableHeight, gap, margin);
                    if (fallbackLayout && fallbackLayout.fits) {
                        bestScale = fallbackScale;
                        bestLayout = fallbackLayout;
                    }
                }

                // Tính toán mức độ tận dụng không gian
                let spaceUsed = 0;
                let maxY = margin;
                let minY = availableHeight + margin;
                if (bestLayout && bestLayout.items.length > 0) {
                    bestLayout.items.forEach(item => {
                        spaceUsed += item.width * item.height;
                        maxY = Math.max(maxY, item.y + item.height);
                        minY = Math.min(minY, item.y);
                    });
                }
                const totalAvailable = availableWidth * availableHeight;
                const utilization = (spaceUsed / totalAvailable) * 100;
                const heightUtilization = ((maxY - margin) / availableHeight) * 100;

                console.log(`📐 Maximum scale search (TẬN DỤNG TỐI ĐA A4):
  Total images: ${this.images.length}
  Individual max scale: ${individualMaxScale.toFixed(4)}
  Found maximum scale: ${bestScale.toFixed(4)}
  Layout fits: ${bestLayout ? bestLayout.fits : false}
  Space utilization: ${utilization.toFixed(1)}%
  Height utilization: ${heightUtilization.toFixed(1)}%
  Max Y position: ${maxY.toFixed(1)} / ${(availableHeight + margin).toFixed(1)}
  Available height: ${availableHeight.toFixed(1)}px`);

                return bestScale > 0 ? bestScale : individualMaxScale * 0.5; // Fallback
            }

            tryFlowLayout(scale, availableWidth, availableHeight, gap, margin) {
                // Flow layout: place images row by row, left to right
                // When row is full, move to next row
                // Returns layout result with fits flag
                // TẤT CẢ ẢNH DÙNG CÙNG MỘT SCALE để đảm bảo tỉ lệ đồng nhất
                const items = [];
                let currentX = margin;
                let currentY = margin;
                let rowHeight = 0;
                const maxHeight = availableHeight + margin; // Maximum allowed height

                // CRITICAL: Iterate through ALL images exactly once
                // TẤT CẢ ẢNH được scale với cùng một giá trị scale
                for (let i = 0; i < this.images.length; i++) {
                    const img = this.images[i];
                    
                    // Calculate scaled dimensions (maintain aspect ratio)
                    // CÙNG SCALE cho tất cả ảnh
                    const width = img.originalWidth * scale;
                    const height = img.originalHeight * scale;

                    // Check if this image fits in current row
                    const wouldExceedWidth = (currentX + width) > (availableWidth + margin);
                    
                    if (wouldExceedWidth && currentX > margin) {
                        // Current row is full, move to next row
                        currentY += rowHeight + gap;
                        currentX = margin;
                        rowHeight = 0;
                    }

                    // Check if we exceed available height - CHÍNH XÁC HƠN
                    // Phải đảm bảo ảnh hoàn toàn nằm trong bounds
                    if (currentY + height > maxHeight) {
                        // Doesn't fit - vượt quá chiều cao cho phép
                        return {
                            items: items,
                            scale: scale,
                            fits: false,
                            maxY: currentY + rowHeight
                        };
                    }

                    // Place this image (cùng scale với tất cả ảnh khác)
                    items.push({
                        x: currentX,
                        y: currentY,
                        width: width,
                        height: height,
                        scale: scale // CÙNG SCALE cho tất cả
                    });

                    // Update position for next image
                    currentX += width + gap;
                    rowHeight = Math.max(rowHeight, height);
                }

                // Verify: must have exactly images.length items
                if (items.length !== this.images.length) {
                    return {
                        items: [],
                        scale: scale,
                        fits: false,
                        maxY: currentY + rowHeight
                    };
                }

                // Calculate actual space used
                const actualMaxY = currentY + rowHeight;
                const heightUsed = actualMaxY - margin;

                return {
                    items: items,
                    scale: scale,
                    fits: true,
                    maxY: actualMaxY,
                    heightUsed: heightUsed,
                    heightUtilization: (heightUsed / availableHeight) * 100
                };
            }

            applyFlowLayout(scale, availableWidth, availableHeight, gap, margin) {
                // Apply flow layout with given scale
                const layout = this.tryFlowLayout(scale, availableWidth, availableHeight, gap, margin);
                
                if (!layout.fits || layout.items.length !== this.images.length) {
                    console.warn(`⚠️ Layout doesn't fit with scale ${scale.toFixed(4)}`);
                    // Try with slightly reduced scale
                    const reducedScale = scale * 0.95;
                    if (reducedScale > 0.001) {
                        return this.applyFlowLayout(reducedScale, availableWidth, availableHeight, gap, margin);
                    }
                }

                console.log(`✅ Flow layout complete: ${layout.items.length} images placed with scale ${scale.toFixed(4)}`);

                return layout;
            }

            drawImage(item, imageData) {
                const { x, y, width, height } = item;

                // Draw border
                this.ctx.strokeStyle = '#9ca3af';
                this.ctx.lineWidth = Math.max(1, 0.5 * this.pixelsPerMm);
                this.ctx.strokeRect(x, y, width, height);

                // Draw image
                this.ctx.drawImage(imageData.image, x, y, width, height);
            }

            exportToPNG() {
                if (!this.canvas) {
                    alert('Không có canvas để xuất!');
                    return;
                }

                // Create a new canvas at full resolution
                const exportCanvas = document.createElement('canvas');
                exportCanvas.width = this.canvasWidth;
                exportCanvas.height = this.canvasHeight;
                const exportCtx = exportCanvas.getContext('2d');

                // Redraw everything at full resolution
                exportCtx.fillStyle = '#ffffff';
                exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

                // Recalculate layout with current settings
                const layout = this.calculateLayout();
                
                // Draw images - CRITICAL: iterate only through images.length
                // Items are created in same order as images, so items[i] = images[i]
                for (let i = 0; i < this.images.length; i++) {
                    if (i < layout.items.length) {
                        const item = layout.items[i];
                        const imageData = this.images[i];
                        const { x, y, width, height } = item;

                        // Draw border
                        exportCtx.strokeStyle = '#9ca3af';
                        exportCtx.lineWidth = Math.max(1, 0.5 * this.pixelsPerMm);
                        exportCtx.strokeRect(x, y, width, height);

                        // Draw image
                        exportCtx.drawImage(imageData.image, x, y, width, height);
                    }
                }

                // Convert to blob and download
                exportCanvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `A4-Test-Print-${new Date().getTime()}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    console.log('✅ Exported A4 Test Print PNG');
                }, 'image/png', 1.0);
            }

            clearAll() {
                this.images = [];
                if (this.ctx) {
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
                }
                document.getElementById('a4PreviewSection').style.display = 'none';
                document.getElementById('a4FileInput').value = '';
            }
        }

        // Initialize A4 Test Print Section when page loads
        window.addEventListener('load', () => {
            window.a4TestPrint = new A4TestPrintSection();
            window.a4TestPrint.init();
            console.log('✅ A4 Test Print Section loaded');
        });
