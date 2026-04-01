/**
 * hired_hub - Main Application Logic
 */

// ============================================
// State
// ============================================
let applications = [];
let filteredApps = [];
const currentFilter = { status: 'all', platform: 'all' };
let sortOrder = 'desc';
let editingId = null;
let pendingImportApps = [];

// ============================================
// DOM Elements
// ============================================
const addBtn = document.getElementById('addBtn');
const filterStatus = document.getElementById('filterStatus');
const filterPlatform = document.getElementById('filterPlatform');
const sortOrderSelect = document.getElementById('sortOrder');
const appList = document.getElementById('appList');
const emptyState = document.getElementById('emptyState');
const noResultsState = document.getElementById('noResultsState');
const exportCsvBtn = document.getElementById('exportCsv');
const exportJsonBtn = document.getElementById('exportJson');
const importCsvBtn = document.getElementById('importCsvBtn');
const importJsonBtn = document.getElementById('importJsonBtn');
const importCsvInput = document.getElementById('importCsv');
const importJsonInput = document.getElementById('importJson');
const importModal = document.getElementById('importModal');
const importCount = document.getElementById('importCount');
const importMergeBtn = document.getElementById('importMergeBtn');
const importReplaceBtn = document.getElementById('importReplaceBtn');
const importCancelBtn = document.getElementById('importCancelBtn');
const formModal = document.getElementById('formModal');
const modalTitle = document.getElementById('modalTitle');
const appForm = document.getElementById('appForm');
const cancelBtn = document.getElementById('cancelBtn');

// Form fields
const appIdInput = document.getElementById('appId');
const companyInput = document.getElementById('company');
const positionInput = document.getElementById('position');
const platformInput = document.getElementById('platform');
const statusInput = document.getElementById('status');
const dateAppliedInput = document.getElementById('dateApplied');
const salaryInput = document.getElementById('salary');
const linkInput = document.getElementById('link');
const notesInput = document.getElementById('notes');
const contactNameInput = document.getElementById('contactName');
const contactMediumInput = document.getElementById('contactMedium');
const contactValueInput = document.getElementById('contactValue');
const companyUrlInput = document.getElementById('companyUrl');

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadApplications();
  setupEventListeners();
  loadVersion();
}

function loadVersion() {
  try {
    const manifest = chrome.runtime.getManifest();
    const versionBadge = document.getElementById('versionBadge');
    if (versionBadge && manifest.version) {
      versionBadge.textContent = 'v' + manifest.version;
    }
  } catch (e) {
    void e;
  }
}

// ============================================
// Data Layer
// ============================================
async function loadApplications() {
  try {
    const data = await chrome.storage.sync.get('applications');
    applications = data.applications || [];
    applyFilters();
  } catch (error) {
    console.error('Failed to load applications:', error);
    showError('Failed to load applications. Please try again.');
  }
}

async function saveApplication(appData) {
  try {
    const now = new Date().toISOString();
    
    if (appData.id) {
      // Update existing
      const index = applications.findIndex(a => a.id === appData.id);
      if (index !== -1) {
        applications[index] = { 
          ...applications[index], 
          ...appData, 
          updatedAt: now 
        };
      }
    } else {
      // Add new
      appData.id = generateUUID();
      appData.createdAt = now;
      appData.updatedAt = now;
      applications.push(appData);
    }
    
    await chrome.storage.sync.set({ applications });
    applyFilters();
    return true;
  } catch (error) {
    console.error('Failed to save application:', error);
    if (error.message && error.message.includes('QUOTA')) {
      showError('Storage is full. Please export your data and delete some applications.');
    } else {
      showError('Failed to save application. Please try again.');
    }
    return false;
  }
}

async function deleteApplication(id) {
  try {
    if (!confirm('Are you sure you want to delete this application?')) {
      return false;
    }
    
    applications = applications.filter(a => a.id !== id);
    await chrome.storage.sync.set({ applications });
    applyFilters();
    return true;
  } catch (error) {
    console.error('Failed to delete application:', error);
    showError('Failed to delete application. Please try again.');
    return false;
  }
}

// ============================================
// Filter Logic
// ============================================
function applyFilters() {
  filteredApps = applications.filter(app => {
    const statusMatch = currentFilter.status === 'all' || app.status === currentFilter.status;
    const platformMatch = currentFilter.platform === 'all' || app.platform === currentFilter.platform;
    return statusMatch && platformMatch;
  });
  
  // Sort by date applied
  filteredApps.sort((a, b) => {
    const dateA = new Date(a.dateApplied);
    const dateB = new Date(b.dateApplied);
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });
  
  renderApplications();
  renderStats();
}

// ============================================
// Render Functions
// ============================================
function renderApplications() {
  // Clear current list
  appList.innerHTML = '';
  
  if (filteredApps.length === 0) {
    // Check if we have any applications at all or just filtered results
    if (applications.length === 0) {
      // No applications at all - show empty state
      appList.appendChild(emptyState);
      emptyState.classList.remove('hidden');
      noResultsState.classList.add('hidden');
    } else {
      // Applications exist but filtered out - show no results state
      appList.appendChild(noResultsState);
      noResultsState.classList.remove('hidden');
      emptyState.classList.add('hidden');
    }
    return;
  }
  
  emptyState.classList.add('hidden');
  noResultsState.classList.add('hidden');
  
  // Render cards
  filteredApps.forEach(app => {
    const card = createAppCard(app);
    appList.appendChild(card);
  });
}

function createAppCard(app) {
  const card = document.createElement('div');
  card.className = 'app-card';
  card.dataset.id = app.id;
  
  const platformClass = `app-platform ${app.platform}`;
  const statusClass = `app-status ${app.status}`;
  const timeline = createStatusTimeline(app.status);
  
  card.innerHTML = `
    <div class="card-header">
      <div class="card-title">
        <span class="company-name">${escapeHtml(app.company)}</span>
        <span class="position-name">${escapeHtml(app.position)}</span>
      </div>
      <select class="status-select ${statusClass}" data-id="${app.id}">
        <option value="applied" ${app.status === 'applied' ? 'selected' : ''}>Applied</option>
        <option value="interview" ${app.status === 'interview' ? 'selected' : ''}>Interview</option>
        <option value="offer" ${app.status === 'offer' ? 'selected' : ''}>Offer</option>
        <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
      </select>
    </div>
    <div class="${platformClass}">${getPlatformInitial(app.platform)}</div>
    <div class="app-info">
      <div class="app-meta">
        ${app.dateApplied ? `<span class="app-date">${formatDate(app.dateApplied)}</span>` : ''}
        ${app.salary ? `<span class="app-salary">${formatSalary(app.salary)}</span>` : ''}
        ${app.link ? `<a href="${escapeHtml(app.link)}" class="app-link" target="_blank" rel="noopener noreferrer">View Job</a>` : ''}
        ${app.companyUrl ? `<a href="${escapeHtml(app.companyUrl)}" class="company-link" target="_blank" rel="noopener noreferrer">Company</a>` : ''}
      </div>
      ${app.contactName ? `<div class="app-contact">
        <span class="contact-icon">👤</span>
        <span class="contact-name">${escapeHtml(app.contactName)}</span>
        ${app.contactMedium && app.contactValue ? `<span class="contact-value">${getContactDisplay(app.contactMedium, app.contactValue)}</span>` : ''}
      </div>` : ''}
      ${app.status === 'rejected' 
        ? '<div class="app-rejected-indicator">❌ Rejected</div>' 
        : '<div class="app-timeline">' + timeline + '</div>'}
    </div>
    <div class="app-actions">
      <button class="btn-action btn-edit" title="Edit">✏️</button>
      <button class="btn-action btn-delete" title="Delete">🗑️</button>
    </div>
  `;
  
  // Add event listeners
  const editBtn = card.querySelector('.btn-edit');
  const deleteBtn = card.querySelector('.btn-delete');
  const statusSelect = card.querySelector('.status-select');
  
  editBtn.addEventListener('click', () => openEditModal(app.id));
  deleteBtn.addEventListener('click', () => deleteApplication(app.id));
  
  // Status change handler
  statusSelect.addEventListener('change', async (e) => {
    const newStatus = e.target.value;
    const updatedApp = applications.find(a => a.id === app.id);
    if (updatedApp) {
      updatedApp.status = newStatus;
      await chrome.storage.sync.set({ applications });
      
      // Update timeline or indicator based on status
      const appInfo = card.querySelector('.app-info');
      const existingTimeline = appInfo.querySelector('.app-timeline');
      const existingIndicator = appInfo.querySelector('.app-rejected-indicator');
      
      if (newStatus === 'rejected') {
        if (existingTimeline) {
          existingTimeline.remove();
        }
        if (!existingIndicator) {
          const indicator = document.createElement('div');
          indicator.className = 'app-rejected-indicator';
          indicator.textContent = '❌ Rejected';
          appInfo.appendChild(indicator);
        }
      } else {
        if (existingIndicator) {
          existingIndicator.remove();
        }
        if (existingTimeline) {
          existingTimeline.innerHTML = createStatusTimeline(newStatus);
        } else {
          const timeline = document.createElement('div');
          timeline.className = 'app-timeline';
          timeline.innerHTML = createStatusTimeline(newStatus);
          appInfo.appendChild(timeline);
        }
      }
      
      // Update select classes
      statusSelect.className = `status-select app-status ${newStatus}`;
      
      renderStats();
    }
  });
  
  // Toggle timeline on card click (except when clicking buttons/select)
  card.addEventListener('click', (e) => {
    if (e.target.closest('.btn-action') || e.target.closest('.app-link') || e.target.closest('.status-select')) return;
    const timelineEl = card.querySelector('.app-timeline');
    if (timelineEl) {
      timelineEl.classList.toggle('hidden');
    }
  });
  
  return card;
}

function createStatusTimeline(currentStatus) {
  const stages = [
    { key: 'applied', label: 'Applied', icon: '📨' },
    { key: 'interview', label: 'Interview', icon: '📞' },
    { key: 'offer', label: 'Offer', icon: '🎉' }
  ];
  
  const statusOrder = { applied: 0, interview: 1, offer: 2, rejected: -1 };
  const currentIndex = statusOrder[currentStatus] ?? -1;
  const isRejected = currentStatus === 'rejected';
  
  let html = '<div class="status-timeline">';
  
  stages.forEach((stage, index) => {
    const isCompleted = currentIndex >= index;
    const isCurrent = currentIndex === index;
    const isLast = index === stages.length - 1;
    
    let dotClass = 'timeline-dot';
    if (isCompleted) dotClass += ' completed';
    if (isCurrent) dotClass += ' current';
    
    html += `
      <div class="timeline-step ${isCompleted ? 'done' : ''} ${isCurrent ? 'active' : ''}">
        <div class="${dotClass}">
          <span class="timeline-icon">${stage.icon}</span>
        </div>
        ${!isLast ? '<div class="timeline-line"></div>' : ''}
      </div>
    `;
  });
  
  if (isRejected) {
    html += `
      <div class="timeline-step rejected">
        <div class="timeline-dot rejected">
          <span class="timeline-icon">❌</span>
        </div>
      </div>
    `;
  }
  
  html += '</div>';
  return html;
}

function renderStats() {
  const stats = {
    applied: applications.filter(a => a.status === 'applied').length,
    interview: applications.filter(a => a.status === 'interview').length,
    offer: applications.filter(a => a.status === 'offer').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };
  
  document.getElementById('statApplied').textContent = stats.applied;
  document.getElementById('statInterview').textContent = stats.interview;
  document.getElementById('statOffer').textContent = stats.offer;
  document.getElementById('statRejected').textContent = stats.rejected;
}

function getPlatformInitial(platform) {
  const initials = {
    linkedin: 'LI',
    indeed: 'IN',
    glassdoor: 'GD',
    remoteok: 'RO',
    other: 'OT'
  };
  return initials[platform] || '?';
}

function getContactDisplay(medium, value) {
  const icons = {
    email: '📧',
    phone: '📞',
    linkedin: '💼',
    other: '📱'
  };
  return `${icons[medium] || '📱'} ${escapeHtml(value)}`;
}

// ============================================
// Export Functions
// ============================================
function exportCSV() {
  if (filteredApps.length === 0) {
    showError('No applications to export.');
    return;
  }
  
  const csv = toCSV(filteredApps);
  downloadFile(csv, getExportFilename('csv'), 'text/csv;charset=utf-8');
}

function exportJSON() {
  if (filteredApps.length === 0) {
    showError('No applications to export.');
    return;
  }
  
  const json = JSON.stringify(filteredApps, null, 2);
  downloadFile(json, getExportFilename('json'), 'application/json');
}

// ============================================
// Import Functions
// ============================================
async function handleFileImport(event, type) {
  console.log('handleFileImport called', type);
  const file = event.target.files[0];
  console.log('File:', file);
  if (!file) return;
  
  try {
    const content = await readFileContent(file);
    console.log('Content length:', content.length);
    console.log('Content preview:', content.substring(0, 200));
    let result;
    
    if (type === 'csv') {
      result = parseCSV(content);
    } else {
      result = parseJSON(content);
    }
    
    console.log('Parse result:', result);
    
    if (result.apps.length === 0) {
      let errorMsg = 'No valid applications found in the file.';
      if (result.errors.length > 0) {
        errorMsg += ' Errors: ' + result.errors.slice(0, 3).join(', ');
      }
      showError(errorMsg);
      return;
    }
    
    pendingImportApps = result.apps;
    pendingImportType = type;
    importCount.textContent = result.apps.length;
    console.log('Showing import modal');
    importModal.classList.remove('hidden');
    
  } catch (error) {
    console.error('Import error:', error);
    showError('Failed to read file. Please try again. Error: ' + error.message);
  }
  
  event.target.value = '';
}

function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function closeImportModal() {
  importModal.classList.add('hidden');
  pendingImportApps = [];
}

async function handleMergeImport() {
  const now = new Date().toISOString();
  
  pendingImportApps.forEach(app => {
    app.id = generateUUID();
    app.createdAt = now;
    app.updatedAt = now;
    applications.push(app);
  });
  
  try {
    await chrome.storage.sync.set({ applications });
    applyFilters();
    closeImportModal();
    const count = pendingImportApps.length;
    showToast(`Successfully imported ${count} application${count > 1 ? 's' : ''}.`, 'success');
  } catch (error) {
    console.error('Failed to save import:', error);
    showError('Failed to save imported data. Please try again.');
  }
}

async function handleReplaceImport() {
  const now = new Date().toISOString();
  
  applications = pendingImportApps.map(app => ({
    ...app,
    id: generateUUID(),
    createdAt: now,
    updatedAt: now
  }));
  
  try {
    await chrome.storage.sync.set({ applications });
    applyFilters();
    closeImportModal();
    const count = applications.length;
    showToast(`Successfully replaced all data with ${count} application${count > 1 ? 's' : ''}.`, 'success');
  } catch (error) {
    console.error('Failed to save import:', error);
    showError('Failed to save imported data. Please try again.');
  }
}

// ============================================
// Modal Functions
// ============================================
function openAddModal() {
  editingId = null;
  modalTitle.textContent = 'Add Application';
  resetForm();
  formModal.classList.remove('hidden');
}

function openEditModal(id) {
  const app = applications.find(a => a.id === id);
  if (!app) return;
  
  editingId = id;
  modalTitle.textContent = 'Edit Application';
  
  // Populate form
  appIdInput.value = app.id;
  companyInput.value = app.company;
  positionInput.value = app.position;
  platformInput.value = app.platform;
  statusInput.value = app.status;
  dateAppliedInput.value = app.dateApplied;
  salaryInput.value = app.salary || '';
  linkInput.value = app.link || '';
  notesInput.value = app.notes || '';
  contactNameInput.value = app.contactName || '';
  contactMediumInput.value = app.contactMedium || '';
  contactValueInput.value = app.contactValue || '';
  companyUrlInput.value = app.companyUrl || '';
  
  formModal.classList.remove('hidden');
}

function closeModal() {
  formModal.classList.add('hidden');
  editingId = null;
  resetForm();
}

function resetForm() {
  appForm.reset();
  appIdInput.value = '';
  clearFormErrors();
}

// ============================================
// Form Handling
// ============================================
async function handleFormSubmit(e) {
  e.preventDefault();
  
  // Validate
  if (!validateForm()) {
    return;
  }
  
  const appData = {
    id: editingId,
    company: companyInput.value.trim(),
    position: positionInput.value.trim(),
    platform: platformInput.value,
    status: statusInput.value,
    dateApplied: dateAppliedInput.value,
    salary: salaryInput.value ? parseInt(salaryInput.value, 10) : null,
    link: linkInput.value.trim(),
    notes: notesInput.value.trim(),
    contactName: contactNameInput.value.trim(),
    contactMedium: contactMediumInput.value,
    contactValue: contactValueInput.value.trim(),
    companyUrl: companyUrlInput.value.trim()
  };
  
  const success = await saveApplication(appData);
  
  if (success) {
    closeModal();
  }
}

function validateForm() {
  clearFormErrors();
  let isValid = true;
  
  // Required fields
  if (!companyInput.value.trim()) {
    showFieldError(companyInput, 'Company is required');
    isValid = false;
  }
  
  if (!positionInput.value.trim()) {
    showFieldError(positionInput, 'Position is required');
    isValid = false;
  }
  
  if (!platformInput.value) {
    showFieldError(platformInput, 'Platform is required');
    isValid = false;
  }
  
  if (!statusInput.value) {
    showFieldError(statusInput, 'Status is required');
    isValid = false;
  }
  
  if (!dateAppliedInput.value) {
    showFieldError(dateAppliedInput, 'Date applied is required');
    isValid = false;
  }
  
  // Salary must be positive if provided
  if (salaryInput.value && parseInt(salaryInput.value, 10) < 0) {
    showFieldError(salaryInput, 'Salary must be a positive number');
    isValid = false;
  }
  
  // Contact email validation
  if (contactMediumInput.value === 'email' && contactValueInput.value.trim()) {
    if (!isValidEmail(contactValueInput.value.trim())) {
      showFieldError(contactValueInput, 'Invalid email format');
      isValid = false;
    }
  }
  
  // Link URL validation
  if (linkInput.value.trim() && !isValidUrl(linkInput.value.trim())) {
    showFieldError(linkInput, 'Invalid URL (must start with http:// or https://)');
    isValid = false;
  }
  
  // Company URL validation
  if (companyUrlInput.value.trim() && !isValidUrl(companyUrlInput.value.trim())) {
    showFieldError(companyUrlInput, 'Invalid URL (must start with http:// or https://)');
    isValid = false;
  }
  
  return isValid;
}

function showFieldError(input, message) {
  input.classList.add('error');
  const group = input.closest('.form-group');
  if (group) {
    group.classList.add('has-error');
    let errorEl = group.querySelector('.form-error');
    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.className = 'form-error';
      group.appendChild(errorEl);
    }
    errorEl.textContent = message;
  }
}

function clearFormErrors() {
  const inputs = appForm.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    input.classList.remove('error');
    const group = input.closest('.form-group');
    if (group) {
      group.classList.remove('has-error');
      const errorEl = group.querySelector('.form-error');
      if (errorEl) {
        errorEl.remove();
      }
    }
  });
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
  // Add button
  addBtn.addEventListener('click', openAddModal);
  
  // Filters
  filterStatus.addEventListener('change', () => {
    currentFilter.status = filterStatus.value;
    applyFilters();
  });
  
  filterPlatform.addEventListener('change', () => {
    currentFilter.platform = filterPlatform.value;
    applyFilters();
  });
  
  // Sort order
  sortOrderSelect.addEventListener('change', () => {
    sortOrder = sortOrderSelect.value;
    applyFilters();
  });
  
  // Export buttons
  exportCsvBtn.addEventListener('click', exportCSV);
  exportJsonBtn.addEventListener('click', exportJSON);
  
  // Import buttons
  importCsvBtn.addEventListener('click', () => importCsvInput.click());
  importJsonBtn.addEventListener('click', () => importJsonInput.click());
  importCsvInput.addEventListener('change', (e) => handleFileImport(e, 'csv'));
  importJsonInput.addEventListener('change', (e) => handleFileImport(e, 'json'));
  importMergeBtn.addEventListener('click', handleMergeImport);
  importReplaceBtn.addEventListener('click', handleReplaceImport);
  importCancelBtn.addEventListener('click', closeImportModal);
  importModal.querySelector('.modal-backdrop').addEventListener('click', closeImportModal);
  
  // Modal
  cancelBtn.addEventListener('click', closeModal);
  
  const modalBackdrop = formModal.querySelector('.modal-backdrop');
  modalBackdrop.addEventListener('click', closeModal);
  
  // Form
  appForm.addEventListener('submit', handleFormSubmit);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Escape - close modals
    if (e.key === 'Escape') {
      if (!formModal.classList.contains('hidden')) {
        closeModal();
      }
      if (!importModal.classList.contains('hidden')) {
        closeImportModal();
      }
      return;
    }
    
    // 'n' or '+' - new application (only when no modal is open)
    if ((e.key === 'n' || e.key === '+') && !e.ctrlKey && !e.metaKey && formModal.classList.contains('hidden')) {
      openAddModal();
      return;
    }
  });
}

// ============================================
// Utility Functions
// ============================================
/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: success, error, warning, info
 * @param {number} duration - Duration in ms (default 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function showError(message) {
  showToast(message, 'error', 5000);
}
