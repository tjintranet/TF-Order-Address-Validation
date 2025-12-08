// TFUK Address Validator with Geoapify API
// Storage key for API key
const API_KEY_STORAGE = 'geoapify_api_key';

// Global state
let apiKey = null;
let addresses = [];
let validationResults = [];

// DOM Elements
const apiKeySection = document.getElementById('apiKeySection');
const apiKeySaved = document.getElementById('apiKeySaved');
const apiKeyInputDiv = document.getElementById('apiKeyInput');
const apiKeyField = document.getElementById('apiKeyField');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const toggleApiKeyBtn = document.getElementById('toggleApiKey');
const changeApiKeyBtn = document.getElementById('changeApiKey');
const uploadSection = document.getElementById('uploadSection');
const fileInput = document.getElementById('fileInput');
const progressSection = document.getElementById('progressSection');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const controlsSection = document.getElementById('controlsSection');
const statsSection = document.getElementById('statsSection');
const addressesSection = document.getElementById('addressesSection');
const addressesContainer = document.getElementById('addressesContainer');
const hideValidToggle = document.getElementById('hideValidToggle');
const copyInvalidBtn = document.getElementById('copyInvalidBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');

// Statistics elements
const totalAddressesEl = document.getElementById('totalAddresses');
const validAddressesEl = document.getElementById('validAddresses');
const invalidAddressesEl = document.getElementById('invalidAddresses');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadApiKey();
    setupEventListeners();
});

function setupEventListeners() {
    saveApiKeyBtn.addEventListener('click', saveApiKey);
    changeApiKeyBtn.addEventListener('click', showApiKeyInput);
    toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);
    fileInput.addEventListener('change', handleFileSelect);
    hideValidToggle.addEventListener('change', toggleValidAddresses);
    copyInvalidBtn.addEventListener('click', copyInvalidAddresses);
    exportCsvBtn.addEventListener('click', exportResultsCsv);
    
    // Allow Enter key to save API key
    apiKeyField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveApiKey();
        }
    });
}

// API Key Management
function loadApiKey() {
    const stored = localStorage.getItem(API_KEY_STORAGE);
    if (stored) {
        apiKey = stored;
        apiKeyField.value = stored;
        showApiKeySaved();
        uploadSection.style.display = 'block';
    }
}

function saveApiKey() {
    const key = apiKeyField.value.trim();
    if (!key) {
        showToast('Please enter an API key', 'danger');
        return;
    }
    
    apiKey = key;
    localStorage.setItem(API_KEY_STORAGE, key);
    showApiKeySaved();
    uploadSection.style.display = 'block';
    showToast('API key saved successfully', 'success');
}

function showApiKeySaved() {
    apiKeyInputDiv.style.display = 'none';
    apiKeySaved.style.display = 'block';
}

function showApiKeyInput() {
    apiKeySaved.style.display = 'none';
    apiKeyInputDiv.style.display = 'block';
    apiKeyField.focus();
}

function toggleApiKeyVisibility() {
    const type = apiKeyField.type === 'password' ? 'text' : 'password';
    apiKeyField.type = type;
    const icon = toggleApiKeyBtn.querySelector('i');
    icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
}

// File Handling
async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!apiKey) {
        showToast('Please save your API key first', 'danger');
        fileInput.value = '';
        return;
    }
    
    if (!file.name.toLowerCase().endsWith('.txt')) {
        showToast('Please select a .txt file', 'danger');
        fileInput.value = '';
        return;
    }
    
    try {
        const text = await file.text();
        addresses = parseTFUKFile(text);
        
        if (addresses.length === 0) {
            showToast('No valid addresses found in TFUK file', 'warning');
            return;
        }
        
        showToast(`Loaded ${addresses.length} addresses from TFUK file`, 'success');
        await validateAddresses();
        
    } catch (error) {
        showToast(`Error reading file: ${error.message}`, 'danger');
        console.error(error);
    }
}

// TFUK EDI File Parsing
function parseTFUKFile(text) {
    const lines = text.split('\n');
    const extractedAddresses = [];
    let orderNumber = '';
    let lineNumber = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].replace('\r', '');
        lineNumber = i + 1;
        
        // Skip header and footer
        if (line.startsWith('$$HDR') || line.startsWith('$$EOF')) {
            continue;
        }
        
        // Track current order number from H1 records
        if (line.startsWith('H1')) {
            orderNumber = line.substring(2, 17).trim();
        }
        
        // Parse H2 records (customer/address information)
        if (line.startsWith('H2')) {
            const address = parseH2Record(line, orderNumber, lineNumber);
            if (address) {
                extractedAddresses.push(address);
            }
        }
    }
    
    return extractedAddresses;
}

function parseH2Record(line, orderNumber, lineNumber) {
    try {
        // Fixed-width field positions based on TFUK specification
        const customerCode = line.substring(17, 35).trim();
        const customerName = line.substring(35, 85).trim();
        const addressLine1 = line.substring(85, 135).trim();
        const addressLine2 = line.substring(135, 185).trim();
        const addressLine3 = line.substring(185, 235).trim();
        const email = line.substring(235, 285).trim();
        const city = line.substring(285, 320).trim();
        
        // Postcode extraction (more complex due to variable formatting)
        const rawPostcodeField = line.substring(320, 340);
        const rawCountryPhone = line.substring(330, 359);
        
        let postcode = '';
        let country = '';
        let phone = '';
        
        // Try to separate postcode from country code
        const postcodeMatch = rawPostcodeField.match(/\s*([A-Z0-9\s-]+?)\s+([A-Z]{3})/);
        
        if (postcodeMatch) {
            postcode = postcodeMatch[1].trim();
        } else {
            // Fallback: extract UK postcode pattern or use first part
            const cleanField = rawPostcodeField.trim();
            const ukPattern = /^([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/;
            const ukMatch = cleanField.match(ukPattern);
            
            if (ukMatch) {
                postcode = ukMatch[1].trim();
            } else {
                // For international postcodes
                const parts = cleanField.split(/\s+([A-Z]{3})/);
                postcode = parts[0] || cleanField.substring(0, 10).trim();
            }
        }
        
        // Extract country code (3-letter code like GBR, USA, etc.)
        const countryMatch = rawCountryPhone.match(/([A-Z]{3})/);
        if (countryMatch) {
            country = countryMatch[1];
        }
        
        // Extract phone number (after country code)
        const phoneMatch = rawCountryPhone.match(/[A-Z]{3}([\d\s+()-]+)/);
        if (phoneMatch) {
            phone = phoneMatch[1].trim();
        }
        
        // Only create address if we have at least name or address line 1
        if (!customerName && !addressLine1) {
            return null;
        }
        
        return {
            lineNumber: lineNumber,
            orderNumber: orderNumber,
            customerCode: customerCode,
            name: customerName,
            address1: addressLine1,
            address2: addressLine2,
            address3: addressLine3,
            city: city,
            state: '', // TFUK format doesn't have explicit state field
            postcode: postcode,
            country: country,
            phone: phone,
            email: email
        };
        
    } catch (error) {
        console.error(`Error parsing H2 record at line ${lineNumber}:`, error);
        return null;
    }
}

// Address Validation
async function validateAddresses() {
    validationResults = [];
    progressSection.style.display = 'block';
    controlsSection.style.display = 'none';
    statsSection.style.display = 'none';
    addressesSection.style.display = 'none';
    
    // Reset the toggle to show all addresses when new file is loaded
    hideValidToggle.checked = false;
    
    const total = addresses.length;
    
    for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];
        
        // Update progress
        progressBar.style.width = `${((i + 1) / total) * 100}%`;
        progressText.textContent = `${i + 1} / ${total}`;
        
        // Validate with Geoapify
        const result = await validateAddress(address);
        validationResults.push(result);
        
        // Small delay to respect rate limits (free tier: 3000/day)
        await sleep(350); // ~170 addresses/minute
    }
    
    progressSection.style.display = 'none';
    displayResults();
}

async function validateAddress(address) {
    const result = {
        ...address,
        status: 'error',
        confidence: 0,
        errors: [],
        warnings: [],
        formattedAddress: null,
        lat: null,
        lon: null,
        apiResponse: null
    };
    
    try {
        // FIRST: Check for required fields (before API call)
        const missingFields = [];
        
        if (!address.postcode || address.postcode.trim() === '') {
            missingFields.push('Postcode');
        }
        if (!address.country || address.country.trim() === '') {
            missingFields.push('Country Code');
        }
        
        // Check if this is an Amazon order (skip email validation for Amazon)
        const isAmazonOrder = address.name && address.name.toLowerCase().includes('amazon');
        
        if (!isAmazonOrder) {
            if (!address.email || address.email.trim() === '') {
                missingFields.push('Email');
            }
        }
        
        if (!address.phone || address.phone.trim() === '') {
            missingFields.push('Phone');
        }
        
        // If any required fields are missing, mark as error and don't call API
        if (missingFields.length > 0) {
            result.errors.push(`Missing required fields: ${missingFields.join(', ')}`);
            result.status = 'error';
            return result;
        }
        
        // Build search text from TFUK address components with sanitization
        const sanitize = (str) => {
            if (!str) return '';
            // Remove special characters that might cause API issues
            return str.trim()
                .replace(/[^\w\s,.-]/g, ' ')  // Keep only alphanumeric, spaces, commas, periods, hyphens
                .replace(/\s+/g, ' ')          // Collapse multiple spaces
                .trim();
        };
        
        const searchParts = [
            sanitize(address.address1),
            sanitize(address.address2),
            sanitize(address.address3),
            sanitize(address.city),
            sanitize(address.postcode),
            sanitize(address.country)
        ].filter(p => p);
        
        const searchText = searchParts.join(', ');
        
        if (!searchText) {
            result.errors.push('No address data provided');
            return result;
        }
        
        // Try API call with retry logic for 500 errors
        let retryCount = 0;
        let maxRetries = 2;
        let apiSuccess = false;
        
        while (retryCount <= maxRetries && !apiSuccess) {
            try {
                // Call Geoapify Geocoding API
                const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(searchText)}&apiKey=${apiKey}`;
                const response = await fetch(url);
                
                if (!response.ok) {
                    if (response.status === 401) {
                        result.errors.push('Invalid API key');
                        return result;
                    } else if (response.status === 429) {
                        result.errors.push('Rate limit exceeded');
                        return result;
                    } else if (response.status === 500) {
                        // Try simplified search on retry
                        if (retryCount < maxRetries) {
                            retryCount++;
                            await sleep(500); // Wait before retry
                            
                            // Try with just postcode and country for simplified search
                            if (retryCount === maxRetries) {
                                const simplifiedParts = [
                                    sanitize(address.postcode),
                                    sanitize(address.country)
                                ].filter(p => p);
                                const simplifiedUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(simplifiedParts.join(', '))}&apiKey=${apiKey}`;
                                const retryResponse = await fetch(simplifiedUrl);
                                
                                if (retryResponse.ok) {
                                    const data = await retryResponse.json();
                                    if (data.features && data.features.length > 0) {
                                        result.apiResponse = data;
                                        const match = data.features[0];
                                        const props = match.properties;
                                        
                                        result.confidence = props.rank?.confidence || 0;
                                        result.lat = match.geometry.coordinates[1];
                                        result.lon = match.geometry.coordinates[0];
                                        result.formattedAddress = props.formatted || searchText;
                                        result.status = 'success';
                                        apiSuccess = true;
                                    } else {
                                        result.errors.push('Address not found by Geoapify (simplified search)');
                                        result.status = 'error';
                                        return result;
                                    }
                                } else {
                                    result.errors.push(`API Error: ${response.status} - Unable to validate address`);
                                    result.status = 'error';
                                    return result;
                                }
                            }
                            continue;
                        } else {
                            result.errors.push('API Error: 500 - Server error, address may contain invalid characters');
                            result.status = 'error';
                            return result;
                        }
                    } else {
                        result.errors.push(`API Error: ${response.status} ${response.statusText}`);
                        return result;
                    }
                }
                
                const data = await response.json();
                result.apiResponse = data;
                
                // Check if address was found
                if (!data.features || data.features.length === 0) {
                    result.errors.push('Address not found by Geoapify');
                    result.status = 'error';
                    return result;
                }
                
                // Get best match
                const match = data.features[0];
                const props = match.properties;
                
                // Extract confidence score
                result.confidence = props.rank?.confidence || 0;
                
                // Store coordinates
                result.lat = match.geometry.coordinates[1];
                result.lon = match.geometry.coordinates[0];
                
                // Build formatted address
                result.formattedAddress = props.formatted || searchText;
                
                // Mark as valid - ignore all Geoapify warnings
                result.status = 'success';
                apiSuccess = true;
                
            } catch (fetchError) {
                if (retryCount < maxRetries) {
                    retryCount++;
                    await sleep(500);
                } else {
                    throw fetchError;
                }
            }
        }
        
    } catch (error) {
        result.errors.push(`Validation error: ${error.message}`);
        result.status = 'error';
    }
    
    return result;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Display Results
function displayResults() {
    // Calculate statistics
    const stats = {
        total: validationResults.length,
        valid: validationResults.filter(r => r.status === 'success').length,
        invalid: validationResults.filter(r => r.status === 'error').length
    };
    
    // Update statistics
    totalAddressesEl.textContent = stats.total;
    validAddressesEl.textContent = stats.valid;
    invalidAddressesEl.textContent = stats.invalid;
    
    // Show sections
    statsSection.style.display = 'block';
    controlsSection.style.display = 'block';
    addressesSection.style.display = 'block';
    
    // Render addresses
    renderAddresses();
    
    // Show summary toast
    showToast(`Validation complete: ${stats.valid} valid, ${stats.invalid} invalid`, 'info');
}

function renderAddresses() {
    addressesContainer.innerHTML = '';
    
    validationResults.forEach((result, index) => {
        const card = createAddressCard(result, index);
        addressesContainer.appendChild(card);
    });
}

function createAddressCard(result, index) {
    const card = document.createElement('div');
    card.className = `address-card validation-${result.status}`;
    card.dataset.status = result.status;
    
    // Status badge - only success or error
    const statusBadge = result.status === 'success' ? 
        '<span class="badge bg-success badge-result">Valid</span>' :
        '<span class="badge bg-danger badge-result">Invalid</span>';
    
    // Confidence indicator
    const confidencePercent = (result.confidence * 100).toFixed(0);
    const confidenceColor = result.status === 'success' ? 'success' : 'danger';
    
    // Header
    const header = document.createElement('div');
    header.className = 'address-header';
    header.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div>
                <h5 class="mb-1">
                    <i class="fas fa-map-marker-alt me-2"></i>
                    ${escapeHtml(result.name || 'Order ' + result.orderNumber)}
                </h5>
                <small class="text-muted">Order: ${escapeHtml(result.orderNumber)} | Line: ${result.lineNumber}</small>
            </div>
            <div class="text-end">
                ${statusBadge}
                ${result.confidence > 0 ? `<div class="mt-2">
                    <small class="text-muted">Confidence: </small>
                    <span class="badge bg-${confidenceColor}">${confidencePercent}%</span>
                </div>` : ''}
            </div>
        </div>
    `;
    
    // Details
    const details = document.createElement('div');
    details.className = 'address-details';
    
    let detailsHTML = '<div class="row"><div class="col-md-6">';
    detailsHTML += '<h6 class="mb-3"><i class="fas fa-file-alt me-2"></i>Input Address (TFUK)</h6>';
    
    // Input address
    if (result.customerCode) detailsHTML += `<div class="detail-row"><span class="detail-label">Customer Code:</span> <span class="detail-value">${escapeHtml(result.customerCode)}</span></div>`;
    if (result.address1) detailsHTML += `<div class="detail-row"><span class="detail-label">Address 1:</span> <span class="detail-value">${escapeHtml(result.address1)}</span></div>`;
    if (result.address2) detailsHTML += `<div class="detail-row"><span class="detail-label">Address 2:</span> <span class="detail-value">${escapeHtml(result.address2)}</span></div>`;
    if (result.address3) detailsHTML += `<div class="detail-row"><span class="detail-label">Address 3:</span> <span class="detail-value">${escapeHtml(result.address3)}</span></div>`;
    if (result.city) detailsHTML += `<div class="detail-row"><span class="detail-label">City:</span> <span class="detail-value">${escapeHtml(result.city)}</span></div>`;
    if (result.postcode) detailsHTML += `<div class="detail-row"><span class="detail-label">Postcode:</span> <span class="detail-value">${escapeHtml(result.postcode)}</span></div>`;
    if (result.country) detailsHTML += `<div class="detail-row"><span class="detail-label">Country:</span> <span class="detail-value">${escapeHtml(result.country)}</span></div>`;
    if (result.email) detailsHTML += `<div class="detail-row"><span class="detail-label">Email:</span> <span class="detail-value">${escapeHtml(result.email)}</span></div>`;
    if (result.phone) detailsHTML += `<div class="detail-row"><span class="detail-label">Phone:</span> <span class="detail-value">${escapeHtml(result.phone)}</span></div>`;
    
    detailsHTML += '</div><div class="col-md-6">';
    
    // Validated result
    if (result.formattedAddress) {
        detailsHTML += '<h6 class="mb-3"><i class="fas fa-check-circle me-2"></i>Validated Address</h6>';
        detailsHTML += `<div class="formatted-address">${escapeHtml(result.formattedAddress)}</div>`;
        
        if (result.lat && result.lon) {
            detailsHTML += `<div class="detail-row mt-2">
                <span class="detail-label">Coordinates:</span> 
                <span class="detail-value">
                    <a href="https://www.google.com/maps?q=${result.lat},${result.lon}" target="_blank">
                        ${result.lat.toFixed(6)}, ${result.lon.toFixed(6)} <i class="fas fa-external-link-alt ms-1"></i>
                    </a>
                </span>
            </div>`;
        }
    }
    
    detailsHTML += '</div></div>';
    
    // Errors only (no warnings)
    if (result.errors.length > 0) {
        detailsHTML += '<div class="mt-3">';
        detailsHTML += '<div class="alert alert-danger mb-0">';
        detailsHTML += '<strong><i class="fas fa-exclamation-circle me-2"></i>Errors:</strong><ul class="mb-0 mt-2">';
        result.errors.forEach(err => {
            detailsHTML += `<li>${escapeHtml(err)}</li>`;
        });
        detailsHTML += '</ul></div>';
        detailsHTML += '</div>';
    }
    
    // Copy button
    detailsHTML += `
        <div class="mt-3 text-end">
            <button class="btn btn-sm btn-outline-secondary copy-btn" onclick="copyAddressDetails(${index})">
                <i class="fas fa-copy me-1"></i>Copy Details
            </button>
        </div>
    `;
    
    details.innerHTML = detailsHTML;
    
    card.appendChild(header);
    card.appendChild(details);
    
    return card;
}

// Toggle Valid Addresses
function toggleValidAddresses() {
    const hideValid = hideValidToggle.checked;
    const cards = document.querySelectorAll('.address-card');
    
    cards.forEach(card => {
        if (hideValid && card.dataset.status === 'success') {
            card.style.display = 'none';
        } else {
            card.style.display = 'block';
        }
    });
}

// Copy Functions
function copyAddressDetails(index) {
    const result = validationResults[index];
    let text = `TFUK Address Validation Result\n`;
    text += `==============================\n\n`;
    text += `Order: ${result.orderNumber}\n`;
    text += `Line: ${result.lineNumber}\n`;
    text += `Customer: ${result.name}\n`;
    text += `Customer Code: ${result.customerCode}\n`;
    text += `Status: ${result.status}\n`;
    text += `Confidence: ${(result.confidence * 100).toFixed(0)}%\n\n`;
    
    text += `Input Address:\n`;
    if (result.address1) text += `  ${result.address1}\n`;
    if (result.address2) text += `  ${result.address2}\n`;
    if (result.address3) text += `  ${result.address3}\n`;
    if (result.city) text += `  ${result.city}\n`;
    if (result.postcode) text += `  ${result.postcode}\n`;
    if (result.country) text += `  ${result.country}\n`;
    if (result.email) text += `  Email: ${result.email}\n`;
    if (result.phone) text += `  Phone: ${result.phone}\n`;
    
    if (result.formattedAddress) {
        text += `\nValidated Address:\n  ${result.formattedAddress}\n`;
    }
    
    if (result.lat && result.lon) {
        text += `\nCoordinates: ${result.lat.toFixed(6)}, ${result.lon.toFixed(6)}\n`;
    }
    
    if (result.errors.length > 0) {
        text += `\nErrors:\n`;
        result.errors.forEach(err => text += `  - ${err}\n`);
    }
    
    copyToClipboard(text);
    showToast('Address details copied to clipboard', 'success');
}

function copyInvalidAddresses() {
    const invalid = validationResults.filter(r => r.status === 'error');
    
    if (invalid.length === 0) {
        showToast('No invalid addresses to copy', 'info');
        return;
    }
    
    let text = `TFUK Invalid Addresses Report\n`;
    text += `==============================\n`;
    text += `Total: ${invalid.length}\n\n`;
    
    invalid.forEach((result, idx) => {
        text += `${idx + 1}. Order ${result.orderNumber} - ${result.name || 'Unnamed'}\n`;
        text += `   Line: ${result.lineNumber}\n`;
        text += `   Address: ${result.address1}${result.address2 ? ', ' + result.address2 : ''}, ${result.city}, ${result.postcode}\n`;
        
        if (result.errors.length > 0) {
            text += `   Errors: ${result.errors.join('; ')}\n`;
        }
        text += `\n`;
    });
    
    copyToClipboard(text);
    showToast(`Copied ${invalid.length} invalid addresses`, 'success');
}

// Export CSV
function exportResultsCsv() {
    let csv = 'Order,Line,Customer Code,Name,Address1,Address2,Address3,City,Postcode,Country,Email,Phone,Status,Confidence,Formatted Address,Latitude,Longitude,Errors\n';
    
    validationResults.forEach(result => {
        const row = [
            result.orderNumber,
            result.lineNumber,
            result.customerCode,
            result.name,
            result.address1,
            result.address2,
            result.address3,
            result.city,
            result.postcode,
            result.country,
            result.email,
            result.phone,
            result.status,
            (result.confidence * 100).toFixed(0) + '%',
            result.formattedAddress || '',
            result.lat || '',
            result.lon || '',
            result.errors.join('; ')
        ].map(v => `"${String(v).replace(/"/g, '""')}"`);
        
        csv += row.join(',') + '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tfuk-address-validation-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Results exported to CSV', 'success');
}

// Utilities
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy to clipboard', 'danger');
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${escapeHtml(message)}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.getElementById('toastContainer').appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Make copyAddressDetails available globally
window.copyAddressDetails = copyAddressDetails;