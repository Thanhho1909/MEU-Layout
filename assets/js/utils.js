        // 🚀 TỰ ĐỘNG CHO PHÉP MULTIPLE DOWNLOADS - Bypass browser restrictions
        (() => {
            // Override browser download policy
            if (typeof window !== 'undefined') {
                // Auto-allow multiple downloads for this domain - DISABLED
                // Commented out to prevent automatic file downloads
                /*
                const autoAllowDownloads = () => {
                    try {
                        // Create invisible element to trigger user gesture
                        const trigger = document.createElement('div');
                        trigger.style.position = 'absolute';
                        trigger.style.left = '-9999px';
                        trigger.style.width = '1px';
                        trigger.style.height = '1px';
                        document.body.appendChild(trigger);

                        // Simulate user interaction to enable downloads
                        const clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        trigger.dispatchEvent(clickEvent);

                        // Cleanup
                        setTimeout(() => {
                            if (trigger.parentNode) {
                                trigger.parentNode.removeChild(trigger);
                            }
                        }, 100);

                        console.log('✅ Auto-allow multiple downloads enabled');
                    } catch (e) {
                        console.warn('Could not auto-enable downloads:', e);
                    }
                };

                // Enable on page load - DISABLED
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', autoAllowDownloads);
                } else {
                    autoAllowDownloads();
                }
                */
                console.log('🚫 Auto-download permissions disabled to prevent temp file downloads');

                // Re-enable on any user interaction - DISABLED
                /*
                ['click', 'keydown', 'touchstart'].forEach(event => {
                    document.addEventListener(event, autoAllowDownloads, { once: true, passive: true });
                });
                */
            }
        })();

        // 📁 Global Directory Handle - Shared across all instances
        window.globalDirectoryHandle = null;

        // 📁 File System Storage Class - Quản lý lưu trữ file thay vì localStorage
        window.FileSystemStorage = class FileSystemStorage {
            constructor() {
                // Sử dụng global handle và đảm bảo đồng bộ
                this.directoryHandle = window.globalDirectoryHandle;
                this.dataFileName = 'meu-layout-data.json';
                this.isSupported = 'showDirectoryPicker' in window;

                // Theo dõi global handle thay đổi
                this.syncWithGlobalHandle();
            }

            // Đồng bộ với global handle
            syncWithGlobalHandle() {
                // Kiểm tra và cập nhật handle định kỳ
                setInterval(() => {
                    if (window.globalDirectoryHandle && this.directoryHandle !== window.globalDirectoryHandle) {
                        this.directoryHandle = window.globalDirectoryHandle;
                        console.log('🔄 Đã đồng bộ directoryHandle với global');
                    }
                }, 1000); // Kiểm tra mỗi giây
            }

            // Khởi tạo và yêu cầu quyền truy cập thư mục
            async init() {
                if (!this.isSupported) {
                    throw new Error('File System Access API không được hỗ trợ trong trình duyệt này');
                }

                // Kiểm tra global handle trước
                if (window.globalDirectoryHandle && await this.verifyPermission(window.globalDirectoryHandle)) {
                    this.directoryHandle = window.globalDirectoryHandle;
                    return;
                }

                try {
                    // Yêu cầu người dùng chọn thư mục để lưu trữ
                    const handle = await window.showDirectoryPicker({
                        mode: 'readwrite',
                        startIn: 'documents'
                    });

                    // Lưu vào global và instance
                    window.globalDirectoryHandle = handle;
                    this.directoryHandle = handle;

                    // Cập nhật tất cả instances hiện có
                    this.updateAllInstances(handle);

                    // 🧹 Cleanup localStorage khi đã có File System
                    this.cleanupLocalStorageAfterFileSystem();

                    console.log('✅ Đã cấp quyền truy cập file system:', handle.name);
                } catch (error) {
                    if (error.name === 'AbortError') {
                        throw new Error('Người dùng đã hủy việc cấp quyền file system');
                    }
                    throw error;
                }
            }

            // Cập nhật tất cả instances với handle mới
            updateAllInstances(handle) {
                // Cập nhật converter instance
                if (window.converter && window.converter.fileSystemStorage) {
                    window.converter.fileSystemStorage.directoryHandle = handle;
                }

                // Cập nhật cropper instance
                if (window.cropper && window.cropper.fileSystemStorage) {
                    window.cropper.fileSystemStorage.directoryHandle = handle;
                }

                // Cập nhật gallery instance
                if (window.galleryManager && window.galleryManager.fileSystemStorage) {
                    window.galleryManager.fileSystemStorage.directoryHandle = handle;
                }

                // Cập nhật print instance
                if (window.printManager && window.printManager.fileSystemStorage) {
                    window.printManager.fileSystemStorage.directoryHandle = handle;
                }

                console.log('🔄 Đã cập nhật directoryHandle cho tất cả instances');
            }

            // 🧹 Cleanup localStorage khi đã có File System
            cleanupLocalStorageAfterFileSystem() {
                try {
                    console.log('🧹 Bắt đầu cleanup localStorage sau khi có File System...');

                    // Xóa gallery data từ localStorage
                    if (localStorage.getItem('meu-layout-gallery')) {
                        localStorage.removeItem('meu-layout-gallery');
                        console.log('✅ Đã xóa meu-layout-gallery từ localStorage');
                    }

                    // Xóa các data cũ khác nếu có
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && (key.includes('meu-layout') || key.includes('gallery') || key.includes('converted'))) {
                            keysToRemove.push(key);
                        }
                    }

                    keysToRemove.forEach(key => {
                        localStorage.removeItem(key);
                        console.log(`✅ Đã xóa ${key} từ localStorage`);
                    });

                    console.log(`🧹 Cleanup hoàn thành! Đã xóa ${keysToRemove.length + 1} items từ localStorage`);

                    // Thông báo cho user
                    if (window.converter && typeof window.converter.showToast === 'function') {
                        window.converter.showToast('🧹 Đã dọn dẹp bộ nhớ trình duyệt cũ!', 'success');
                    }
                } catch (error) {
                    console.error('❌ Lỗi cleanup localStorage:', error);
                }
            }

            // Kiểm tra quyền truy cập
            async verifyPermission(handle = null) {
                const targetHandle = handle || this.directoryHandle;
                if (!targetHandle) return false;

                try {
                    const permission = await targetHandle.queryPermission({ mode: 'readwrite' });
                    if (permission === 'granted') return true;

                    // Yêu cầu quyền nếu chưa có
                    const newPermission = await targetHandle.requestPermission({ mode: 'readwrite' });
                    return newPermission === 'granted';
                } catch (error) {
                    console.error('Lỗi kiểm tra quyền:', error);
                    return false;
                }
            }

            // Đọc dữ liệu từ file
            async getItem(key) {
                try {
                    const fileHandle = await this.directoryHandle.getFileHandle(this.dataFileName);
                    const file = await fileHandle.getFile();
                    const text = await file.text();
                    const data = JSON.parse(text);
                    return data[key];
                } catch (error) {
                    if (error.name === 'NotFoundError') {
                        // File chưa tồn tại
                        return null;
                    }
                    throw error;
                }
            }

            // Lưu dữ liệu vào file
            async setItem(key, value) {
                try {
                    // Đọc dữ liệu hiện tại
                    let currentData = {};
                    try {
                        const fileHandle = await this.directoryHandle.getFileHandle(this.dataFileName);
                        const file = await fileHandle.getFile();
                        const text = await file.text();
                        currentData = JSON.parse(text);
                    } catch (error) {
                        if (error.name !== 'NotFoundError') {
                            throw error;
                        }
                    }

                    // Cập nhật dữ liệu
                    currentData[key] = value;

                    // Lưu file mới
                    const fileHandle = await this.directoryHandle.getFileHandle(this.dataFileName, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(JSON.stringify(currentData, null, 2));
                    await writable.close();

                    console.log(`✅ Đã lưu ${key} vào file system`);
                } catch (error) {
                    console.error(`❌ Lỗi lưu ${key}:`, error);
                    throw error;
                }
            }

            // Xóa dữ liệu
            async removeItem(key) {
                try {
                    const fileHandle = await this.directoryHandle.getFileHandle(this.dataFileName);
                    const file = await fileHandle.getFile();
                    const text = await file.text();
                    const data = JSON.parse(text);

                    delete data[key];

                    const writable = await fileHandle.createWritable();
                    await writable.write(JSON.stringify(data, null, 2));
                    await writable.close();

                    console.log(`✅ Đã xóa ${key} khỏi file system`);
                } catch (error) {
                    if (error.name !== 'NotFoundError') {
                        throw error;
                    }
                }
            }

            // Xóa toàn bộ dữ liệu
            async clear() {
                try {
                    const fileHandle = await this.directoryHandle.getFileHandle(this.dataFileName, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write('{}');
                    await writable.close();

                    console.log('✅ Đã xóa toàn bộ dữ liệu file system');
                } catch (error) {
                    console.error('❌ Lỗi xóa dữ liệu:', error);
                    throw error;
                }
            }

            // 🎨 Phương thức quản lý giao diện
            updatePermissionUI() {
                const btn = document.getElementById('filesystemPermissionBtn');
                const status = document.getElementById('permissionStatus');
                const info = document.getElementById('permissionInfo');
                const infoText = info?.querySelector('.info-text');

                if (!btn || !status || !info || !infoText) return;

                if (this.directoryHandle) {
                    // Đã cấp quyền
                    btn.classList.add('granted');
                    btn.querySelector('.permission-text').textContent = 'File System Đã Cấp Quyền';
                    status.textContent = '✅';

                    infoText.innerHTML =
                        '<strong>Đã cấp quyền lưu trữ</strong><br>' +
                        'Thư mục: ' + this.directoryHandle.name + '<br>' +
                        'Dữ liệu sẽ được lưu tự động';
                } else {
                    // Chưa cấp quyền
                    btn.classList.remove('granted');
                    btn.querySelector('.permission-text').textContent = 'Cấp quyền File System';
                    status.textContent = '❌';

                    infoText.innerHTML =
                        '<strong>Chưa cấp quyền lưu trữ</strong><br>' +
                        'Nhấn để chọn thư mục lưu dữ liệu ứng dụng';
                }
            }

            // Yêu cầu quyền thông qua UI
            async requestPermissionFromUI() {
                console.log('🔍 requestPermissionFromUI called');

                // Prevent multiple simultaneous calls
                if (this._requesting) {
                    console.log('Đã có request permission đang chạy');
                    return;
                }

                // Enhanced user activation check
                if (!navigator.userActivation) {
                    console.warn('🚫 UserActivation API not supported');
                    // Continue anyway for older browsers
                } else if (!navigator.userActivation.isActive) {
                    console.warn('🚫 User activation required for showDirectoryPicker');
                    console.log('UserActivation state:', {
                        isActive: navigator.userActivation.isActive,
                        hasBeenActive: navigator.userActivation.hasBeenActive
                    });

                    if (window.converter && typeof window.converter.showToast === 'function') {
                        window.converter.showToast('❌ Vui lòng nhấn trực tiếp vào nút để cấp quyền', 'warning');
                    }
                    return;
                }

                this._requesting = true;
                const btn = document.getElementById('filesystemPermissionBtn');
                const info = document.getElementById('permissionInfo');

                try {
                    // Hiển thị trạng thái đang xử lý
                    if (btn) {
                        btn.disabled = true;
                        btn.querySelector('.permission-text').textContent = 'Đang chờ cấp quyền...';
                    }

                    // Yêu cầu quyền
                    await this.init();

                    // Cập nhật UI thành công
                    this.updatePermissionUI();

                    // Hiển thị thông báo thành công
                    if (window.converter && window.converter.showToast) {
                        window.converter.showToast('✅ Đã cấp quyền File System thành công!', 'success');
                    }

                    // Ẩn info panel sau 3 giây
                    setTimeout(() => {
                        if (info) info.classList.remove('visible');
                    }, 3000);

                } catch (error) {
                    console.error('Lỗi cấp quyền từ UI:', error);

                    // Hiển thị lỗi
                    if (window.converter && window.converter.showToast) {
                        if (error.message.includes('hủy')) {
                            window.converter.showToast('⚠️ Đã hủy việc cấp quyền', 'warning');
                        } else {
                            window.converter.showToast('❌ Lỗi cấp quyền: ' + error.message, 'error');
                        }
                    }
                } finally {
                    // Reset requesting flag
                    this._requesting = false;

                    // Khôi phục nút
                    if (btn) {
                        btn.disabled = false;
                        this.updatePermissionUI();
                    }
                }
            }

            // Khởi tạo event listeners cho UI
            initPermissionUI() {
                const btn = document.getElementById('filesystemPermissionBtn');
                const info = document.getElementById('permissionInfo');

                if (btn) {
                    btn.addEventListener('click', () => {
                        this.requestPermissionFromUI();
                    });

                    // Hiển thị/ẩn info khi hover
                    btn.addEventListener('mouseenter', () => {
                        if (info) info.classList.add('visible');
                    });

                    btn.addEventListener('mouseleave', () => {
                        if (info) {
                            setTimeout(() => {
                                if (!info.matches(':hover')) {
                                    info.classList.remove('visible');
                                }
                            }, 200);
                        }
                    });
                }

                // Giữ info hiển thị khi hover vào chính nó
                if (info) {
                    info.addEventListener('mouseenter', () => {
                        info.classList.add('visible');
                    });

                    info.addEventListener('mouseleave', () => {
                        info.classList.remove('visible');
                    });
                }

                // Cập nhật UI ban đầu
                this.updatePermissionUI();
            }

            // 🔍 Tính năng quét ảnh từ thư mục
            async scanImagesFromDirectory() {
                if (!this.directoryHandle) {
                    throw new Error('Chưa cấp quyền truy cập thư mục');
                }

                const imageFiles = [];
                const supportedTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic'];

                try {
                    // Đọc tất cả file trong thư mục
                    for await (const [name, handle] of this.directoryHandle.entries()) {
                        if (handle.kind === 'file') {
                            const extension = name.split('.').pop()?.toLowerCase();

                            if (extension && supportedTypes.includes(extension)) {
                                const file = await handle.getFile();
                                imageFiles.push({
                                    name: name,
                                    file: file,
                                    size: file.size,
                                    type: file.type,
                                    lastModified: file.lastModified,
                                    extension: extension
                                });
                            }
                        }
                    }

                    console.log(`✅ Đã quét được ${imageFiles.length} ảnh từ thư mục:`, this.directoryHandle.name);
                    return imageFiles;

                } catch (error) {
                    console.error('❌ Lỗi quét ảnh từ thư mục:', error);
                    throw error;
                }
            }

            // 🗂️ Enhanced: Recursive folder scanning với folder structure
            async scanImagesRecursive(currentHandle = null, currentPath = '', maxDepth = 3, currentDepth = 0) {
                if (currentDepth > maxDepth) return [];

                const handle = currentHandle || this.directoryHandle;
                if (!handle) throw new Error('Chưa cấp quyền truy cập thư mục');

                const imageFiles = [];
                const supportedTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic'];

                try {
                    for await (const [name, entryHandle] of handle.entries()) {
                        const fullPath = currentPath ? `${currentPath}/${name}` : name;

                        if (entryHandle.kind === 'file') {
                            const extension = name.split('.').pop()?.toLowerCase();
                            if (extension && supportedTypes.includes(extension)) {
                                const file = await entryHandle.getFile();
                                imageFiles.push({
                                    name: name,
                                    file: file,
                                    size: file.size,
                                    lastModified: file.lastModified,
                                    type: file.type,
                                    url: URL.createObjectURL(file),
                                    path: fullPath,
                                    folder: currentPath || 'Root',
                                    category: this.categorizeByPath(fullPath)
                                });
                            }
                        } else if (entryHandle.kind === 'directory') {
                            // Recursive scan subfolders
                            const subImages = await this.scanImagesRecursive(
                                entryHandle,
                                fullPath,
                                maxDepth,
                                currentDepth + 1
                            );
                            imageFiles.push(...subImages);
                        }
                    }

                    return imageFiles;
                } catch (error) {
                    console.error('❌ Lỗi quét ảnh recursive:', error);
                    throw error;
                }
            }

            // 🏷️ Smart categorization dựa vào path
            categorizeByPath(filePath) {
                const path = filePath.toLowerCase();
                const pathParts = path.split('/');

                // Category mapping
                const categories = {
                    'convert': ['convert', 'raw', 'input', 'source'],
                    'crop': ['crop', 'cut', 'trim'],
                    'template': ['template', 'frame', 'border'],
                    'gallery': ['gallery', 'kho', 'output', 'final'],
                    'print': ['print', 'in', 'ready'],
                    'archive': ['archive', 'backup', 'old'],
                    'work': ['work', 'working', 'temp', 'draft']
                };

                for (const [category, keywords] of Object.entries(categories)) {
                    if (keywords.some(keyword =>
                        pathParts.some(part => part.includes(keyword))
                    )) {
                        return category;
                    }
                }

                return 'uncategorized';
            }

            // Alias method cho tương thích (sử dụng recursive scan)
            async scanImages() {
                return await this.scanImagesRecursive();
            }

            // Lấy file ảnh theo tên (hỗ trợ tìm trong thư mục con)
            async getImageFile(fileName) {
                if (!this.directoryHandle) {
                    throw new Error('Chưa cấp quyền truy cập thư mục');
                }

                // Trước tiên tìm trong thư mục root
                try {
                    const fileHandle = await this.directoryHandle.getFileHandle(fileName);
                    return await fileHandle.getFile();
                } catch (rootError) {
                    // Nếu không tìm thấy trong root, tìm trong các thư mục con
                    try {
                        const file = await this.findFileRecursive(fileName, this.directoryHandle);
                        if (file) {
                            return file;
                        }
                    } catch (searchError) {
                        console.error('Error searching for file:', searchError);
                    }

                    // Nếu vẫn không tìm thấy, trả về lỗi
                    throw new Error(`Không tìm thấy file: ${fileName}`);
                }
            }

            // Helper method để tìm file recursively
            async findFileRecursive(fileName, directoryHandle, maxDepth = 3, currentDepth = 0) {
                if (currentDepth > maxDepth) return null;

                try {
                    for await (const [name, entryHandle] of directoryHandle.entries()) {
                        if (entryHandle.kind === 'file' && name === fileName) {
                            return await entryHandle.getFile();
                        } else if (entryHandle.kind === 'directory') {
                            const foundFile = await this.findFileRecursive(fileName, entryHandle, maxDepth, currentDepth + 1);
                            if (foundFile) {
                                return foundFile;
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Lỗi tìm file trong thư mục:`, error);
                }

                return null;
            }

            // Lấy danh sách ảnh có metadata (bao gồm thư mục con)
            async getImagesList() {
                const images = await this.scanImagesRecursive();

                return images.map(img => ({
                    ...img,
                    url: img.url || URL.createObjectURL(img.file),
                    sizeFormatted: this.formatFileSize(img.size),
                    dateFormatted: new Date(img.lastModified).toLocaleDateString('vi-VN')
                }));
            }

            // Format file size
            formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }

            // Kiểm tra thư mục có ảnh không
            async hasImages() {
                try {
                    const images = await this.scanImagesFromDirectory();
                    return images.length > 0;
                } catch (error) {
                    return false;
                }
            }

            // 💾 LƯU ẢNH VÀO FILE SYSTEM - TÍNH NĂNG CHÍNH

            // Lưu ảnh vào file system từ File/Blob
            async saveImageToFileSystem(imageData, fileName, subfolder = null) {
                if (!this.directoryHandle) {
                    throw new Error('❌ Chưa cấp quyền File System!');
                }

                try {
                    let targetDirectory = this.directoryHandle;

                    // Tạo subfolder nếu cần
                    if (subfolder) {
                        try {
                            targetDirectory = await this.directoryHandle.getDirectoryHandle(subfolder, { create: true });
                        } catch (error) {
                            console.error('Lỗi tạo subfolder:', error);
                            throw new Error('Không thể tạo thư mục: ' + subfolder);
                        }
                    }

                    // Tạo file handle
                    const fileHandle = await targetDirectory.getFileHandle(fileName, { create: true });
                    const writable = await fileHandle.createWritable();

                    // Convert imageData to appropriate format
                    let dataToWrite;
                    if (imageData instanceof Blob) {
                        dataToWrite = imageData;
                    } else if (imageData instanceof File) {
                        dataToWrite = imageData;
                    } else if (typeof imageData === 'string' && imageData.startsWith('data:')) {
                        // Base64 data URL
                        const response = await fetch(imageData);
                        dataToWrite = await response.blob();
                    } else {
                        throw new Error('❌ Định dạng ảnh không hỗ trợ');
                    }

                    // Ghi file
                    await writable.write(dataToWrite);
                    await writable.close();

                    const filePath = subfolder ? `${subfolder}/${fileName}` : fileName;
                    console.log(`✅ Đã lưu ảnh vào File System: ${filePath}`);

                    return {
                        success: true,
                        filePath: filePath,
                        size: dataToWrite.size
                    };
                } catch (error) {
                    console.error('❌ Lỗi lưu ảnh vào File System:', error);
                    throw error;
                }
            }

            // Lưu nhiều ảnh batch với progress callback
            async saveMultipleImages(images, subfolder = null, progressCallback = null) {
                if (!Array.isArray(images) || images.length === 0) {
                    throw new Error('❌ Danh sách ảnh trống!');
                }

                const results = [];
                const total = images.length;

                for (let i = 0; i < total; i++) {
                    const { imageData, fileName } = images[i];

                    try {
                        const result = await this.saveImageToFileSystem(imageData, fileName, subfolder);
                        results.push({ ...result, fileName, index: i });

                        // Progress callback
                        if (progressCallback) {
                            progressCallback({
                                current: i + 1,
                                total: total,
                                fileName: fileName,
                                success: true
                            });
                        }
                    } catch (error) {
                        results.push({
                            success: false,
                            fileName,
                            index: i,
                            error: error.message
                        });

                        if (progressCallback) {
                            progressCallback({
                                current: i + 1,
                                total: total,
                                fileName: fileName,
                                success: false,
                                error: error.message
                            });
                        }
                    }

                    // Small delay to prevent overwhelming the system
                    await new Promise(resolve => setTimeout(resolve, 10));
                }

                return results;
            }

            // Lưu canvas as image - LUÔN chất lượng 100%
            async saveCanvasToFileSystem(canvas, fileName, format = 'image/png', quality = 1.0, subfolder = null) {
                return new Promise((resolve, reject) => {
                    canvas.toBlob(async (blob) => {
                        try {
                            const result = await this.saveImageToFileSystem(blob, fileName, subfolder);
                            resolve(result);
                        } catch (error) {
                            reject(error);
                        }
                    }, format, quality);
                });
            }

            // Lưu từ URL (fetch and save)
            async saveImageFromUrl(imageUrl, fileName, subfolder = null) {
                try {
                    const response = await fetch(imageUrl);
                    if (!response.ok) {
                        throw new Error('❌ Không thể tải ảnh từ URL');
                    }

                    const blob = await response.blob();
                    return await this.saveImageToFileSystem(blob, fileName, subfolder);
                } catch (error) {
                    console.error('❌ Lỗi lưu ảnh từ URL:', error);
                    throw error;
                }
            }

            // 📤 AUTO-SAVE UPLOADED FILES - Lưu ảnh tải lên vào thư mục Uploaded
            async saveUploadedFile(file) {
                if (!this.directoryHandle) {
                    console.warn('⚠️ File System chưa được cấp quyền, không thể auto-save upload');
                    return false;
                }

                try {
                    const subfolderName = 'Uploaded';
                    const result = await this.saveImageToFileSystem(file, file.name, subfolderName);
                    console.log(`✅ Đã auto-save uploaded file: ${subfolderName}/${file.name}`);
                    return result;
                } catch (error) {
                    console.error('❌ Lỗi auto-save uploaded file:', error);
                    return false;
                }
            }
        }

        // 🛡️ Helper function để tạo FileSystemStorage an toàn
        window.createFileSystemStorage = function() {
            try {
                if (typeof window.FileSystemStorage === 'function') {
                    const instance = new window.FileSystemStorage();
                    // Đảm bảo instance sử dụng global handle nếu có
                    if (window.globalDirectoryHandle) {
                        instance.directoryHandle = window.globalDirectoryHandle;
                    }
                    return instance;
                } else {
                    console.error('❌ FileSystemStorage class không sẵn sàng');
                    return null;
                }
            } catch (error) {
                console.error('❌ Lỗi tạo FileSystemStorage:', error);
                return null;
            }
        };

