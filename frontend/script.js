// DOM Elements
const medicineInput = document.getElementById('medicineInput');
const clearBtn = document.getElementById('clearBtn');
const checkBtn = document.getElementById('checkBtn');
const suggestionsDiv = document.getElementById('suggestions');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const errorModal = document.getElementById('errorModal');
const modalClose = document.getElementById('modalClose');
const modalOk = document.getElementById('modalOk');
const errorMessage = document.getElementById('errorMessage');

// Navigation elements
const checkerTab = document.getElementById('checkerTab');
const cabinetTab = document.getElementById('cabinetTab');
const checkerSection = document.getElementById('checkerSection');
const cabinetSection = document.getElementById('cabinetSection');
const cabinetCount = document.getElementById('cabinetCount');

// Result elements
const statusIndicator = document.getElementById('statusIndicator');
const resultTitle = document.getElementById('resultTitle');
const analyzedMedicine = document.getElementById('analyzedMedicine');
const statusBadge = document.getElementById('statusBadge');
const statusText = document.getElementById('statusText');
const statusDescription = document.getElementById('statusDescription');
const detailsContent = document.getElementById('detailsContent');
const ingredientsList = document.getElementById('ingredientsList');
const addToCabinetBtn = document.getElementById('addToCabinetBtn');
const checkAnotherBtn = document.getElementById('checkAnotherBtn');

// Cabinet elements
const clearCabinetBtn = document.getElementById('clearCabinetBtn');
const exportCabinetBtn = document.getElementById('exportCabinetBtn');
const safeCount = document.getElementById('safeCount');
const warningCount = document.getElementById('warningCount');
const dangerCount = document.getElementById('dangerCount');
const filterTabs = document.querySelectorAll('.filter-tab');
const cabinetSearch = document.getElementById('cabinetSearch');
const searchClear = document.getElementById('searchClear');
const emptyCabinet = document.getElementById('emptyCabinet');
const medicineGrid = document.getElementById('medicineGrid');
const startCheckingBtn = document.getElementById('startCheckingBtn');

// Debug: Check if filter tabs are found
console.log('Filter tabs found:', filterTabs.length);
filterTabs.forEach((tab, i) => console.log(`Tab ${i}:`, tab.textContent, tab.dataset.filter));

// API Configuration
const API_BASE_URL = 'http://localhost:5000';

// Global variables
let currentMedicineResult = null;
let medicineCabinet = [];
let currentFilter = 'all';

// Helper function to map API status to frontend status
function mapApiStatusToFrontend(apiStatus) {
    const statusMap = {
        'Safe': 'safe',
        'Restricted': 'warning',
        'Prohibited': 'danger'
    };
    return statusMap[apiStatus] || 'safe';
}

// Sample medicine suggestions for demo
const medicineSuggestions = [
    'Aspirin',
    'Ibuprofen',
    'Acetaminophen',
    'Testosterone',
    'Insulin',
    'Prednisone',
    'Salbutamol',
    'Caffeine',
    'Pseudoephedrine',
    'Modafinil',
    'Methylprednisolone',
    'Dextroamphetamine',
    'Ephedrine',
    'Clenbuterol',
    'Anavar',
    'Winstrol'
];

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Load medicine cabinet from localStorage
    loadMedicineCabinet();
    
    // Input event listeners
    medicineInput.addEventListener('input', handleInputChange);
    medicineInput.addEventListener('keypress', handleKeyPress);
    medicineInput.addEventListener('focus', handleInputFocus);
    medicineInput.addEventListener('blur', handleInputBlur);
    
    // Button event listeners
    clearBtn.addEventListener('click', clearInput);
    checkBtn.addEventListener('click', checkMedicine);
    addToCabinetBtn.addEventListener('click', addToCabinet);
    checkAnotherBtn.addEventListener('click', checkAnother);
    
    // Navigation event listeners
    checkerTab.addEventListener('click', () => switchTab('checker'));
    cabinetTab.addEventListener('click', () => switchTab('cabinet'));
    startCheckingBtn.addEventListener('click', () => switchTab('checker'));
    
    // Cabinet event listeners
    clearCabinetBtn.addEventListener('click', clearCabinet);
    exportCabinetBtn.addEventListener('click', exportCabinet);
    cabinetSearch.addEventListener('input', filterMedicines);
    cabinetSearch.addEventListener('input', updateSearchState);
    searchClear.addEventListener('click', clearSearch);
    
    // Filter tabs
    console.log('Setting up filter tabs. Found:', filterTabs.length, 'tabs');
    filterTabs.forEach((tab, index) => {
        console.log(`Tab ${index}:`, tab.textContent, 'data-filter:', tab.dataset.filter);
        tab.addEventListener('click', (e) => {
            console.log('Filter tab clicked:', tab.dataset.filter, 'Event target:', e.target);
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            console.log('Current filter set to:', currentFilter);
            filterMedicines();
        });
    });
    
    // Modal event listeners
    modalClose.addEventListener('click', closeModal);
    modalOk.addEventListener('click', closeModal);
    
    // Click outside modal to close
    errorModal.addEventListener('click', function(e) {
        if (e.target === errorModal) {
            closeModal();
        }
    });
    
    // Click outside suggestions to hide
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.input-wrapper') && !e.target.closest('.suggestions')) {
            hideSuggestions();
        }
    });
    
    // Initialize cabinet display
    updateCabinetDisplay();
}

function handleInputChange() {
    const value = medicineInput.value.trim();
    
    // Show/hide clear button
    if (value) {
        clearBtn.classList.add('show');
        showSuggestions(value);
    } else {
        clearBtn.classList.remove('show');
        hideSuggestions();
    }
    
    // Enable/disable check button
    checkBtn.disabled = !value;
}

function handleKeyPress(e) {
    if (e.key === 'Enter' && medicineInput.value.trim()) {
        checkMedicine();
    }
}

function handleInputFocus() {
    const value = medicineInput.value.trim();
    if (value) {
        showSuggestions(value);
    }
}

function handleInputBlur() {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
        hideSuggestions();
    }, 150);
}

function showSuggestions(query) {
    const filteredSuggestions = medicineSuggestions.filter(medicine =>
        medicine.toLowerCase().includes(query.toLowerCase())
    );
    
    if (filteredSuggestions.length > 0 && query.length > 0) {
        suggestionsDiv.innerHTML = filteredSuggestions
            .slice(0, 5) // Show max 5 suggestions
            .map(suggestion => `
                <div class="suggestion-item" onclick="selectSuggestion('${suggestion}')">
                    ${suggestion}
                </div>
            `).join('');
        suggestionsDiv.style.display = 'block';
    } else {
        hideSuggestions();
    }
}

function hideSuggestions() {
    suggestionsDiv.style.display = 'none';
}

function selectSuggestion(suggestion) {
    medicineInput.value = suggestion;
    hideSuggestions();
    clearBtn.classList.add('show');
    checkBtn.disabled = false;
    medicineInput.focus();
}

function clearInput() {
    medicineInput.value = '';
    clearBtn.classList.remove('show');
    checkBtn.disabled = true;
    hideSuggestions();
    hideResults();
    medicineInput.focus();
}

async function checkMedicine() {
    const medicineName = medicineInput.value.trim();
    
    if (!medicineName) {
        showError('Please enter a medicine name.');
        return;
    }
    
    // Hide previous results and show loading
    hideResults();
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/medicines/check`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                medicine: medicineName,
                context: {
                    inCompetition: true, // You can add UI controls for this later
                    sport: 'General'
                },
                options: {
                    useCache: false, // Force fresh analysis to test our changes
                    forceRecheck: true
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            displayResults(data.data);
        } else {
            // Check if it's an invalid medicine name error
            if (response.status === 422 && data.error && 
                (data.error.includes('Unknown or invalid medicine') || 
                 data.error.includes('does not appear to be a valid medicine name') ||
                 data.details && data.details.includes('does not appear to be a valid medicine name'))) {
                
                showInvalidMedicineMessage(medicine);
                return;
            }
            throw new Error(data.error || 'Failed to analyze medicine');
        }
        
    } catch (error) {
        console.error('Error checking medicine:', error);
        hideLoading();
        
        // Check if it's a network error (backend not running)
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showError('Unable to connect to the server. Please make sure the backend is running on port 5000.');
        } else {
            showError(`Error analyzing medicine: ${error.message}`);
        }
    }
}

function showLoading() {
    loadingSection.classList.add('show');
    checkBtn.disabled = true;
}

function hideLoading() {
    loadingSection.classList.remove('show');
    checkBtn.disabled = false;
}

function showResults() {
    resultsSection.classList.add('show');
}

function hideResults() {
    resultsSection.classList.remove('show');
}

function displayResults(response) {
    hideLoading();
    
    // Map API response to frontend format
    const mappedResponse = {
        name: response.medicine || medicineInput.value,
        status: mapApiStatusToFrontend(response.status),
        title: response.title,
        description: response.description,
        details: response.details,
        ingredients: response.ingredients || [],
        dateChecked: new Date().toISOString(),
        confidence: response.confidence,
        riskLevel: response.riskLevel,
        warnings: response.warnings || [],
        recommendations: response.recommendations || []
    };
    
    // Store current result for cabinet addition
    currentMedicineResult = mappedResponse;
    
    // Update medicine name
    analyzedMedicine.textContent = mappedResponse.name;
    
    // Update status indicator
    statusIndicator.className = `status-indicator ${mappedResponse.status}`;
    statusIndicator.innerHTML = getStatusIcon(mappedResponse.status);
    
    // Update status badge
    statusBadge.className = `status-badge ${mappedResponse.status}`;
    statusText.textContent = mappedResponse.title.toUpperCase();
    statusDescription.textContent = mappedResponse.description;
    
    // Update details with additional information
    const detailsHtml = `
        <div class="analysis-details">
            <p>${mappedResponse.details}</p>
            ${mappedResponse.confidence ? `<p><strong>Analysis Confidence:</strong> ${mappedResponse.confidence}%</p>` : ''}
            ${mappedResponse.riskLevel ? `<p><strong>Risk Level:</strong> ${mappedResponse.riskLevel}</p>` : ''}
            ${mappedResponse.warnings.length > 0 ? `
                <div class="warnings">
                    <strong>Warnings:</strong>
                    <ul>
                        ${mappedResponse.warnings.map(warning => `<li>${warning}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            ${mappedResponse.recommendations.length > 0 ? `
                <div class="recommendations">
                    <strong>Recommendations:</strong>
                    <ul>
                        ${mappedResponse.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
    detailsContent.innerHTML = detailsHtml;
    
    // Update ingredients
    if (mappedResponse.ingredients.length > 0) {
        ingredientsList.innerHTML = mappedResponse.ingredients.map(ingredient => {
            let ingredientDescription = ingredient.description;
            
            // Enhanced messaging for derivative matches
            if (ingredient.matchType === 'Derivative') {
                ingredientDescription = `⚠️ Contains banned substance: ${ingredient.bannedSubstance}. ${ingredient.description}`;
            }
            
            return `
                <div class="ingredient-item">
                    <div class="ingredient-status ${ingredient.status}">
                        ${getStatusIcon(ingredient.status)}
                    </div>
                    <div class="ingredient-info">
                        <h5>${ingredient.name}</h5>
                        <p>${ingredientDescription}</p>
                        ${ingredient.matchType === 'Derivative' ? '<p class="derivative-warning">This ingredient is a derivative/compound of a prohibited substance.</p>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    } else {
        ingredientsList.innerHTML = '<p>No specific ingredient information available.</p>';
    }
    
    // Check if medicine is already in cabinet
    const isInCabinet = medicineCabinet.some(med => 
        med.name.toLowerCase() === currentMedicineResult.name.toLowerCase()
    );
    
    if (isInCabinet) {
        addToCabinetBtn.innerHTML = '<i class="fas fa-check"></i> Already in Cabinet';
        addToCabinetBtn.disabled = true;
    } else {
        addToCabinetBtn.innerHTML = '<i class="fas fa-plus"></i> Add to Cabinet';
        addToCabinetBtn.disabled = false;
    }
    
    showResults();
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function getStatusIcon(status) {
    switch (status) {
        case 'safe':
            return '<i class="fas fa-check-circle"></i>';
        case 'warning':
            return '<i class="fas fa-exclamation-triangle"></i>';
        case 'danger':
            return '<i class="fas fa-times-circle"></i>';
        default:
            return '<i class="fas fa-question-circle"></i>';
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorModal.classList.add('flex-show');
}

function showInvalidMedicineMessage(medicineName) {
    // Hide loading and show results section
    hideLoading();
    resultsSection.style.display = 'block';
    
    // Set status to invalid
    statusIndicator.className = 'status-indicator danger';
    resultTitle.textContent = 'Invalid Medicine Name';
    analyzedMedicine.textContent = medicineName;
    
    // Set status badge
    statusBadge.className = 'status-badge danger';
    statusBadge.innerHTML = '<i class="fas fa-times-circle"></i> Invalid';
    
    // Show simple message
    statusText.textContent = 'Wrong Medicine Name';
    statusDescription.textContent = 'Please enter a valid medicine name and try again.';
    
    // Clear other sections
    detailsContent.innerHTML = '';
    ingredientsList.innerHTML = '';
    
    // Hide add to cabinet button since it's not a valid medicine
    addToCabinetBtn.style.display = 'none';
    
    // Show check another button
    checkAnotherBtn.style.display = 'inline-block';
}

function closeModal() {
    errorModal.classList.remove('flex-show');
}

// Navigation Functions
function switchTab(tab) {
    if (tab === 'checker') {
        checkerTab.classList.add('active');
        cabinetTab.classList.remove('active');
        checkerSection.style.display = 'block';
        cabinetSection.classList.remove('active');
    } else {
        cabinetTab.classList.add('active');
        checkerTab.classList.remove('active');
        checkerSection.style.display = 'none';
        cabinetSection.classList.add('active');
    }
}

function checkAnother() {
    clearInput();
    hideResults();
    switchTab('checker');
}

// Medicine Cabinet Functions
function loadMedicineCabinet() {
    const stored = localStorage.getItem('medicineCabinet');
    if (stored) {
        medicineCabinet = JSON.parse(stored);
    }
    updateCabinetCount();
}

function saveMedicineCabinet() {
    localStorage.setItem('medicineCabinet', JSON.stringify(medicineCabinet));
    updateCabinetCount();
    updateCabinetDisplay();
}

function updateCabinetCount() {
    cabinetCount.textContent = medicineCabinet.length;
}

function addToCabinet() {
    if (!currentMedicineResult) return;
    
    // Check if already exists
    const exists = medicineCabinet.some(med => 
        med.name.toLowerCase() === currentMedicineResult.name.toLowerCase()
    );
    
    if (!exists) {
        medicineCabinet.unshift(currentMedicineResult);
        saveMedicineCabinet();
        
        // Update button state
        addToCabinetBtn.innerHTML = '<i class="fas fa-check"></i> Added to Cabinet';
        addToCabinetBtn.disabled = true;
        
        // Show success feedback
        setTimeout(() => {
            addToCabinetBtn.innerHTML = '<i class="fas fa-check"></i> Already in Cabinet';
        }, 2000);
    }
}

function removeMedicine(medicineName) {
    if (confirm(`Are you sure you want to remove "${medicineName}" from your cabinet?`)) {
        medicineCabinet = medicineCabinet.filter(med => med.name !== medicineName);
        saveMedicineCabinet();
    }
}

function clearCabinet() {
    if (medicineCabinet.length === 0) return;
    
    if (confirm('Are you sure you want to clear your entire medicine cabinet? This action cannot be undone.')) {
        medicineCabinet = [];
        saveMedicineCabinet();
    }
}

function exportCabinet() {
    if (medicineCabinet.length === 0) {
        showError('Your medicine cabinet is empty. Nothing to export.');
        return;
    }
    
    const exportData = {
        exportDate: new Date().toISOString(),
        totalMedicines: medicineCabinet.length,
        medicines: medicineCabinet.map(med => ({
            name: med.name,
            status: med.status,
            title: med.title,
            description: med.description,
            dateChecked: med.dateChecked
        }))
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `medicine-cabinet-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function updateCabinetDisplay() {
    updateCabinetStats();
    filterMedicines();
}

function updateCabinetStats() {
    const stats = medicineCabinet.reduce((acc, med) => {
        acc[med.status] = (acc[med.status] || 0) + 1;
        return acc;
    }, {});
    
    safeCount.textContent = stats.safe || 0;
    warningCount.textContent = stats.warning || 0;
    dangerCount.textContent = stats.danger || 0;
}

function filterMedicines() {
    const searchTerm = cabinetSearch.value.toLowerCase();
    let filteredMedicines = medicineCabinet;
    
    // Apply status filter
    if (currentFilter !== 'all') {
        console.log('Applying status filter for:', currentFilter);
        filteredMedicines = filteredMedicines.filter(med => {
            console.log('Medicine:', med.name, 'Status:', med.status, 'Match:', med.status === currentFilter);
            return med.status === currentFilter;
        });
    }
    
    // Apply search filter
    if (searchTerm) {
        filteredMedicines = filteredMedicines.filter(med =>
            med.name.toLowerCase().includes(searchTerm) ||
            med.description.toLowerCase().includes(searchTerm)
        );
    }
    
    console.log('Filtered medicines count:', filteredMedicines.length);
    displayMedicines(filteredMedicines);
}

function displayMedicines(medicines) {
    if (medicines.length === 0) {
        if (medicineCabinet.length === 0) {
            emptyCabinet.style.display = 'block';
            medicineGrid.style.display = 'none';
        } else {
            emptyCabinet.style.display = 'none';
            medicineGrid.style.display = 'grid';
            medicineGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #666;">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    No medicines match your current filters.
                </div>
            `;
        }
        return;
    }
    
    emptyCabinet.style.display = 'none';
    medicineGrid.style.display = 'grid';
    
    medicineGrid.innerHTML = medicines.map(medicine => `
        <div class="medicine-card">
            <div class="medicine-card-header">
                <div class="medicine-info">
                    <h4>${medicine.name}</h4>
                    <div class="medicine-date">
                        Checked: ${formatDate(medicine.dateChecked)}
                    </div>
                </div>
                <div class="medicine-status ${medicine.status}">
                    ${getStatusIcon(medicine.status)}
                </div>
            </div>
            
            <div class="medicine-description">
                ${medicine.description}
            </div>
            
            <div class="medicine-tags">
                <span class="medicine-tag">${medicine.title}</span>
                <span class="medicine-tag">${medicine.status.charAt(0).toUpperCase() + medicine.status.slice(1)}</span>
            </div>
            
            <div class="medicine-actions">
                <button class="action-btn" onclick="recheckMedicine('${medicine.name}')">
                    <i class="fas fa-sync-alt"></i>
                    Recheck
                </button>
                <button class="action-btn" onclick="viewDetails('${medicine.name}')">
                    <i class="fas fa-info-circle"></i>
                    Details
                </button>
                <button class="action-btn danger" onclick="removeMedicine('${medicine.name}')">
                    <i class="fas fa-trash"></i>
                    Remove
                </button>
            </div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function recheckMedicine(medicineName) {
    medicineInput.value = medicineName;
    checkMedicine();
    switchTab('checker');
}

function viewDetails(medicineName) {
    const medicine = medicineCabinet.find(med => med.name === medicineName);
    if (!medicine) return;
    
    // Create a modal or detailed view
    const detailModal = document.createElement('div');
    detailModal.className = 'modal';
    detailModal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3><i class="fas fa-pills"></i> ${medicine.name}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 1rem;">
                    <div class="status-badge ${medicine.status}" style="display: inline-block; margin-bottom: 1rem;">
                        ${medicine.title.toUpperCase()}
                    </div>
                </div>
                <p style="margin-bottom: 1rem;"><strong>Status:</strong> ${medicine.description}</p>
                <p style="margin-bottom: 1rem;"><strong>Details:</strong> ${medicine.details}</p>
                <p style="margin-bottom: 1rem;"><strong>Checked on:</strong> ${formatDate(medicine.dateChecked)}</p>
                
                <h4 style="margin: 1.5rem 0 1rem 0;">Key Ingredients:</h4>
                <div style="display: grid; gap: 0.5rem;">
                    ${medicine.ingredients.map(ingredient => `
                        <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #f8f9ff; border-radius: 6px;">
                            <span class="ingredient-status ${ingredient.status}" style="font-size: 1rem;">
                                ${getStatusIcon(ingredient.status)}
                            </span>
                            <div>
                                <strong>${ingredient.name}:</strong> ${ingredient.description}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(detailModal);
    detailModal.classList.add('flex-show');
}

// Search functionality for cabinet
function updateSearchState() {
    const searchFilter = document.querySelector('.search-filter');
    const hasText = cabinetSearch.value.trim().length > 0;
    
    if (hasText) {
        searchFilter.classList.add('has-text');
    } else {
        searchFilter.classList.remove('has-text');
    }
}

function clearSearch() {
    cabinetSearch.value = '';
    updateSearchState();
    filterMedicines();
}

// Initialize search state on page load
document.addEventListener('DOMContentLoaded', () => {
    updateSearchState();
});


