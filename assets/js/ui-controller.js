        class SK316CalibrationSystem {
            constructor() {
                this.profiles = [];
                this.currentProfile = null;
                this.currentGridSize = { rows: 5, cols: 5 };
                this.currentCardSize = '90x54';
                this.offsetData = {};

                this.loadProfilesFromStorage();
                this.init();
            }

            init() {
                console.log('🎯 Khởi tạo SK316 Calibration System');

                // Setup event listeners
                this.setupEventListeners();

                // Generate initial table
                this.generateInputTable();

                // Render profiles list
                this.renderProfilesList();

                // Update UI
                this.updateUI();
            }

            setupEventListeners() {
                // Grid size change
                const gridSizeSelect = document.getElementById('sk316GridSize');
                if (gridSizeSelect) {
                    gridSizeSelect.addEventListener('change', (e) => {
                        const [rows, cols] = e.target.value.split('x').map(Number);
                        this.currentGridSize = { rows, cols };
                        this.generateInputTable();
                        this.updateHeatmap();
                    });
                }

                // Card size change
                const cardSizeSelect = document.getElementById('sk316CardSize');
                if (cardSizeSelect) {
                    cardSizeSelect.addEventListener('change', (e) => {
                        this.currentCardSize = e.target.value;
                    });
                }

                // Generate test sheet
                const generateBtn = document.getElementById('sk316GenerateBtn');
                if (generateBtn) {
                    generateBtn.addEventListener('click', () => this.generateTestSheet());
                }

                // Reset table
                const resetBtn = document.getElementById('sk316ResetTableBtn');
                if (resetBtn) {
                    resetBtn.addEventListener('click', () => this.resetTable());
                }

                // Fill zero
                const fillZeroBtn = document.getElementById('sk316FillZeroBtn');
                if (fillZeroBtn) {
                    fillZeroBtn.addEventListener('click', () => this.fillZero());
                }

                // Save profile
                const saveBtn = document.getElementById('sk316SaveBtn');
                if (saveBtn) {
                    saveBtn.addEventListener('click', () => this.saveProfile());
                }

                // Export JSON
                const exportBtn = document.getElementById('sk316ExportBtn');
                if (exportBtn) {
                    exportBtn.addEventListener('click', () => this.exportProfile());
                }

                // Import JSON
                const importBtn = document.getElementById('sk316ImportBtn');
                if (importBtn) {
                    importBtn.addEventListener('click', () => this.importProfile());
                }

                // New profile
                const newBtn = document.getElementById('sk316NewProfileBtn');
                if (newBtn) {
                    newBtn.addEventListener('click', () => this.newProfile());
                }

                // Profile select
                const profileSelect = document.getElementById('sk316ProfileSelect');
                if (profileSelect) {
                    profileSelect.addEventListener('change', (e) => {
                        this.loadProfile(e.target.value);
                    });
                }

                // Gutter Test Event Listeners
                this.setupGutterTestListeners();
            }

            setupGutterTestListeners() {
                // Update gutter test preview when range changes
                const gutterMin = document.getElementById('gutterMin');
                const gutterMax = document.getElementById('gutterMax');
                const gutterStep = document.getElementById('gutterStep');

                [gutterMin, gutterMax, gutterStep].forEach(input => {
                    if (input) {
                        input.addEventListener('input', () => this.updateGutterTestPreview());
                    }
                });

                // Generate gutter tests button
                const generateGutterTestsBtn = document.getElementById('generateGutterTestsBtn');
                if (generateGutterTestsBtn) {
                    generateGutterTestsBtn.addEventListener('click', () => this.generateGutterTests());
                }

                // Change gutter button
                const changeGutterBtn = document.getElementById('changeGutterBtn');
                if (changeGutterBtn) {
                    changeGutterBtn.addEventListener('click', () => {
                        document.getElementById('gutterSelectionSection').style.display = 'block';
                        document.getElementById('selectedGutterDisplay').style.display = 'none';
                    });
                }
            }

            updateGutterTestPreview() {
                const min = parseFloat(document.getElementById('gutterMin').value) || 0;
                const max = parseFloat(document.getElementById('gutterMax').value) || 0;
                const step = parseFloat(document.getElementById('gutterStep').value) || 0.1;

                if (min >= max || step <= 0) {
                    document.getElementById('gutterTestPreview').innerHTML =
                        '⚠️ <strong>Giá trị không hợp lệ</strong>';
                    return;
                }

                const values = [];
                for (let v = min; v <= max; v += step) {
                    values.push(v.toFixed(1) + 'mm');
                }

                const count = values.length;
                const valueList = values.join(', ');

                document.getElementById('gutterTestPreview').innerHTML =
                    `→ Sẽ tạo <strong>${count} test sheets</strong>: ${valueList}`;
            }

            generateInputTable() {
                const tbody = document.getElementById('sk316TableBody');
                if (!tbody) return;

                tbody.innerHTML = '';

                const { rows, cols } = this.currentGridSize;
                let cellIndex = 1;

                for (let r = 1; r <= rows; r++) {
                    for (let c = 1; c <= cols; c++) {
                        const key = `r${r}c${c}`;
                        const tr = document.createElement('tr');

                        tr.innerHTML = `
                            <td>${key}</td>
                            <td>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="-5"
                                    max="5"
                                    value="0.0"
                                    data-key="${key}"
                                    data-axis="x"
                                    class="sk316-offset-input"
                                >
                            </td>
                            <td>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="-5"
                                    max="5"
                                    value="0.0"
                                    data-key="${key}"
                                    data-axis="y"
                                    class="sk316-offset-input"
                                >
                            </td>
                        `;

                        tbody.appendChild(tr);
                        cellIndex++;
                    }
                }

                // Add change listeners
                tbody.querySelectorAll('.sk316-offset-input').forEach(input => {
                    input.addEventListener('input', () => {
                        this.updateOffsetData();
                        this.updateHeatmap();
                        this.updateStatistics();
                    });
                });

                console.log(`✅ Đã tạo input table ${rows}×${cols}`);
            }

            updateOffsetData() {
                this.offsetData = {};

                document.querySelectorAll('.sk316-offset-input').forEach(input => {
                    const key = input.dataset.key;
                    const axis = input.dataset.axis;
                    const value = parseFloat(input.value) || 0;

                    if (!this.offsetData[key]) {
                        this.offsetData[key] = { x: 0, y: 0 };
                    }

                    this.offsetData[key][axis] = value;
                });
            }

            resetTable() {
                document.querySelectorAll('.sk316-offset-input').forEach(input => {
                    input.value = '0.0';
                });
                this.updateOffsetData();
                this.updateHeatmap();
                this.updateStatistics();
                this.showToast('↺ Đã reset tất cả về 0', 'info');
            }

            fillZero() {
                this.resetTable();
            }

            updateHeatmap() {
                const heatmapDiv = document.getElementById('sk316Heatmap');
                if (!heatmapDiv) return;

                const { rows, cols } = this.currentGridSize;
                heatmapDiv.className = `sk316-heatmap grid-${rows}x${cols}`;
                heatmapDiv.innerHTML = '';

                // Calculate max offset for color scaling
                const offsets = Object.values(this.offsetData);
                const maxOffset = Math.max(...offsets.map(o => Math.sqrt(o.x * o.x + o.y * o.y)), 0.01);

                for (let r = 1; r <= rows; r++) {
                    for (let c = 1; c <= cols; c++) {
                        const key = `r${r}c${c}`;
                        const offset = this.offsetData[key] || { x: 0, y: 0 };
                        const magnitude = Math.sqrt(offset.x * offset.x + offset.y * offset.y);

                        // Color: green (low) → yellow → red (high)
                        const ratio = magnitude / maxOffset;
                        let color;
                        if (ratio < 0.5) {
                            // Green to yellow
                            const r = Math.round(34 + (245 - 34) * (ratio * 2));
                            color = `rgb(${r}, 197, 94)`;
                        } else {
                            // Yellow to red
                            const g = Math.round(197 - (197 - 68) * ((ratio - 0.5) * 2));
                            color = `rgb(239, ${g}, 68)`;
                        }

                        const cell = document.createElement('div');
                        cell.className = 'heatmap-cell';
                        cell.style.background = color;
                        cell.textContent = magnitude.toFixed(2);
                        cell.title = `${key}: X=${offset.x.toFixed(2)}mm, Y=${offset.y.toFixed(2)}mm`;

                        heatmapDiv.appendChild(cell);
                    }
                }
            }

            updateStatistics() {
                const offsets = Object.values(this.offsetData);
                if (offsets.length === 0) return;

                const avgX = offsets.reduce((sum, o) => sum + o.x, 0) / offsets.length;
                const avgY = offsets.reduce((sum, o) => sum + o.y, 0) / offsets.length;
                const maxOffset = Math.max(...offsets.map(o => Math.sqrt(o.x * o.x + o.y * o.y)));

                const avgXEl = document.getElementById('sk316AvgX');
                const avgYEl = document.getElementById('sk316AvgY');
                const maxEl = document.getElementById('sk316MaxOffset');

                if (avgXEl) avgXEl.textContent = `${avgX.toFixed(2)}mm`;
                if (avgYEl) avgYEl.textContent = `${avgY.toFixed(2)}mm`;
                if (maxEl) maxEl.textContent = `${maxOffset.toFixed(2)}mm`;
            }

            generateTestSheet() {
                console.log('🖨️ Tạo test sheet...');

                const { rows, cols } = this.currentGridSize;
                const [cardW, cardH] = this.currentCardSize.split('x').map(Number);

                // A4 size at 300 DPI
                const dpi = 300;
                const a4WidthMm = 210;
                const a4HeightMm = 297;
                const a4WidthPx = (a4WidthMm / 25.4) * dpi;
                const a4HeightPx = (a4HeightMm / 25.4) * dpi;

                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = a4WidthPx;
                canvas.height = a4HeightPx;
                const ctx = canvas.getContext('2d');

                // White background
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Card dimensions in pixels
                const cardWidthPx = (cardW / 25.4) * dpi;
                const cardHeightPx = (cardH / 25.4) * dpi;

                // Calculate grid layout
                const margin = 20 * (dpi / 25.4); // 20mm margin
                const availableWidth = a4WidthPx - (2 * margin);
                const availableHeight = a4HeightPx - (2 * margin);

                const gutterX = (availableWidth - (cols * cardWidthPx)) / (cols - 1 || 1);
                const gutterY = (availableHeight - (rows * cardHeightPx)) / (rows - 1 || 1);

                // Draw grid
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.font = `${24 * (dpi / 72)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                let cellNum = 1;
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const x = margin + c * (cardWidthPx + gutterX);
                        const y = margin + r * (cardHeightPx + gutterY);

                        // Draw card border
                        ctx.strokeRect(x, y, cardWidthPx, cardHeightPx);

                        // Draw crop marks
                        const markLen = 10 * (dpi / 25.4);
                        // Top-left
                        ctx.beginPath();
                        ctx.moveTo(x - markLen, y);
                        ctx.lineTo(x, y);
                        ctx.lineTo(x, y - markLen);
                        ctx.stroke();

                        // Top-right
                        ctx.beginPath();
                        ctx.moveTo(x + cardWidthPx + markLen, y);
                        ctx.lineTo(x + cardWidthPx, y);
                        ctx.lineTo(x + cardWidthPx, y - markLen);
                        ctx.stroke();

                        // Bottom-left
                        ctx.beginPath();
                        ctx.moveTo(x - markLen, y + cardHeightPx);
                        ctx.lineTo(x, y + cardHeightPx);
                        ctx.lineTo(x, y + cardHeightPx + markLen);
                        ctx.stroke();

                        // Bottom-right
                        ctx.beginPath();
                        ctx.moveTo(x + cardWidthPx + markLen, y + cardHeightPx);
                        ctx.lineTo(x + cardWidthPx, y + cardHeightPx);
                        ctx.lineTo(x + cardWidthPx, y + cardHeightPx + markLen);
                        ctx.stroke();

                        // Draw cell number
                        ctx.fillStyle = '#000';
                        const key = `r${r+1}c${c+1}`;
                        ctx.fillText(key, x + cardWidthPx / 2, y + cardHeightPx / 2);

                        cellNum++;
                    }
                }

                // Add title
                ctx.font = `bold ${32 * (dpi / 72)}px Arial`;
                ctx.fillText(`SK316 Test Sheet - ${this.currentCardSize}mm - ${rows}×${cols}`, a4WidthPx / 2, margin / 2);

                // Convert to JPG and download
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `SK316_TestSheet_${this.currentCardSize}_${rows}x${cols}.jpg`;
                    a.click();
                    URL.revokeObjectURL(url);

                    this.showToast('✅ Đã tải test sheet JPG', 'success');
                }, 'image/jpeg', 1.0); // 100% quality
            }

            async generateGutterTests() {
                console.log('🔧 Tạo Gutter Test Sheets...');

                const min = parseFloat(document.getElementById('gutterMin').value) || 0;
                const max = parseFloat(document.getElementById('gutterMax').value) || 0;
                const step = parseFloat(document.getElementById('gutterStep').value) || 0.1;

                const cardSizeSelect = document.getElementById('gutterTestCardSize');
                const gridSelect = document.getElementById('gutterTestGrid');
                const cardSize = cardSizeSelect ? cardSizeSelect.value : '90x54';
                const gridValue = gridSelect ? gridSelect.value : '3x5';

                if (min >= max || step <= 0) {
                    this.showToast('⚠️ Giá trị gutter range không hợp lệ', 'error');
                    return;
                }

                const [cardW, cardH] = cardSize.split('x').map(Number);
                const [rows, cols] = gridValue.split('x').map(Number);

                // Generate test values
                const gutterValues = [];
                for (let v = min; v <= max; v += step) {
                    gutterValues.push(parseFloat(v.toFixed(1)));
                }

                console.log(`Sẽ tạo ${gutterValues.length} test sheets:`, gutterValues);

                // Generate each test sheet
                for (const gutterMm of gutterValues) {
                    await this.generateSingleGutterTestSheet(cardW, cardH, rows, cols, gutterMm);
                    // Small delay between downloads
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                // Show gutter selection section
                this.showGutterSelectionOptions(gutterValues);

                this.showToast(`✅ Đã tạo ${gutterValues.length} gutter test sheets`, 'success');
            }

            generateSingleGutterTestSheet(cardW, cardH, rows, cols, gutterMm) {
                return new Promise((resolve) => {
                    console.log(`Tạo test sheet với gutter = ${gutterMm}mm`);

                    // A4 size at 300 DPI
                    const dpi = 300;
                    const a4WidthMm = 210;
                    const a4HeightMm = 297;
                    const a4WidthPx = (a4WidthMm / 25.4) * dpi;
                    const a4HeightPx = (a4HeightMm / 25.4) * dpi;

                    // Create canvas
                    const canvas = document.createElement('canvas');
                    canvas.width = a4WidthPx;
                    canvas.height = a4HeightPx;
                    const ctx = canvas.getContext('2d');

                    // White background
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Card dimensions in pixels
                    const cardWidthPx = (cardW / 25.4) * dpi;
                    const cardHeightPx = (cardH / 25.4) * dpi;

                    // Convert gutter from mm to px
                    const gutterPx = (gutterMm / 25.4) * dpi;

                    // Calculate layout with FIXED GUTTER
                    const totalCardsWidth = cols * cardWidthPx;
                    const totalGuttersWidth = (cols - 1) * gutterPx;
                    const totalCardsHeight = rows * cardHeightPx;
                    const totalGuttersHeight = (rows - 1) * gutterPx;

                    // Calculate margin to center the grid
                    const marginX = (a4WidthPx - totalCardsWidth - totalGuttersWidth) / 2;
                    const marginY = (a4HeightPx - totalCardsHeight - totalGuttersHeight) / 2;

                    // Draw grid
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.font = `${20 * (dpi / 72)}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    for (let r = 0; r < rows; r++) {
                        for (let c = 0; c < cols; c++) {
                            const x = marginX + c * (cardWidthPx + gutterPx);
                            const y = marginY + r * (cardHeightPx + gutterPx);

                            // Draw card border
                            ctx.strokeRect(x, y, cardWidthPx, cardHeightPx);

                            // Draw crop marks
                            const markLen = 10 * (dpi / 25.4);
                            ctx.lineWidth = 1;

                            // Top-left
                            ctx.beginPath();
                            ctx.moveTo(x - markLen, y);
                            ctx.lineTo(x, y);
                            ctx.lineTo(x, y - markLen);
                            ctx.stroke();

                            // Top-right
                            ctx.beginPath();
                            ctx.moveTo(x + cardWidthPx + markLen, y);
                            ctx.lineTo(x + cardWidthPx, y);
                            ctx.lineTo(x + cardWidthPx, y - markLen);
                            ctx.stroke();

                            // Bottom-left
                            ctx.beginPath();
                            ctx.moveTo(x - markLen, y + cardHeightPx);
                            ctx.lineTo(x, y + cardHeightPx);
                            ctx.lineTo(x, y + cardHeightPx + markLen);
                            ctx.stroke();

                            // Bottom-right
                            ctx.beginPath();
                            ctx.moveTo(x + cardWidthPx + markLen, y + cardHeightPx);
                            ctx.lineTo(x + cardWidthPx, y + cardHeightPx);
                            ctx.lineTo(x + cardWidthPx, y + cardHeightPx + markLen);
                            ctx.stroke();

                            ctx.lineWidth = 2;

                            // Draw cell label
                            ctx.fillStyle = '#666';
                            const label = `${r+1}-${c+1}`;
                            ctx.fillText(label, x + cardWidthPx / 2, y + cardHeightPx / 2);
                        }
                    }

                    // Add title with gutter value
                    ctx.fillStyle = '#000';
                    ctx.font = `bold ${36 * (dpi / 72)}px Arial`;
                    ctx.fillText(`SK316 Gutter Test - ${gutterMm}mm`, a4WidthPx / 2, marginY / 2);

                    // Add info text
                    ctx.font = `${20 * (dpi / 72)}px Arial`;
                    ctx.fillText(`Card: ${cardW}×${cardH}mm | Grid: ${rows}×${cols} | Gutter: ${gutterMm}mm`,
                                 a4WidthPx / 2, marginY / 2 + 50);

                    // Convert to JPG and download
                    canvas.toBlob((blob) => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `SK316_GutterTest_${gutterMm}mm_${cardW}x${cardH}_${rows}x${cols}.jpg`;
                        a.click();
                        URL.revokeObjectURL(url);
                        resolve();
                    }, 'image/jpeg', 1.0); // 100% quality
                });
            }

            showGutterSelectionOptions(gutterValues) {
                const optionsGrid = document.getElementById('gutterOptionsGrid');
                const selectionSection = document.getElementById('gutterSelectionSection');

                if (!optionsGrid || !selectionSection) return;

                selectionSection.style.display = 'block';
                optionsGrid.innerHTML = '';

                gutterValues.forEach(value => {
                    const option = document.createElement('div');
                    option.className = 'gutter-option';
                    option.dataset.gutter = value;
                    option.innerHTML = `
                        <div class="value">${value}mm</div>
                        <div class="label">Gutter</div>
                    `;

                    option.addEventListener('click', () => this.selectGutter(value));

                    optionsGrid.appendChild(option);
                });
            }

            selectGutter(gutterValue) {
                console.log(`Đã chọn gutter: ${gutterValue}mm`);

                // Update UI
                document.querySelectorAll('.gutter-option').forEach(opt => {
                    opt.classList.remove('selected');
                });

                const selectedOpt = document.querySelector(`[data-gutter="${gutterValue}"]`);
                if (selectedOpt) {
                    selectedOpt.classList.add('selected');
                }

                // Store selected gutter (will be saved with profile)
                this.selectedGutter = gutterValue;

                // Show selected display
                document.getElementById('selectedGutterValue').textContent = `${gutterValue}mm`;
                document.getElementById('selectedGutterDisplay').style.display = 'flex';

                this.showToast(`✅ Đã chọn gutter = ${gutterValue}mm`, 'success');
            }

            saveProfile() {
                const nameInput = document.getElementById('sk316ProfileName');
                const name = nameInput ? nameInput.value.trim() : '';

                if (!name) {
                    this.showToast('⚠️ Vui lòng nhập tên profile', 'error');
                    return;
                }

                this.updateOffsetData();

                // Calculate statistics
                const offsets = Object.values(this.offsetData);
                const avgX = offsets.reduce((sum, o) => sum + o.x, 0) / offsets.length;
                const avgY = offsets.reduce((sum, o) => sum + o.y, 0) / offsets.length;
                const maxOffsetX = Math.max(...offsets.map(o => Math.abs(o.x)));
                const maxOffsetY = Math.max(...offsets.map(o => Math.abs(o.y)));
                const minOffsetX = Math.min(...offsets.map(o => o.x));
                const minOffsetY = Math.min(...offsets.map(o => o.y));

                const profile = {
                    id: `sk316-${this.currentCardSize}-${this.currentGridSize.rows}x${this.currentGridSize.cols}-${Date.now()}`,
                    name: name,
                    cardSize: this.currentCardSize,
                    gridSize: {
                        rows: this.currentGridSize.rows,
                        cols: this.currentGridSize.cols
                    },
                    gutter: this.selectedGutter || null, // Lưu gutter tối ưu (mm)
                    createdAt: new Date().toISOString(),
                    lastUsed: new Date().toISOString(),
                    offsetData: { ...this.offsetData },
                    statistics: {
                        avgOffsetX: parseFloat(avgX.toFixed(3)),
                        avgOffsetY: parseFloat(avgY.toFixed(3)),
                        maxOffsetX: parseFloat(maxOffsetX.toFixed(3)),
                        maxOffsetY: parseFloat(maxOffsetY.toFixed(3)),
                        minOffsetX: parseFloat(minOffsetX.toFixed(3)),
                        minOffsetY: parseFloat(minOffsetY.toFixed(3)),
                        totalCells: this.currentGridSize.rows * this.currentGridSize.cols
                    }
                };

                this.profiles.push(profile);
                this.saveProfilesToStorage();
                this.renderProfilesList();
                this.updateProfileSelect();

                // Auto-select the new profile
                this.currentProfile = profile;
                this.updateStatusBadge();

                this.showToast('💾 Đã lưu profile thành công', 'success');

                // Clear name input
                if (nameInput) nameInput.value = '';
            }

            exportProfile() {
                this.updateOffsetData();

                if (Object.keys(this.offsetData).length === 0) {
                    this.showToast('⚠️ Chưa có dữ liệu để xuất', 'error');
                    return;
                }

                const nameInput = document.getElementById('sk316ProfileName');
                const name = nameInput ? nameInput.value.trim() : 'SK316_Profile';

                // Calculate statistics
                const offsets = Object.values(this.offsetData);
                const avgX = offsets.reduce((sum, o) => sum + o.x, 0) / offsets.length;
                const avgY = offsets.reduce((sum, o) => sum + o.y, 0) / offsets.length;
                const maxOffsetX = Math.max(...offsets.map(o => Math.abs(o.x)));
                const maxOffsetY = Math.max(...offsets.map(o => Math.abs(o.y)));

                const profile = {
                    id: `sk316-${this.currentCardSize}-${this.currentGridSize.rows}x${this.currentGridSize.cols}-${Date.now()}`,
                    name: name || 'SK316 Profile',
                    cardSize: this.currentCardSize,
                    gridSize: this.currentGridSize,
                    createdAt: new Date().toISOString(),
                    offsetData: this.offsetData,
                    statistics: {
                        avgOffsetX: parseFloat(avgX.toFixed(3)),
                        avgOffsetY: parseFloat(avgY.toFixed(3)),
                        maxOffsetX: parseFloat(maxOffsetX.toFixed(3)),
                        maxOffsetY: parseFloat(maxOffsetY.toFixed(3)),
                        totalCells: this.currentGridSize.rows * this.currentGridSize.cols
                    }
                };

                const json = JSON.stringify(profile, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${profile.name.replace(/\s+/g, '_')}_${profile.cardSize}.json`;
                a.click();
                URL.revokeObjectURL(url);

                this.showToast('📤 Đã xuất JSON thành công', 'success');
            }

            importProfile() {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';

                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const profile = JSON.parse(event.target.result);

                            // Validate profile
                            if (!profile.id || !profile.cardSize || !profile.gridSize || !profile.offsetData) {
                                throw new Error('File JSON không hợp lệ');
                            }

                            // Add to profiles
                            profile.lastUsed = new Date().toISOString();
                            this.profiles.push(profile);
                            this.saveProfilesToStorage();
                            this.renderProfilesList();
                            this.updateProfileSelect();

                            this.showToast('📥 Đã nhập profile thành công', 'success');

                        } catch (err) {
                            console.error('Import error:', err);
                            this.showToast('❌ Lỗi: ' + err.message, 'error');
                        }
                    };

                    reader.readAsText(file);
                };

                input.click();
            }

            newProfile() {
                // Reset current data
                this.currentProfile = null;
                this.offsetData = {};
                this.resetTable();
                this.updateHeatmap();
                this.updateStatistics();
                this.updateStatusBadge();

                const profileSelect = document.getElementById('sk316ProfileSelect');
                if (profileSelect) profileSelect.value = '';

                const nameInput = document.getElementById('sk316ProfileName');
                if (nameInput) nameInput.value = '';

                this.showToast('📝 Đã tạo profile mới', 'info');
            }

            loadProfile(profileId) {
                if (!profileId) {
                    this.newProfile();
                    return;
                }

                const profile = this.profiles.find(p => p.id === profileId);
                if (!profile) return;

                // Validate profile matches current config
                if (profile.cardSize !== this.currentCardSize) {
                    this.showToast(
                        `⚠️ Profile không phù hợp!\nProfile: ${profile.cardSize}\nHiện tại: ${this.currentCardSize}`,
                        'error'
                    );
                    return;
                }

                if (profile.gridSize.rows !== this.currentGridSize.rows ||
                    profile.gridSize.cols !== this.currentGridSize.cols) {
                    this.showToast(
                        `⚠️ Grid size không khớp!\nProfile: ${profile.gridSize.rows}×${profile.gridSize.cols}\nHiện tại: ${this.currentGridSize.rows}×${this.currentGridSize.cols}`,
                        'error'
                    );
                    return;
                }

                // Load profile data
                this.currentProfile = profile;
                this.offsetData = { ...profile.offsetData };

                // Load gutter if available
                if (profile.gutter !== null && profile.gutter !== undefined) {
                    this.selectedGutter = profile.gutter;
                    document.getElementById('selectedGutterValue').textContent = `${profile.gutter}mm`;
                    document.getElementById('selectedGutterDisplay').style.display = 'flex';
                } else {
                    this.selectedGutter = null;
                    document.getElementById('selectedGutterDisplay').style.display = 'none';
                }

                // Update inputs
                Object.keys(this.offsetData).forEach(key => {
                    const offset = this.offsetData[key];
                    const xInput = document.querySelector(`input[data-key="${key}"][data-axis="x"]`);
                    const yInput = document.querySelector(`input[data-key="${key}"][data-axis="y"]`);

                    if (xInput) xInput.value = offset.x.toFixed(1);
                    if (yInput) yInput.value = offset.y.toFixed(1);
                });

                // Update UI
                this.updateHeatmap();
                this.updateStatistics();
                this.updateStatusBadge();

                // Update name input
                const nameInput = document.getElementById('sk316ProfileName');
                if (nameInput) nameInput.value = profile.name;

                // Update last used
                profile.lastUsed = new Date().toISOString();
                this.saveProfilesToStorage();

                this.showToast('✅ Đã tải profile: ' + profile.name, 'success');
            }

            renderProfilesList() {
                const grid = document.getElementById('sk316ProfilesGrid');
                const list = document.getElementById('sk316ProfilesList');
                if (!grid || !list) return;

                if (this.profiles.length === 0) {
                    list.style.display = 'none';
                    return;
                }

                list.style.display = 'block';
                grid.innerHTML = '';

                this.profiles.forEach(profile => {
                    const card = document.createElement('div');
                    card.className = 'profile-card';
                    if (this.currentProfile && this.currentProfile.id === profile.id) {
                        card.classList.add('active');
                    }

                    const createdDate = new Date(profile.createdAt).toLocaleDateString('vi-VN');

                    card.innerHTML = `
                        <div class="profile-card-header">
                            <div class="profile-name">${profile.name}</div>
                        </div>
                        <div class="profile-meta">
                            Card: ${profile.cardSize}mm | Grid: ${profile.gridSize.rows}×${profile.gridSize.cols}
                        </div>
                        <div class="profile-meta">
                            Tạo: ${createdDate}
                        </div>
                        <div class="profile-meta">
                            Avg: X=${profile.statistics.avgOffsetX.toFixed(2)}mm, Y=${profile.statistics.avgOffsetY.toFixed(2)}mm
                        </div>
                        <div class="profile-actions">
                            <button class="profile-action-btn use" data-id="${profile.id}">Sử dụng</button>
                            <button class="profile-action-btn export" data-id="${profile.id}">Xuất</button>
                            <button class="profile-action-btn delete" data-id="${profile.id}">Xóa</button>
                        </div>
                    `;

                    // Use button
                    card.querySelector('.use').addEventListener('click', () => {
                        const select = document.getElementById('sk316ProfileSelect');
                        if (select) select.value = profile.id;
                        this.loadProfile(profile.id);
                    });

                    // Export button
                    card.querySelector('.export').addEventListener('click', () => {
                        const json = JSON.stringify(profile, null, 2);
                        const blob = new Blob([json], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${profile.name.replace(/\s+/g, '_')}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        this.showToast('📤 Đã xuất profile', 'success');
                    });

                    // Delete button
                    card.querySelector('.delete').addEventListener('click', () => {
                        if (confirm(`Xóa profile "${profile.name}"?`)) {
                            this.profiles = this.profiles.filter(p => p.id !== profile.id);
                            this.saveProfilesToStorage();
                            this.renderProfilesList();
                            this.updateProfileSelect();

                            if (this.currentProfile && this.currentProfile.id === profile.id) {
                                this.newProfile();
                            }

                            this.showToast('🗑️ Đã xóa profile', 'info');
                        }
                    });

                    grid.appendChild(card);
                });
            }

            updateProfileSelect() {
                const select = document.getElementById('sk316ProfileSelect');
                if (!select) return;

                const currentValue = select.value;
                select.innerHTML = '<option value="">-- Chọn profile --</option>';

                this.profiles.forEach(profile => {
                    const option = document.createElement('option');
                    option.value = profile.id;
                    option.textContent = `${profile.name} (${profile.cardSize}mm, ${profile.gridSize.rows}×${profile.gridSize.cols})`;
                    select.appendChild(option);
                });

                select.value = currentValue;
            }

            updateStatusBadge() {
                const badge = document.getElementById('sk316StatusBadge');
                if (badge) {
                    if (this.currentProfile) {
                        badge.textContent = '✓ Đang sử dụng: ' + this.currentProfile.name;
                        badge.className = 'status-badge active';
                    } else {
                        badge.textContent = '○ Chưa kích hoạt';
                        badge.className = 'status-badge inactive';
                    }
                }

                // Update preview metric card
                this.updatePreviewMetric();

                // Update export status badge
                this.updateExportStatus();
            }

            updatePreviewMetric() {
                const metricCard = document.getElementById('sk316MetricCard');
                const metricIcon = document.getElementById('sk316MetricIcon');
                const metricValue = document.getElementById('sk316MetricValue');
                const metricLabel = document.getElementById('sk316MetricLabel');

                if (!metricCard) return;

                if (this.currentProfile) {
                    metricCard.className = 'metric-card sk316-metric active';
                    if (metricIcon) metricIcon.textContent = '✓';
                    if (metricValue) metricValue.textContent = 'SK316';
                    if (metricLabel) metricLabel.textContent = 'BẬT';
                    metricCard.title = `SK316: ${this.currentProfile.name}\n${this.currentProfile.cardSize} | ${this.currentProfile.gridSize.rows}×${this.currentProfile.gridSize.cols}`;
                } else {
                    metricCard.className = 'metric-card sk316-metric inactive';
                    if (metricIcon) metricIcon.textContent = '○';
                    if (metricValue) metricValue.textContent = 'SK316';
                    if (metricLabel) metricLabel.textContent = 'TẮT';
                    metricCard.title = 'Trạng thái hiệu chuẩn SK316';
                }
            }

            updateExportStatus() {
                const statusBadge = document.getElementById('sk316ExportBadge');
                const profileInfo = document.getElementById('sk316ProfileInfo');
                const profileName = document.getElementById('sk316ExportProfileName');
                const profileDetails = document.getElementById('sk316ExportProfileDetails');

                if (!statusBadge) return;

                if (this.currentProfile) {
                    // Active state
                    statusBadge.className = 'sk316-status-badge active';
                    statusBadge.innerHTML = `
                        <span class="status-icon">✓</span>
                        <span class="status-text">SK316: BẬT</span>
                    `;

                    // Show profile info
                    if (profileInfo) profileInfo.style.display = 'block';
                    if (profileName) profileName.textContent = `Profile: ${this.currentProfile.name}`;

                    if (profileDetails) {
                        const avgX = Object.values(this.currentProfile.offsetData)
                            .reduce((sum, o) => sum + o.x, 0) / Object.keys(this.currentProfile.offsetData).length;
                        const avgY = Object.values(this.currentProfile.offsetData)
                            .reduce((sum, o) => sum + o.y, 0) / Object.keys(this.currentProfile.offsetData).length;

                        let detailsHTML = `
                            <strong>${this.currentProfile.cardSize}</strong> | Grid: <strong>${this.currentProfile.gridSize.rows}×${this.currentProfile.gridSize.cols}</strong><br>
                            Offset TB: X=${avgX.toFixed(2)}mm, Y=${avgY.toFixed(2)}mm
                        `;

                        // Add gutter if available
                        if (this.currentProfile.gutter !== null && this.currentProfile.gutter !== undefined) {
                            detailsHTML += `<br>Gutter tối ưu: <strong>${this.currentProfile.gutter}mm</strong>`;
                        }

                        profileDetails.innerHTML = detailsHTML;
                    }
                } else {
                    // Inactive state
                    statusBadge.className = 'sk316-status-badge inactive';
                    statusBadge.innerHTML = `
                        <span class="status-icon">○</span>
                        <span class="status-text">SK316: TẮT</span>
                    `;

                    // Hide profile info
                    if (profileInfo) profileInfo.style.display = 'none';
                }
            }

            updateUI() {
                this.updateHeatmap();
                this.updateStatistics();
                this.updateStatusBadge();
                this.updateProfileSelect();
            }

            saveProfilesToStorage() {
                try {
                    localStorage.setItem('sk316Profiles', JSON.stringify(this.profiles));
                } catch (err) {
                    console.error('Error saving to localStorage:', err);
                }
            }

            loadProfilesFromStorage() {
                try {
                    const data = localStorage.getItem('sk316Profiles');
                    if (data) {
                        this.profiles = JSON.parse(data);
                    }
                } catch (err) {
                    console.error('Error loading from localStorage:', err);
                    this.profiles = [];
                }
            }

            showToast(message, type = 'info') {
                // Reuse converter toast if available
                if (window.converter && typeof window.converter.showToast === 'function') {
                    window.converter.showToast(message, type);
                } else {
                    alert(message);
                }
            }

            // Apply offset to layout (called from print export)
            applyOffsetToLayout(row, col, baseX, baseY, dpi) {
                if (!this.currentProfile) {
                    return { x: baseX, y: baseY };
                }

                const key = `r${row + 1}c${col + 1}`;
                const offsetMm = this.currentProfile.offsetData[key];

                if (!offsetMm) {
                    return { x: baseX, y: baseY };
                }

                // Convert mm to px
                const offsetPx = {
                    x: (offsetMm.x / 25.4) * dpi,
                    y: (offsetMm.y / 25.4) * dpi
                };

                return {
                    x: baseX + offsetPx.x,
                    y: baseY + offsetPx.y
                };
            }

            // Get active profile for print export
            getActiveProfile() {
                return this.currentProfile;
            }

            getOptimalGutter() {
                // Return gutter từ active profile (mm)
                if (this.currentProfile && this.currentProfile.gutter !== null) {
                    return this.currentProfile.gutter;
                }
                return null; // No gutter optimization set
            }
        }

        // Initialize SK316 system
        const sk316System = new SK316CalibrationSystem();
        window.sk316System = sk316System;

        // Add click listener to SK316 metric card to switch to SK316 tab
        const sk316MetricCard = document.getElementById('sk316MetricCard');
        if (sk316MetricCard) {
            sk316MetricCard.addEventListener('click', () => {
                const sk316Tab = document.getElementById('sk316Tab');
                if (sk316Tab) {
                    sk316Tab.click();
                }
            });
        }

        // Enhanced Template Crop Functions - Progress Steps & Upload Handling
        window.updateProgressSteps = function(currentStep) {
            console.log('📊 Cập nhật bước tiến trình:', currentStep);
            
            const progressSteps = document.querySelectorAll('.progress-step');
            progressSteps.forEach((step, index) => {
                step.classList.remove('active', 'completed');
                
                if (index + 1 < currentStep) {
                    step.classList.add('completed');
                } else if (index + 1 === currentStep) {
                    step.classList.add('active');
                }
            });
            
            // Show/hide sections based on current step
            const sectionModern = document.querySelector('.size-selection-modern');
            const uploadArea = document.querySelector('.upload-area-modern');
            const processingArea = document.querySelector('.processing-area');
            const resultsSection = document.querySelector('.crop-results');
            
            if (sectionModern) sectionModern.style.display = currentStep === 1 ? 'block' : 'none';
            if (uploadArea) uploadArea.style.display = currentStep === 2 ? 'block' : 'none';  
            if (processingArea) processingArea.style.display = currentStep === 3 ? 'block' : 'none';
            if (resultsSection) resultsSection.style.display = currentStep === 4 ? 'block' : 'none';
            
            // Also show the crop results section when we have cropped images
            const cropResults = document.getElementById('cropResults');
            if (cropResults && currentStep === 4) {
                cropResults.style.display = 'block';
            }
        };

        // Handle Template Crop Upload
        window.handleTemplateCropUpload = function(files) {
            console.log('📤 Xử lý upload ảnh cho template crop:', files.length, 'files');
            
            const processingArea = document.querySelector('.processing-area');
            const progressBar = document.querySelector('.progress-bar');
            const processedCount = document.querySelector('.processed-count');
            const totalCount = document.querySelector('.total-count');
            
            if (processingArea) processingArea.style.display = 'block';
            if (totalCount) totalCount.textContent = files.length;
            
            let processed = 0;
            const total = files.length;
            
            Array.from(files).forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    // Simulate processing
                    setTimeout(() => {
                        processed++;
                        const progress = (processed / total) * 100;
                        
                        if (progressBar) progressBar.style.width = `${progress}%`;
                        if (processedCount) processedCount.textContent = processed;
                        
                        // When complete, move to results
                        if (processed === total) {
                            setTimeout(() => {
                                window.updateProgressSteps(4);
                                window.showTemplateCropResults(files);
                            }, 500);
                        }
                    }, (index + 1) * 300); // Stagger processing for visual effect
                };
                reader.readAsDataURL(file);
            });
        };

        // Show Template Crop Results
        window.showTemplateCropResults = function(files) {
            console.log('📊 Hiển thị kết quả template crop');
            
            const resultsGrid = document.querySelector('.results-grid');
            const totalImages = document.querySelector('.total-images');
            const processedImagesSpan = document.querySelector('.processed-images');
            
            if (totalImages) totalImages.textContent = files.length;
            if (processedImagesSpan) processedImagesSpan.textContent = files.length;
            
            if (resultsGrid) {
                resultsGrid.innerHTML = '';
                
                Array.from(files).forEach(file => {
                    const resultItem = document.createElement('div');
                    resultItem.className = 'result-item';
                    resultItem.innerHTML = `
                        <img src="${URL.createObjectURL(file)}" alt="${file.name}">
                        <div class="result-name">${file.name}</div>
                        <div class="result-actions">
                            <button class="action-btn">💾 Tải về</button>
                            <button class="action-btn">👁️ Xem</button>
                        </div>
                    `;
                    resultsGrid.appendChild(resultItem);
                });
            }
        };

        // Function to show crop results section with downloaded images
        window.showCropResultsSection = function() {
            console.log('📊 Hiển thị section kết quả crop');
            
            const cropResults = document.getElementById('cropResults');
            if (cropResults) {
                cropResults.style.display = 'block';
                
                // Update results summary if available
                const processedImages = document.querySelector('.processed-images');
                const totalImages = document.querySelector('.total-images');
                
                // Try to get count from converter or other sources
                if (window.converter && window.converter.files) {
                    const croppedCount = window.converter.files.filter(f => f.cropped).length;
                    if (processedImages) processedImages.textContent = croppedCount;
                    if (totalImages) totalImages.textContent = croppedCount;
                } else {
                    // Fallback to show the section anyway
                    if (processedImages) processedImages.textContent = '?';
                    if (totalImages) totalImages.textContent = '?';
                }
                
                console.log('✅ Crop results section is now visible');
            } else {
                console.warn('❌ Không tìm thấy crop results section');
            }
        };

        // Auto-show crop results when there are cropped images
        window.checkAndShowCropResults = function() {
            if (window.converter && window.converter.files) {
                const hasCroppedImages = window.converter.files.some(f => f.cropped);
                if (hasCroppedImages) {
                    window.showCropResultsSection();
                }
            }
            
            // Also check converter crop data
            if (window.converter && (window.converter.cropProcessedFiles?.length > 0 || window.converter.cropData?.croppedImages?.length > 0)) {
                window.showCropResultsSection();
            }
            
            // Also check for any existing cropped files in gallery or other sources
            if (window.layoutManager && window.layoutManager.galleryImages) {
                const hasGalleryImages = window.layoutManager.galleryImages.length > 0;
                if (hasGalleryImages) {
                    window.showCropResultsSection();
                }
            }
        };

        // Call this periodically to check for cropped images
        setInterval(() => {
            window.checkAndShowCropResults();
        }, 2000);

        // Also check immediately when page loads
        setTimeout(() => {
            window.checkAndShowCropResults();
        }, 1000);

        console.log('✅ Enhanced Template Crop functions loaded successfully');

        // 📂 Tạo folder structure cho filesystem modal
        const generateModalFolderStructure = function(images) {
            // Nhóm ảnh theo thư mục
            const folderMap = {};

            images.forEach(img => {
                const folderPath = img.folder || 'Thư mục gốc';
                if (!folderMap[folderPath]) {
                    folderMap[folderPath] = [];
                }
                folderMap[folderPath].push(img);
            });

            // Tạo HTML cho từng folder
            let folderHTML = '';
            const folderKeys = Object.keys(folderMap).sort();

            folderKeys.forEach(folderPath => {
                const images = folderMap[folderPath];
                const folderName = folderPath === 'Thư mục gốc' ? '📁 Thư mục gốc' : '📁 ' + folderPath.split('/').pop();
                const folderId = 'modal-folder-' + folderPath.replace(/[^a-zA-Z0-9]/g, '-');

                folderHTML +=
                    '<div class="fs-modal-folder-group">' +
                        '<div class="fs-modal-folder-header" data-folder="' + folderId + '">' +
                            '<span class="fs-modal-folder-toggle">▼</span>' +
                            '<span class="fs-modal-folder-name">' + folderName + '</span>' +
                            '<span class="fs-modal-folder-count">(' + images.length + ' ảnh)</span>' +
                        '</div>' +
                        '<div class="fs-modal-folder-content" id="' + folderId + '">' +
                            '<div class="fs-modal-images-grid">' +
                                images.map(img =>
                                    '<div class="filesystem-image-item" data-file-name="' + img.name + '">' +
                                        '<div class="filesystem-image-preview">' +
                                            '<img src="' + img.url + '" alt="' + img.name + '" loading="lazy">' +
                                            '<div class="filesystem-image-overlay">' +
                                                '<div class="filesystem-image-info">' +
                                                    '<div class="filesystem-image-name">' + img.name + '</div>' +
                                                    '<div class="filesystem-image-details">' + img.sizeFormatted + ' • ' + img.dateFormatted + '</div>' +
                                                '</div>' +
                                            '</div>' +
                                        '</div>' +
                                        '<div class="filesystem-image-checkbox">' +
                                            '<input type="checkbox" id="fs-img-' + img.name + '" value="' + img.name + '">' +
                                            '<label for="fs-img-' + img.name + '">✓</label>' +
                                        '</div>' +
                                    '</div>'
                                ).join('') +
                            '</div>' +
                        '</div>' +
                    '</div>';
            });

            return folderHTML;
        };

        // 📂 File System Image Picker Modal
        window.createFileSystemImagePicker = async function(options = {}) {
            const {
                title = 'Chọn ảnh từ File System',
                multiple = true,
                onSelect = null,
                maxSelection = null
            } = options;

            // Kiểm tra quyền File System
            if (!window.converter?.fileSystemStorage?.directoryHandle) {
                if (window.converter && typeof window.converter.showToast === 'function') {
                    window.converter.showToast('❌ Chưa cấp quyền File System!', 'error');
                } else {
                    alert('❌ Chưa cấp quyền File System!');
                }
                return null;
            }

            try {
                // Lấy danh sách ảnh
                const images = await window.converter.fileSystemStorage.getImagesList();

                if (images.length === 0) {
                    if (window.converter && typeof window.converter.showToast === 'function') {
                        window.converter.showToast('⚠️ Không tìm thấy ảnh nào trong thư mục!', 'warning');
                    } else {
                        alert('⚠️ Không tìm thấy ảnh nào trong thư mục!');
                    }
                    return null;
                }

                // Tạo modal
                const modal = document.createElement('div');
                modal.className = 'filesystem-modal-overlay';
                modal.innerHTML =
                    '<div class="filesystem-modal">' +
                        '<div class="filesystem-modal-header">' +
                            '<h3>' + title + '</h3>' +
                            '<button class="filesystem-modal-close">✕</button>' +
                        '</div>' +
                        '<div class="filesystem-modal-content">' +
                            '<div class="filesystem-stats">' +
                                '📁 Tìm thấy <strong>' + images.length + '</strong> ảnh trong thư mục <strong>' + window.converter.fileSystemStorage.directoryHandle.name + '</strong>' +
                                '<div style="margin-top: 8px; font-size: 0.85rem; opacity: 0.8; font-weight: normal;">' +
                                    '💡 Mẹo: Click để chọn • Double-click để xem nhanh • Hover để thấy thông tin' +
                                '</div>' +
                            '</div>' +
                            '<div class="filesystem-images-grid" id="filesystemImagesGrid">' +
                                generateModalFolderStructure(images) +
                            '</div>' +
                        '</div>' +
                        '<div class="filesystem-modal-footer">' +
                            '<div class="filesystem-selection-info">' +
                                'Đã chọn: <span id="filesystemSelectionCount">0</span> ảnh' +
                            '</div>' +
                            '<div class="filesystem-modal-actions">' +
                                '<button class="filesystem-btn secondary" id="filesystemSelectAllBtn">Chọn tất cả</button>' +
                                '<button class="filesystem-btn secondary" id="filesystemDeselectAllBtn" style="display: none;">Bỏ chọn tất cả</button>' +
                                '<button class="filesystem-btn secondary" id="filesystemCancelBtn">Hủy</button>' +
                                '<button class="filesystem-btn primary" id="filesystemSelectBtn" disabled>Chọn ảnh</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>';

                // Thêm CSS cho modal
                if (!document.getElementById('filesystem-modal-styles')) {
                    const styles = document.createElement('style');
                    styles.id = 'filesystem-modal-styles';
                    styles.textContent = `
                        .filesystem-modal-overlay {
                            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                            background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;
                            z-index: 10000; backdrop-filter: blur(5px);
                        }
                        .filesystem-modal {
                            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                            border-radius: 20px; max-width: 95vw; max-height: 95vh;
                            width: 900px; display: flex; flex-direction: column;
                            box-shadow: 0 25px 50px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.5);
                            border: 2px solid rgba(255,255,255,0.2);
                        }
                        .filesystem-modal-header {
                            padding: 24px 28px; border-bottom: 2px solid #e2e8f0;
                            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                            display: flex; justify-content: space-between; align-items: center;
                            border-radius: 18px 18px 0 0;
                        }
                        .filesystem-modal-header h3 {
                            margin: 0; font-size: 1.4rem; font-weight: 700;
                            color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        }
                        .filesystem-modal-close {
                            background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.3);
                            font-size: 1.5rem; cursor: pointer; padding: 8px 12px;
                            border-radius: 50%; color: white; font-weight: bold;
                            transition: all 0.3s ease; backdrop-filter: blur(10px);
                        }
                        .filesystem-modal-close:hover {
                            background: rgba(255,255,255,0.3); transform: scale(1.1);
                            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        }
                        .filesystem-modal-content {
                            padding: 24px 28px; flex: 1; overflow-y: auto;
                            background: linear-gradient(135deg, #fefefe 0%, #f8fafc 100%);
                        }
                        .filesystem-stats {
                            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                            padding: 16px 20px; border-radius: 12px; margin-bottom: 24px;
                            font-size: 1rem; font-weight: 600; color: #1e40af;
                            border: 2px solid #93c5fd; box-shadow: 0 4px 12px rgba(59,130,246,0.1);
                            text-align: center;
                        }
                        .filesystem-images-grid {
                            display: block !important;
                            width: 100% !important;
                        }
                        .filesystem-image-item {
                            position: relative; border-radius: 12px; overflow: hidden; cursor: pointer;
                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                            border: 3px solid transparent; background: white;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                        }
                        .filesystem-image-item:hover {
                            transform: translateY(-4px) scale(1.02);
                            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                            border-color: #60a5fa;
                        }
                        .filesystem-image-preview {
                            position: relative; aspect-ratio: 1; background: #f8fafc;
                            border-radius: 8px; overflow: hidden; margin: 6px;
                        }
                        .filesystem-image-preview img {
                            width: 100%; height: 100%; object-fit: cover;
                            transition: all 0.3s ease;
                        }
                        .filesystem-image-item:hover .filesystem-image-preview img {
                            transform: scale(1.05);
                        }
                        .filesystem-image-overlay {
                            position: absolute; bottom: 0; left: 0; right: 0;
                            background: linear-gradient(transparent, rgba(0,0,0,0.9));
                            color: white; padding: 12px 8px; font-size: 0.8rem;
                            transform: translateY(100%); transition: all 0.3s ease;
                        }
                        .filesystem-image-item:hover .filesystem-image-overlay {
                            transform: translateY(0);
                        }
                        .filesystem-image-name {
                            font-weight: 600; margin-bottom: 3px; font-size: 0.75rem;
                            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                        }
                        .filesystem-image-details {
                            opacity: 0.9; font-size: 0.7rem;
                        }
                        .filesystem-image-checkbox {
                            position: absolute; top: 10px; right: 10px; z-index: 10;
                        }
                        .filesystem-image-checkbox input { display: none; }
                        .filesystem-image-checkbox label {
                            display: flex; width: 32px; height: 32px;
                            background: rgba(255,255,255,0.9); backdrop-filter: blur(10px);
                            border: 2px solid #e2e8f0; border-radius: 50%;
                            align-items: center; justify-content: center;
                            color: #64748b; font-size: 16px; font-weight: bold;
                            cursor: pointer; transition: all 0.3s ease;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        }
                        .filesystem-image-checkbox label:hover {
                            background: rgba(59,130,246,0.1); border-color: #3b82f6;
                            color: #3b82f6; transform: scale(1.1);
                        }
                        .filesystem-image-checkbox input:checked + label {
                            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                            border-color: #059669; color: white; transform: scale(1.15);
                            box-shadow: 0 4px 15px rgba(16,185,129,0.4);
                        }
                        .filesystem-image-item.selected {
                            border-color: #10b981; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
                            box-shadow: 0 8px 25px rgba(16,185,129,0.2);
                        }
                        .filesystem-image-item.selected .filesystem-image-preview {
                            border: 2px solid #10b981;
                        }
                        .filesystem-modal-footer {
                            padding: 24px 28px; border-top: 2px solid #e2e8f0;
                            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                            display: flex; justify-content: space-between; align-items: center;
                            box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
                        }
                        .filesystem-selection-info {
                            font-size: 1rem; font-weight: 600; color: #475569;
                            padding: 8px 16px; background: rgba(255,255,255,0.8);
                            border-radius: 20px; border: 2px solid #cbd5e1;
                        }
                        .filesystem-modal-actions {
                            display: flex; gap: 12px; align-items: center;
                        }
                        .filesystem-btn {
                            padding: 12px 24px; border-radius: 25px; font-weight: 600;
                            cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                            border: 2px solid transparent; font-size: 0.95rem;
                            position: relative; overflow: hidden;
                        }
                        .filesystem-btn::before {
                            content: ''; position: absolute; top: 0; left: -100%;
                            width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                            transition: left 0.5s ease;
                        }
                        .filesystem-btn:hover::before { left: 100%; }
                        .filesystem-btn.secondary {
                            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                            color: #475569; border-color: #cbd5e1;
                        }
                        .filesystem-btn.secondary:hover {
                            background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
                            transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                            border-color: #94a3b8;
                        }
                        .filesystem-btn.primary {
                            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                            color: white; border-color: #059669;
                            box-shadow: 0 4px 15px rgba(16,185,129,0.3);
                        }
                        .filesystem-btn.primary:hover:not(:disabled) {
                            background: linear-gradient(135deg, #059669 0%, #047857 100%);
                            transform: translateY(-3px); box-shadow: 0 8px 25px rgba(16,185,129,0.4);
                            border-color: #047857;
                        }
                        .filesystem-btn.primary:disabled {
                            background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
                            cursor: not-allowed; transform: none; box-shadow: none;
                            border-color: #9ca3af;
                        }
                        /* Enhanced Folder organization - Siêu tâm lý người dùng */
                        .fs-modal-folder-group {
                            margin-bottom: 24px; border: 2px solid #e5e7eb; border-radius: 12px;
                            overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                            transition: all 0.3s ease;
                        }
                        .fs-modal-folder-group:hover {
                            border-color: #3b82f6; box-shadow: 0 4px 12px rgba(59,130,246,0.1);
                        }
                        .fs-modal-folder-header {
                            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                            padding: 16px 20px; display: flex; align-items: center; gap: 12px;
                            cursor: pointer; user-select: none; border-bottom: 2px solid #e2e8f0;
                            transition: all 0.3s ease; position: relative;
                        }
                        .fs-modal-folder-header:hover {
                            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                            transform: translateY(-1px);
                        }
                        .fs-modal-folder-header::before {
                            content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
                            background: #3b82f6; transition: all 0.3s ease; opacity: 0;
                        }
                        .fs-modal-folder-header:hover::before { opacity: 1; }
                        .fs-modal-folder-toggle {
                            font-size: 16px; font-weight: bold; transition: all 0.3s ease;
                            color: #3b82f6; width: 24px; text-align: center;
                        }
                        .fs-modal-folder-header.collapsed .fs-modal-folder-toggle {
                            transform: rotate(-90deg); color: #6b7280;
                        }
                        .fs-modal-folder-name {
                            font-weight: 700; font-size: 1.1rem; color: #1e293b; flex: 1;
                            text-shadow: 0 1px 2px rgba(0,0,0,0.05);
                        }
                        .fs-modal-folder-count {
                            font-size: 0.9rem; font-weight: 600; color: #3b82f6;
                            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                            padding: 6px 12px; border-radius: 20px; border: 2px solid #93c5fd;
                            box-shadow: 0 2px 4px rgba(59,130,246,0.1);
                        }
                        .fs-modal-folder-content {
                            padding: 20px; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                            background: #fafbfc;
                        }
                        .fs-modal-folder-content.collapsed {
                            display: none;
                        }
                        .fs-modal-images-grid {
                            display: grid !important;
                            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
                            gap: 12px !important;
                            padding: 8px !important;
                            width: 100% !important;
                            justify-items: center !important;
                        }
                        @media (max-width: 600px) {
                            .fs-modal-images-grid {
                                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)) !important;
                                gap: 8px !important;
                            }
                        }
                    `;
                    document.head.appendChild(styles);
                }

                // Thêm modal vào DOM
                document.body.appendChild(modal);

                // Logic xử lý
                let selectedImages = [];
                const grid = modal.querySelector('#filesystemImagesGrid');
                const countSpan = modal.querySelector('#filesystemSelectionCount');
                const selectBtn = modal.querySelector('#filesystemSelectBtn');

                // Update selection count and enable/disable button
                const updateSelectionCount = () => {
                    const count = selectedImages.length;
                    const totalImages = images.length;
                    const selectAllBtn = modal.querySelector('#filesystemSelectAllBtn');
                    const deselectAllBtn = modal.querySelector('#filesystemDeselectAllBtn');

                    if (countSpan) {
                        countSpan.textContent = count;
                    }
                    if (selectBtn) {
                        selectBtn.disabled = count === 0;
                        selectBtn.textContent = count > 0 ? `Chọn ${count} ảnh` : 'Chọn ảnh';
                    }

                    // Show/hide select all / deselect all buttons
                    if (selectAllBtn) {
                        selectAllBtn.style.display = count === totalImages ? 'none' : 'inline-block';
                    }
                    if (deselectAllBtn) {
                        deselectAllBtn.style.display = count > 0 ? 'inline-block' : 'none';
                    }
                };

                // Initialize selection state
                updateSelectionCount();

                // Xử lý folder toggle
                grid.addEventListener('click', (e) => {
                    const folderHeader = e.target.closest('.fs-modal-folder-header');
                    if (folderHeader) {
                        const folderId = folderHeader.dataset.folder;
                        const folderContent = modal.querySelector('#' + folderId);

                        if (folderContent) {
                            const isCollapsed = folderContent.classList.contains('collapsed');

                            if (isCollapsed) {
                                // Mở folder
                                folderContent.classList.remove('collapsed');
                                folderHeader.classList.remove('collapsed');
                            } else {
                                // Đóng folder
                                folderContent.classList.add('collapsed');
                                folderHeader.classList.add('collapsed');
                            }
                        }
                        return; // Ngăn event bubbling
                    }
                });

                // Thêm quick preview khi double-click
                grid.addEventListener('dblclick', (e) => {
                    const item = e.target.closest('.filesystem-image-item');
                    if (!item) return;

                    const imgSrc = item.querySelector('img').src;
                    const fileName = item.dataset.fileName;

                    // Tạo preview overlay
                    const preview = document.createElement('div');
                    preview.className = 'quick-preview-overlay';
                    preview.innerHTML = `
                        <div class="quick-preview-content">
                            <div class="quick-preview-header">
                                <h4>👁️ Xem nhanh: ${fileName}</h4>
                                <button class="quick-preview-close">✕</button>
                            </div>
                            <div class="quick-preview-image">
                                <img src="${imgSrc}" alt="${fileName}">
                            </div>
                        </div>
                    `;

                    // Thêm CSS cho preview
                    if (!document.getElementById('quick-preview-styles')) {
                        const previewStyles = document.createElement('style');
                        previewStyles.id = 'quick-preview-styles';
                        previewStyles.textContent =
                            '.quick-preview-overlay {' +
                                'position: fixed; top: 0; left: 0; right: 0; bottom: 0;' +
                                'background: rgba(0,0,0,0.9); z-index: 15000;' +
                                'display: flex; align-items: center; justify-content: center;' +
                                'animation: fadeIn 0.3s ease;' +
                            '}' +
                            '.quick-preview-content {' +
                                'max-width: 90vw; max-height: 90vh; background: white;' +
                                'border-radius: 12px; overflow: hidden; animation: scaleIn 0.3s ease;' +
                            '}' +
                            '.quick-preview-header {' +
                                'padding: 16px 20px; background: #1e293b; color: white;' +
                                'display: flex; justify-content: space-between; align-items: center;' +
                            '}' +
                            '.quick-preview-close {' +
                                'background: rgba(255,255,255,0.2); border: none; color: white;' +
                                'border-radius: 50%; width: 32px; height: 32px; cursor: pointer;' +
                                'transition: all 0.3s ease;' +
                            '}' +
                            '.quick-preview-close:hover { background: rgba(255,255,255,0.3); transform: scale(1.1); }' +
                            '.quick-preview-image { padding: 20px; text-align: center; }' +
                            '.quick-preview-image img { max-width: 100%; max-height: 70vh; border-radius: 8px; }' +
                            '@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }' +
                            '@keyframes scaleIn { from { transform: scale(0.9); } to { transform: scale(1); } }';
                        document.head.appendChild(previewStyles);
                    }

                    document.body.appendChild(preview);

                    // Close preview
                    const closePreview = () => preview.remove();
                    preview.querySelector('.quick-preview-close').onclick = closePreview;
                    preview.onclick = (e) => e.target === preview && closePreview();

                    e.stopPropagation();
                });

                // Xử lý chọn ảnh
                grid.addEventListener('click', (e) => {
                    const item = e.target.closest('.filesystem-image-item');
                    if (!item) return;

                    const checkbox = item.querySelector('input[type="checkbox"]');
                    const fileName = item.dataset.fileName;

                    if (!multiple && selectedImages.length > 0 && !checkbox.checked) {
                        // Uncheck other images for single selection
                        modal.querySelectorAll('.filesystem-image-item input[type="checkbox"]').forEach(cb => {
                            cb.checked = false;
                            cb.closest('.filesystem-image-item').classList.remove('selected');
                        });
                        selectedImages = [];
                    }

                    checkbox.checked = !checkbox.checked;
                    item.classList.toggle('selected', checkbox.checked);

                    if (checkbox.checked) {
                        if (!multiple) selectedImages = [fileName];
                        else if (!selectedImages.includes(fileName)) {
                            if (!maxSelection || selectedImages.length < maxSelection) {
                                selectedImages.push(fileName);
                            } else {
                                checkbox.checked = false;
                                item.classList.remove('selected');
                                if (window.converter && typeof window.converter.showToast === 'function') {
                                    window.converter.showToast('❌ Chỉ có thể chọn tối đa ' + maxSelection + ' ảnh!', 'warning');
                                } else {
                                    alert('❌ Chỉ có thể chọn tối đa ' + maxSelection + ' ảnh!');
                                }
                                return;
                            }
                        }
                    } else {
                        selectedImages = selectedImages.filter(name => name !== fileName);
                    }

                    // Update count and button state
                    updateSelectionCount();
                });

                // Xử lý nút
                const closeModal = () => {
                    // Cleanup URLs
                    images.forEach(img => URL.revokeObjectURL(img.url));
                    modal.remove();
                };

                modal.querySelector('.filesystem-modal-close').addEventListener('click', closeModal);
                modal.querySelector('#filesystemCancelBtn').addEventListener('click', closeModal);

                // Select All button event listener
                modal.querySelector('#filesystemSelectAllBtn').addEventListener('click', () => {
                    // Select all images
                    const imageItems = modal.querySelectorAll('.filesystem-image-item');
                    imageItems.forEach(item => {
                        const fileName = item.dataset.fileName;
                        const checkbox = item.querySelector('input[type="checkbox"]');

                        if (!selectedImages.includes(fileName)) {
                            selectedImages.push(fileName);
                            item.classList.add('selected');
                            if (checkbox) checkbox.checked = true;
                        }
                    });

                    // Update selection count and button state
                    updateSelectionCount();

                    // Show toast
                    if (window.converter && typeof window.converter.showToast === 'function') {
                        window.converter.showToast(`✅ Đã chọn tất cả ${selectedImages.length} ảnh`, 'success');
                    }
                });

                // Deselect All button event listener
                modal.querySelector('#filesystemDeselectAllBtn').addEventListener('click', () => {
                    // Deselect all images
                    const imageItems = modal.querySelectorAll('.filesystem-image-item');
                    imageItems.forEach(item => {
                        const checkbox = item.querySelector('input[type="checkbox"]');
                        item.classList.remove('selected');
                        if (checkbox) checkbox.checked = false;
                    });

                    // Clear selection array
                    selectedImages = [];

                    // Update selection count and button state
                    updateSelectionCount();

                    // Show toast
                    if (window.converter && typeof window.converter.showToast === 'function') {
                        window.converter.showToast('✅ Đã bỏ chọn tất cả ảnh', 'success');
                    }
                });

                modal.querySelector('#filesystemSelectBtn').addEventListener('click', async () => {
                    try {
                        const selectedFiles = [];
                        for (const fileName of selectedImages) {
                            const file = await window.converter.fileSystemStorage.getImageFile(fileName);
                            selectedFiles.push({ name: fileName, file });
                        }

                        closeModal();

                        if (onSelect) {
                            onSelect(selectedFiles);
                        }

                        return selectedFiles;
                    } catch (error) {
                        console.error('Lỗi lấy file:', error);
                        if (window.converter && typeof window.converter.showToast === 'function') {
                            window.converter.showToast('❌ Lỗi lấy file: ' + error.message, 'error');
                        } else {
                            alert('❌ Lỗi lấy file: ' + error.message);
                        }
                    }
                });

                // Click overlay to close
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) closeModal();
                });

            } catch (error) {
                console.error('Lỗi tạo file picker:', error);
                if (window.converter && typeof window.converter.showToast === 'function') {
                    window.converter.showToast('❌ Lỗi: ' + error.message, 'error');
                } else {
                    alert('❌ Lỗi: ' + error.message);
                }
                return null;
            }
        };

        // 🔗 Load Images From File System - Universal function
        window.loadImagesFromFileSystem = async function(section) {
            try {
                // Kiểm tra quyền File System
                if (!window.converter?.fileSystemStorage?.directoryHandle) {
                    if (window.converter && typeof window.converter.showToast === 'function') {
                        window.converter.showToast('❌ Chưa cấp quyền File System! Hãy nhấn nút ở header.', 'error');
                    } else {
                        alert('❌ Chưa cấp quyền File System! Hãy nhấn nút ở header.');
                    }
                    return;
                }

                // Cấu hình theo section
                const configs = {
                    convert: {
                        title: 'Chọn ảnh để chuyển đổi',
                        multiple: true,
                        onSelect: (files) => {
                            // Thêm files vào Convert section
                            if (window.converter && typeof window.converter.handleFileSelect === 'function') {
                                const fileList = files.map(f => f.file);
                                window.converter.handleFileSelect(fileList);
                                if (typeof window.converter.showToast === 'function') {
                                    window.converter.showToast('✅ Đã tải ' + files.length + ' ảnh từ File System!', 'success');
                                }
                            } else {
                                // Fallback: create proper fileData objects and assign to converter.files
                                if (window.converter) {
                                    // Initialize files array if not exists
                                    if (!window.converter.files) window.converter.files = [];

                                    // Create proper fileData objects
                                    files.forEach((f, index) => {
                                        const fileData = {
                                            id: `file_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
                                            file: f.file,
                                            name: f.name,
                                            size: f.file.size,
                                            type: f.file.type,
                                            hash: `hash_${Date.now()}_${index}`,
                                            lastModified: f.file.lastModified,
                                            quality: { score: 80, issues: [] },
                                            status: 'pending'
                                        };
                                        window.converter.files.push(fileData);
                                    });

                                    // ALSO assign to this.files if context exists
                                    if (window.converter.files && typeof window.converter.files.push === 'function') {
                                        console.log('✅ Successfully added to window.converter.files, length:', window.converter.files.length);
                                    }

                                    // Manually trigger file processing and UI updates
                                    setTimeout(() => {
                                        // Try to trigger UI update methods
                                        if (typeof window.converter.updateFileList === 'function') {
                                            window.converter.updateFileList();
                                        }
                                        if (typeof window.converter.updateStats === 'function') {
                                            window.converter.updateStats();
                                        }
                                        // Force refresh convert section display
                                        const convertBtn = document.querySelector('#convertAllBtn');
                                        if (convertBtn) {
                                            convertBtn.disabled = false;
                                            convertBtn.textContent = `Chuyển đổi ${window.converter.files.length} ảnh`;
                                        }

                                        // Show toast
                                        if (window.converter && typeof window.converter.showToast === 'function') {
                                            window.converter.showToast('✅ Đã tải ' + files.length + ' ảnh từ File System!', 'success');
                                        }
                                    }, 100);

                                    console.log('Files assigned directly to converter.files with proper fileData objects');
                                    console.log('🔍 DEBUG: converter.files array length:', window.converter.files ? window.converter.files.length : 'undefined');
                                    console.log('🔍 DEBUG: converter.files content:', window.converter.files);
                                }
                                console.log('handleFileSelect method not available, used enhanced fallback');
                            }
                        }
                    },
                    crop: {
                        title: 'Chọn ảnh để cắt',
                        multiple: true,
                        onSelect: (files) => {
                            // Thêm files vào Crop section
                            if (window.converter && typeof window.converter.handleCropFileSelect === 'function') {
                                const fileList = files.map(f => f.file);
                                window.converter.handleCropFileSelect(fileList);
                                if (typeof window.converter.showToast === 'function') {
                                    window.converter.showToast('✅ Đã tải ' + files.length + ' ảnh vào Crop!', 'success');
                                }
                            } else {
                                // Fallback: create proper cropFiles objects and assign
                                if (window.converter) {
                                    if (!window.converter.cropFiles) window.converter.cropFiles = [];

                                    files.forEach(f => {
                                        // Check if file already exists to avoid duplicates
                                        const exists = window.converter.cropFiles.some(cf => cf.name === f.name && cf.size === f.file.size);
                                        if (!exists) {
                                            const fileData = {
                                                file: f.file,
                                                name: f.name,
                                                size: f.file.size,
                                                type: f.file.type,
                                                preview: null,
                                                id: Date.now() + Math.random()
                                            };

                                            // Generate preview
                                            const reader = new FileReader();
                                            reader.onload = (e) => {
                                                fileData.preview = e.target.result;
                                                // Update UI after preview is generated
                                                if (typeof window.converter.updateCropFilesDisplay === 'function') {
                                                    window.converter.updateCropFilesDisplay();
                                                } else if (typeof window.converter.populateCropFileGrid === 'function') {
                                                    window.converter.populateCropFileGrid();
                                                }
                                            };
                                            reader.readAsDataURL(f.file);

                                            window.converter.cropFiles.push(fileData);
                                        }
                                    });

                                    // Update crop file count
                                    const cropFileCount = document.getElementById('cropFileCount');
                                    if (cropFileCount) {
                                        cropFileCount.textContent = window.converter.cropFiles.length;
                                    }

                                    // Manually trigger crop UI updates
                                    setTimeout(() => {
                                        // Try to update crop UI
                                        if (typeof window.converter.updateCropFilesDisplay === 'function') {
                                            window.converter.updateCropFilesDisplay();
                                        } else if (typeof window.converter.populateCropFileGrid === 'function') {
                                            window.converter.populateCropFileGrid();
                                        }

                                        // Update crop button
                                        const cropBtn = document.querySelector('#startCroppingPage');
                                        if (cropBtn) {
                                            cropBtn.disabled = false;
                                            cropBtn.textContent = `Bắt đầu cắt ${window.converter.cropFiles.length} ảnh`;
                                        }

                                        // Show toast
                                        if (window.converter && typeof window.converter.showToast === 'function') {
                                            window.converter.showToast('✅ Đã tải ' + files.length + ' ảnh vào Crop!', 'success');
                                        }
                                    }, 200); // Increased timeout for preview generation

                                    console.log('Files assigned directly to converter.cropFiles with proper cropFile objects');
                                    console.log('🔍 DEBUG: converter.cropFiles array length:', window.converter.cropFiles ? window.converter.cropFiles.length : 'undefined');
                                    console.log('🔍 DEBUG: converter.cropFiles content:', window.converter.cropFiles);
                                }
                                console.log('handleCropFileSelect method not available, used enhanced fallback');
                            }
                        }
                    },
                    templates: {
                        title: 'Chọn ảnh cho template',
                        multiple: true,
                        onSelect: (files) => {
                            // Thêm files vào Templates section
                            if (window.converter && typeof window.converter.handleTemplateFileSelect === 'function') {
                                const fileList = files.map(f => f.file);
                                window.converter.handleTemplateFileSelect(fileList);
                                if (typeof window.converter.showToast === 'function') {
                                    window.converter.showToast('✅ Đã tải ' + files.length + ' ảnh vào Templates!', 'success');
                                }
                            } else {
                                // Fallback for Templates section
                                if (window.converter) {
                                    // Store files in a temporary array for templates
                                    if (!window.converter.templateFiles) window.converter.templateFiles = [];
                                    files.forEach(f => {
                                        window.converter.templateFiles.push({
                                            file: f.file,
                                            name: f.name,
                                            url: URL.createObjectURL(f.file)
                                        });
                                    });

                                    // Try to update template UI
                                    setTimeout(() => {
                                        // Force update template display
                                        const templateGrid = document.querySelector('.template-upload-grid, .source-images');
                                        if (templateGrid) {
                                            // Add template images to grid manually
                                            files.forEach(f => {
                                                const img = document.createElement('div');
                                                img.className = 'template-image-item';
                                                img.innerHTML = `<img src="${URL.createObjectURL(f.file)}" alt="${f.name}"><span>${f.name}</span>`;
                                                templateGrid.appendChild(img);
                                            });
                                        }
                                    }, 100);

                                    console.log('Files assigned to template fallback with UI update');
                                }
                                console.warn('handleTemplateFileSelect method not available, used fallback');
                            }
                        }
                    },
                    gallery: {
                        title: 'Chọn ảnh thêm vào kho',
                        multiple: true,
                        onSelect: async (files) => {
                            // Thêm files vào Gallery
                            if (window.converter && typeof window.converter.addImageToGallery === 'function') {
                                for (const f of files) {
                                    // Convert File to data URL for gallery
                                    const reader = new FileReader();
                                    reader.onload = async (e) => {
                                        await window.converter.addImageToGallery(e.target.result, f.name, false);
                                    };
                                    reader.readAsDataURL(f.file);
                                }
                                if (typeof window.converter.showToast === 'function') {
                                    window.converter.showToast('✅ Đã thêm ' + files.length + ' ảnh vào kho!', 'success');
                                }
                            } else {
                                // Fallback for Gallery section
                                if (window.converter) {
                                    // Try to add images to gallery storage directly
                                    for (const f of files) {
                                        const reader = new FileReader();
                                        reader.onload = (e) => {
                                            // Try to save to localStorage as fallback
                                            const imageData = {
                                                name: f.name,
                                                data: e.target.result,
                                                timestamp: Date.now()
                                            };

                                            // Save to localStorage gallery
                                            const galleryImages = JSON.parse(localStorage.getItem('galleryImages') || '[]');
                                            galleryImages.push(imageData);
                                            localStorage.setItem('galleryImages', JSON.stringify(galleryImages));

                                            // Try to update gallery UI
                                            const galleryGrid = document.querySelector('.gallery-images-grid, #galleryImagesGrid');
                                            if (galleryGrid) {
                                                const imgElement = document.createElement('div');
                                                imgElement.className = 'gallery-image-item';
                                                imgElement.innerHTML = `
                                                    <img src="${e.target.result}" alt="${f.name}">
                                                    <div class="image-info">
                                                        <span class="image-name">${f.name}</span>
                                                    </div>
                                                `;
                                                galleryGrid.appendChild(imgElement);
                                            }
                                        };
                                        reader.readAsDataURL(f.file);
                                    }

                                    // Show toast
                                    setTimeout(() => {
                                        if (window.converter && typeof window.converter.showToast === 'function') {
                                            window.converter.showToast('✅ Đã thêm ' + files.length + ' ảnh vào kho! (fallback)', 'success');
                                        }
                                    }, 500);

                                    console.log('Gallery fallback used to store images');
                                } else {
                                    console.warn('addImageToGallery method not available and no fallback');
                                }
                            }
                        }
                    },
                    print: {
                        title: 'Chọn ảnh để in',
                        multiple: true,
                        onSelect: (files) => {
                            // Thêm files vào Print section
                            if (window.converter) {
                                // Try calling handlePrintFiles method directly
                                try {
                                    const fileObjects = files.map(f => f.file);
                                    if (typeof window.converter.handlePrintFiles === 'function') {
                                        window.converter.handlePrintFiles(fileObjects);
                                    } else {
                                        // Call addImageToPrintList directly for each file
                                        fileObjects.forEach(file => {
                                            if (file.type.startsWith('image/') && typeof window.converter.addImageToPrintList === 'function') {
                                                window.converter.addImageToPrintList(file);
                                            }
                                        });
                                    }

                                    if (typeof window.converter.showToast === 'function') {
                                        window.converter.showToast('✅ Đã tải ' + files.length + ' ảnh để in!', 'success');
                                    }
                                } catch (methodError) {
                                    console.log('Direct method call failed, using fallback:', methodError);

                                    // Fallback: Store files for printing
                                    if (!window.converter.printFiles) window.converter.printFiles = [];
                                    files.forEach(f => {
                                        window.converter.printFiles.push({
                                            file: f.file,
                                            name: f.name,
                                            size: f.file.size,
                                            url: URL.createObjectURL(f.file),
                                            id: Date.now() + Math.random()
                                        });
                                    });

                                    // Update print UI
                                    setTimeout(() => {
                                        const printFileCount = document.querySelector('#printFileCount');
                                        if (printFileCount) {
                                            printFileCount.textContent = window.converter.printFiles.length;
                                        }

                                        if (typeof window.converter.showToast === 'function') {
                                            window.converter.showToast('✅ Đã tải ' + files.length + ' ảnh để in!', 'success');
                                        }
                                    }, 100);
                                }
                            } else {
                                console.warn('window.converter not available');
                            }
                        }
                    }
                };

                const config = configs[section];
                if (!config) {
                    console.error('Invalid section:', section);
                    return;
                }

                // Mở File System Image Picker
                await window.createFileSystemImagePicker(config);

            } catch (error) {
                console.error('Lỗi tải ảnh từ File System cho ' + section + ':', error);
                if (window.converter && typeof window.converter.showToast === 'function') {
                    window.converter.showToast('❌ Lỗi: ' + error.message, 'error');
                } else {
                    alert('❌ Lỗi: ' + error.message);
                }
            }
        };

        // 📁 File System Section Logic
        let fileSystemImages = [];
        let filteredImages = [];
        let selectedFileSystemImages = [];
        let currentViewMode = 'grid';

        // Quét và hiển thị tất cả ảnh từ thư mục đã cấp quyền
        async function scanFileSystemImages() {
            const imagesGrid = document.getElementById('fsImagesGrid');
            const emptyState = document.getElementById('fsEmptyState');
            const statusCards = {
                total: document.getElementById('fsImageCount'),
                granted: document.getElementById('fsDirectoryName'),
                selected: document.getElementById('fsSelectedCount')
            };

            if (!window.converter || !window.converter.fileSystemStorage || !window.converter.fileSystemStorage.directoryHandle) {
                if (window.converter && typeof window.converter.showToast === 'function') {
                    window.converter.showToast('❌ Chưa cấp quyền truy cập thư mục!', 'warning');
                } else {
                    alert('❌ Chưa cấp quyền truy cập thư mục!');
                }
                return;
            }

            try {
                // Hiển thị loading state
                if (emptyState) {
                    emptyState.innerHTML = '<div class="loading-spinner"></div><div class="empty-title">Đang quét ảnh và thư mục...</div><div class="empty-message">Đang quét các thư mục con (tối đa 3 cấp)</div>';
                    emptyState.style.display = 'flex';
                }

                // Quét ảnh recursive với metadata mở rộng
                const scannedImages = await window.converter.fileSystemStorage.scanImagesRecursive();
                fileSystemImages = scannedImages;
                filteredImages = [...fileSystemImages];

                // Cập nhật status cards
                if (statusCards.total) statusCards.total.textContent = fileSystemImages.length;
                if (statusCards.granted) statusCards.granted.textContent = '✅ Đã cấp quyền';
                if (statusCards.selected) statusCards.selected.textContent = selectedFileSystemImages.length;

                // Cập nhật folder filter options
                updateFolderFilterOptions(fileSystemImages);

                // Cập nhật folder tree view
                updateFolderTreeView(fileSystemImages);

                // Hiển thị ảnh
                displayFileSystemImages();

                // Tính tổng size và cập nhật UI
                const totalSize = fileSystemImages.reduce((sum, img) => sum + img.size, 0);
                const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(1);
                const totalSizeElement = document.getElementById('fsTotalSize');
                if (totalSizeElement) {
                    totalSizeElement.textContent = totalSizeMB + ' MB';
                }

                // Cập nhật folder count
                const folderCountElement = document.getElementById('fsFolderCount');
                if (folderCountElement) {
                    const uniqueFolders = [...new Set(fileSystemImages.map(img => img.folder))].length;
                    folderCountElement.textContent = uniqueFolders;
                }

                // Enable controls
                enableFileSystemControls();

                if (window.converter && typeof window.converter.showToast === 'function') {
                    const uniqueFolders = [...new Set(fileSystemImages.map(img => img.folder))].length;
                    window.converter.showToast('✅ Đã quét ' + fileSystemImages.length + ' ảnh từ ' + uniqueFolders + ' thư mục!', 'success');
                }

            } catch (error) {
                console.error('Lỗi quét ảnh:', error);
                if (window.converter && typeof window.converter.showToast === 'function') {
                    window.converter.showToast('❌ Lỗi quét ảnh: ' + error.message, 'error');
                }
                if (emptyState) {
                    emptyState.innerHTML = '<div class="empty-visual">×</div><h3>Lỗi quét ảnh</h3><p>' + error.message + '</p>';
                    emptyState.style.display = 'flex';
                }
            }
        }

        // Hiển thị danh sách ảnh với phân loại theo thư mục
        function displayFileSystemImages() {
            const imagesGrid = document.getElementById('fsImagesGrid');
            const emptyState = document.getElementById('fsEmptyState');

            if (filteredImages.length === 0) {
                if (emptyState) {
                    emptyState.innerHTML = '<div class="empty-visual">□</div><h3>Không tìm thấy ảnh</h3><p>Thử quét lại hoặc kiểm tra thư mục đã chọn</p>';
                    emptyState.style.display = 'flex';
                }
                if (imagesGrid) {
                    imagesGrid.innerHTML = '';
                }
                return;
            }

            if (emptyState) {
                emptyState.style.display = 'none';
            }

            // Group images by folder for organized display
            const imagesByFolder = {};
            filteredImages.forEach(image => {
                // Ensure we have folder info, fallback to 'Root'
                const folderPath = (image.folder && image.folder.trim()) ? image.folder : 'Root';
                if (!imagesByFolder[folderPath]) {
                    imagesByFolder[folderPath] = [];
                }
                imagesByFolder[folderPath].push(image);
            });

            console.log('🔍 Images by folder:', imagesByFolder);

            // Sort folders: Root first, then alphabetically
            const sortedFolders = Object.keys(imagesByFolder).sort((a, b) => {
                if (a === 'Root') return -1;
                if (b === 'Root') return 1;
                return a.localeCompare(b);
            });

            // Utility function for file size formatting
            const formatBytes = (bytes) => {
                if (bytes === 0) return '0 B';
                const k = 1024;
                const sizes = ['B', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
            };

            // Create folder sections
            const folderSectionsHTML = sortedFolders.map(folderPath => {
                const folderImages = imagesByFolder[folderPath];
                const folderDisplayName = folderPath === 'Root' ? 'Thư mục gốc' : folderPath;
                const totalSize = folderImages.reduce((sum, img) => sum + img.size, 0);

                const imagesHTML = folderImages.map(image => {
                    const isSelected = selectedFileSystemImages.includes(image.name);

                    return '<div class="fs-image-item ' + (isSelected ? 'selected' : '') + '" data-filename="' + image.name + '" data-folder="' + image.folder + '" data-category="' + image.category + '">' +
                        '<div class="fs-image-preview">' +
                            '<input type="checkbox" class="fs-checkbox" ' + (isSelected ? 'checked' : '') + '>' +
                            '<img src="' + image.url + '" alt="' + image.name + '" loading="lazy">' +
                            '<div class="fs-image-overlay">' +
                                '<div class="fs-image-actions">' +
                                    '<button class="fs-action-btn" title="Xem chi tiết">⋯</button>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="fs-image-info">' +
                            '<div class="fs-image-name" title="' + image.path + '">' + image.name.substring(0, 18) + (image.name.length > 18 ? '...' : '') + '</div>' +
                            '<div class="fs-image-meta">' +
                                '<span class="fs-size">' + formatBytes(image.size) + '</span>' +
                                '<span class="fs-category">' + image.category + '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
                }).join('');

                return '<div class="fs-folder-section">' +
                    '<div class="fs-folder-header">' +
                        '<div class="fs-folder-info">' +
                            '<h4 class="fs-folder-name">' +
                                '<span class="fs-folder-icon">' + (folderPath === 'Root' ? '◉' : '◈') + '</span>' +
                                folderDisplayName +
                            '</h4>' +
                            '<div class="fs-folder-stats">' +
                                '<span class="fs-folder-count">' + folderImages.length + ' ảnh</span>' +
                                '<span class="fs-folder-size">' + formatBytes(totalSize) + '</span>' +
                            '</div>' +
                        '</div>' +
                        '<div class="fs-folder-actions">' +
                            '<button class="fs-folder-btn" onclick="toggleFolderSelection(\'' + folderPath.replace(/'/g, "\\'") + '\')" title="Chọn/bỏ chọn tất cả ảnh trong thư mục">' +
                                'Chọn thư mục' +
                            '</button>' +
                            '<button class="fs-folder-btn collapse" onclick="toggleFolderCollapse(\'' + folderPath.replace(/'/g, "\\'") + '\')" title="Thu gọn/mở rộng">' +
                                '−' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="fs-folder-content" id="folder-' + folderPath.replace(/[^a-zA-Z0-9]/g, '_') + '">' +
                        '<div class="fs-folder-grid">' + imagesHTML + '</div>' +
                    '</div>' +
                '</div>';
            }).join('');

            const gridHTML = '<div class="fs-organized-view">' + folderSectionsHTML + '</div>';

            if (imagesGrid) {
                console.log('🔍 Setting File System HTML:', gridHTML.substring(0, 200) + '...');
                console.log('🔍 Number of folders:', sortedFolders.length);
                console.log('🔍 Folders:', sortedFolders);

                imagesGrid.innerHTML = gridHTML;

                // Remove any existing grid styling that might conflict
                imagesGrid.style.display = 'block';
                imagesGrid.style.gridTemplateColumns = 'none';

                // Add click event listeners
                const imageItems = imagesGrid.querySelectorAll('.fs-image-item');
                imageItems.forEach(item => {
                    const checkbox = item.querySelector('.fs-checkbox');
                    const filename = item.dataset.filename;

                    // Click on item to toggle selection
                    item.addEventListener('click', (e) => {
                        if (e.target.type !== 'checkbox' && !e.target.classList.contains('fs-action-btn')) {
                            checkbox.checked = !checkbox.checked;
                            toggleFileSystemImageSelection(filename);
                        }
                    });

                    // Checkbox change event
                    checkbox.addEventListener('change', () => {
                        toggleFileSystemImageSelection(filename);
                    });
                });
            }

        }

        // Toggle chọn ảnh File System
        function toggleFileSystemImageSelection(fileName) {
            const item = document.querySelector('.fs-image-item[data-filename="' + fileName + '"]');
            const checkbox = item ? item.querySelector('.fs-checkbox') : null;

            if (!checkbox) return;

            const isSelected = checkbox.checked;

            if (isSelected) {
                if (!selectedFileSystemImages.includes(fileName)) {
                    selectedFileSystemImages.push(fileName);
                }
                item.classList.add('selected');
                checkbox.checked = true;
            } else {
                selectedFileSystemImages = selectedFileSystemImages.filter(name => name !== fileName);
                item.classList.remove('selected');
                checkbox.checked = false;
            }

            // Cập nhật UI
            updateSelectionSummary();
        }

        // Cập nhật thông tin selection
        function updateSelectionSummary() {
            const selectedCount = document.getElementById('fsSelectedCount');
            const selectedSize = document.getElementById('fsSelectedSize');
            const selectionBar = document.getElementById('fsSelectionBar');

            if (selectedCount) {
                selectedCount.textContent = selectedFileSystemImages.length;
            }

            if (selectedSize) {
                const totalSize = selectedFileSystemImages.reduce((sum, img) => sum + (img.size || 0), 0);
                if (window.converter && typeof window.converter.formatFileSize === 'function') {
                    selectedSize.textContent = window.converter.formatFileSize(totalSize);
                } else {
                    // Fallback formatFileSize function
                    selectedSize.textContent = (totalSize < 1024 * 1024 ? Math.round(totalSize / 1024) + ' KB' : Math.round(totalSize / (1024 * 1024)) + ' MB');
                }
            }

            // Show/hide selection bar
            if (selectionBar) {
                if (selectedFileSystemImages.length > 0) {
                    selectionBar.style.display = 'flex';
                } else {
                    selectionBar.style.display = 'none';
                }
            }

            // Enable/disable action buttons
            const actionButtons = document.querySelectorAll('.selection-btn');
            actionButtons.forEach(btn => {
                btn.disabled = selectedFileSystemImages.length === 0;
                btn.style.opacity = selectedFileSystemImages.length === 0 ? '0.5' : '1';
            });
        }

        // Tìm kiếm và lọc ảnh
        function filterFileSystemImages(searchTerm = '') {
            if (searchTerm.trim() === '') {
                filteredImages = [...fileSystemImages];
            } else {
                const term = searchTerm.toLowerCase();
                filteredImages = fileSystemImages.filter(image =>
                    image.name.toLowerCase().includes(term)
                );
            }
            displayFileSystemImages();
        }

        // Chọn tất cả ảnh hiện tại
        function selectAllFileSystemImages() {
            filteredImages.forEach(image => {
                if (!selectedFileSystemImages.includes(image.name)) {
                    selectedFileSystemImages.push(image.name);
                }
            });
            displayFileSystemImages();
            updateSelectionSummary();
        }

        // Bỏ chọn tất cả
        function clearFileSystemSelection() {
            selectedFileSystemImages = [];
            displayFileSystemImages();
            updateSelectionSummary();
        }

        // Toggle folder selection (chọn/bỏ chọn tất cả ảnh trong folder)
        function toggleFolderSelection(folderPath) {
            const folderImages = filteredImages.filter(img => (img.folder || 'Root') === folderPath);
            const folderImageNames = folderImages.map(img => img.name);

            // Check if all images in folder are selected
            const allSelected = folderImageNames.every(name => selectedFileSystemImages.includes(name));

            if (allSelected) {
                // Deselect all images in folder
                selectedFileSystemImages = selectedFileSystemImages.filter(name => !folderImageNames.includes(name));
            } else {
                // Select all images in folder
                folderImageNames.forEach(name => {
                    if (!selectedFileSystemImages.includes(name)) {
                        selectedFileSystemImages.push(name);
                    }
                });
            }

            // Update UI
            displayFileSystemImages();
            updateSelectionSummary();

            // Show toast
            if (window.converter && typeof window.converter.showToast === 'function') {
                const action = allSelected ? 'bỏ chọn' : 'chọn';
                window.converter.showToast(`✅ Đã ${action} ${folderImageNames.length} ảnh trong thư mục "${folderPath === 'Root' ? 'gốc' : folderPath}"`, 'success');
            }
        }

        // Toggle folder collapse/expand
        function toggleFolderCollapse(folderPath) {
            const folderId = 'folder-' + folderPath.replace(/[^a-zA-Z0-9]/g, '_');
            const folderContent = document.getElementById(folderId);
            const collapseBtn = document.querySelector(`[onclick="toggleFolderCollapse('${folderPath}')"]`);

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
