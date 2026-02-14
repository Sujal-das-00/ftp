// DOM Elements
const form = document.getElementById('uploadForm');
const gallery = document.getElementById('gallery');
const emptyState = document.getElementById('emptyState');
const imageCount = document.getElementById('imageCount');
const lastUpdated = document.getElementById('lastUpdated');
const searchInput = document.getElementById('searchInput');
const viewToggleButtons = document.querySelectorAll('.view-btn');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const removePreview = document.getElementById('removePreview');
const uploadBtn = document.getElementById('uploadBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const toast = document.getElementById('toast');

// State
let images = [];
let filteredImages = [];
let currentView = 'grid';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadImages();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Form submission
    form.addEventListener('submit', handleUpload);
    
    // File input change for preview
    fileInput.addEventListener('change', handleFileSelect);
    
    // Remove preview
    removePreview.addEventListener('click', removeImagePreview);
    
    // Search functionality
    searchInput.addEventListener('input', handleSearch);
    
    // View toggle
    viewToggleButtons.forEach(btn => {
        btn.addEventListener('click', handleViewToggle);
    });
    
    // Drag and drop functionality
    setupDragAndDrop();
}

// Drag and Drop
function setupDragAndDrop() {
    const fileWrapper = document.querySelector('.file-input-wrapper');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileWrapper.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        fileWrapper.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        fileWrapper.addEventListener(eventName, unhighlight, false);
    });
    
    fileWrapper.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight(e) {
        fileWrapper.classList.add('drag-over');
    }
    
    function unhighlight(e) {
        fileWrapper.classList.remove('drag-over');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files && files.length > 0) {
            fileInput.files = files;
            handleFileSelect();
        }
    }
}

// File Handling
function handleFileSelect() {
    const file = fileInput.files[0];
    
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file (PNG, JPG, GIF)', 'error');
            return;
        }
        
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            showToast('File size must be less than 10MB', 'error');
            return;
        }
        
        // Show preview
        showImagePreview(file);
        
        // Update button text
        uploadBtn.innerHTML = `
            <i class="fas fa-upload"></i>
            <span>Upload ${file.name}</span>
        `;
    }
}

function showImagePreview(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewContainer.style.display = 'block';
    };
    
    reader.readAsDataURL(file);
}

function removeImagePreview() {
    previewContainer.style.display = 'none';
    previewImage.src = '';
    fileInput.value = '';
    uploadBtn.innerHTML = `
        <i class="fas fa-upload"></i>
        <span>Upload Image</span>
    `;
}

// Upload Handling
async function handleUpload(e) {
    e.preventDefault();
    
    const file = fileInput.files[0];
    
    if (!file) {
        showToast('Please select a file to upload', 'error');
        return;
    }
    
    try {
        showLoading(true);
        
        const formData = new FormData(form);
        
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        
        showToast('Image uploaded successfully!', 'success');
        form.reset();
        removeImagePreview();
        loadImages();
        
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Upload failed. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Gallery Management
async function loadImages() {
    try {
        const res = await fetch('/api/images');
        images = await res.json();
        
        updateGalleryStats();
        applyFilters();
        
    } catch (error) {
        console.error('Error loading images:', error);
        showToast('Failed to load images', 'error');
    }
}

function renderGallery() {
    gallery.innerHTML = '';
    
    if (filteredImages.length === 0) {
        emptyState.style.display = 'block';
        gallery.style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    gallery.style.display = 'grid';
    
    filteredImages.forEach(image => {
        const card = createImageCard(image);
        gallery.appendChild(card);
    });
}

function createImageCard(image) {
    const card = document.createElement('div');
    card.className = 'card';
    
    // Extract filename without extension for display
    const filename = image.replace(/\.[^/.]+$/, "");
    const extension = image.split('.').pop();
    
    card.innerHTML = `
        <img src="/images/${image}" alt="${filename}" class="card-image">
        <div class="card-content">
            <div class="card-title">${filename}</div>
            <div class="card-meta">
                <span>${extension.toUpperCase()}</span>
                <span>${formatFileSize(image)}</span>
            </div>
            <div class="card-actions">
                <a href="/images/${image}" class="card-btn download" download>
                    <i class="fas fa-download"></i>
                    Download
                </a>
                <button class="card-btn view-btn" onclick="openImageViewer('${image}')">
                    <i class="fas fa-eye"></i>
                    View
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Search and Filter
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    
    filteredImages = images.filter(image => {
        const filename = image.replace(/\.[^/.]+$/, "").toLowerCase();
        return filename.includes(searchTerm);
    });
    
    renderGallery();
}

function applyFilters() {
    filteredImages = [...images];
    handleSearch(); // Apply current search
}

// View Toggle
function handleViewToggle(e) {
    const view = e.target.getAttribute('data-view') || e.target.closest('button').getAttribute('data-view');
    
    // Update active state
    viewToggleButtons.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Toggle view
    if (view === 'grid') {
        gallery.classList.remove('gallery-list');
        gallery.classList.add('gallery-grid');
    } else {
        gallery.classList.remove('gallery-grid');
        gallery.classList.add('gallery-list');
    }
}

// Utility Functions
function updateGalleryStats() {
    imageCount.textContent = `${images.length} image${images.length !== 1 ? 's' : ''}`;
    lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
}

function formatFileSize(filename) {
    // This is a simplified version since we don't have actual file size
    // In a real app, you'd get this from the server
    return 'Unknown size';
}

function showLoading(show) {
    if (show) {
        loadingOverlay.style.display = 'flex';
    } else {
        loadingOverlay.style.display = 'none';
    }
}

function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Image Viewer (Modal)
function openImageViewer(imageName) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeImageViewer(this)"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="closeImageViewer(this)">
                <i class="fas fa-times"></i>
            </button>
            <img src="/images/${imageName}" alt="${imageName}" class="modal-image">
            <div class="modal-footer">
                <span class="modal-filename">${imageName}</span>
                <a href="/images/${imageName}" class="modal-download" download>
                    <i class="fas fa-download"></i> Download
                </a>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function closeImageViewer(element) {
    const modal = element.closest('.image-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

// Add modal styles to head
const modalStyles = `
<style>
.image-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    cursor: pointer;
}

.modal-content {
    position: relative;
    background: var(--card-bg);
    border-radius: 12px;
    max-width: 90vw;
    max-height: 90vh;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    animation: modalSlideIn 0.3s ease;
}

.modal-close {
    position: absolute;
    top: 15px;
    right: 15px;
    background: rgba(0, 0, 0, 0.5);
    border: none;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition);
}

.modal-close:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
}

.modal-image {
    max-width: 100%;
    max-height: 70vh;
    display: block;
    margin: 0 auto;
    background: #000;
}

.modal-footer {
    padding: 15px 20px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--card-bg);
}

.modal-filename {
    font-weight: 600;
    color: var(--text-color);
}

.modal-download {
    background: var(--primary-color);
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    transition: var(--transition);
    display: flex;
    align-items: center;
    gap: 8px;
}

.modal-download:hover {
    background: var(--primary-hover);
    transform: translateY(-1px);
}

@keyframes modalSlideIn {
    from {
        transform: translateY(-50px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@media (max-width: 768px) {
    .modal-content {
        max-width: 95vw;
        max-height: 85vh;
    }
    
    .modal-footer {
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', modalStyles);