/**
 * hired_hub - Utility Functions
 */

(function(global) {
  'use strict';

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatPlatform(platform) {
    const names = {
      linkedin: 'LinkedIn',
      indeed: 'Indeed',
      glassdoor: 'Glassdoor',
      remoteok: 'RemoteOK',
      other: 'Other'
    };
    return names[platform] || platform;
  }

  function formatStatus(status) {
    const names = {
      applied: 'Applied',
      interview: 'Interview',
      rejected: 'Rejected',
      offer: 'Offer'
    };
    return names[status] || status;
  }

  function formatSalary(salary) {
    if (!salary) return '';
    return '$' + salary.toLocaleString('en-US');
  }

  function toCSV(applications) {
    const headers = ['Company', 'Position', 'Platform', 'Status', 'Date Applied', 'Salary', 'Link', 'Notes', 'Contact Name', 'Contact Medium', 'Contact Value', 'Company URL'];
    
    const rows = applications.map(app => [
      escapeCsvField(app.company),
      escapeCsvField(app.position),
      escapeCsvField(app.platform),
      escapeCsvField(app.status),
      escapeCsvField(app.dateApplied),
      app.salary || '',
      escapeCsvField(app.link),
      escapeCsvField(app.notes),
      escapeCsvField(app.contactName || ''),
      escapeCsvField(app.contactMedium || ''),
      escapeCsvField(app.contactValue || ''),
      escapeCsvField(app.companyUrl || '')
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
  }

  function escapeCsvField(field) {
    if (!field) return '';
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return '"' + stringField.replace(/"/g, '""') + '"';
    }
    return stringField;
  }

  function getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  function getExportFilename(extension) {
    const date = new Date().toISOString().split('T')[0];
    return `hired_hub_${date}.${extension}`;
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  function parseCSV(csvContent) {
    const errors = [];
    const apps = [];
    
    if (!csvContent || typeof csvContent !== 'string') {
      return { apps: [], errors: ['Empty or invalid CSV file'] };
    }
    
    const lines = csvContent.trim().split('\n');
    
    if (lines.length < 2) {
      return { apps: [], errors: ['CSV file is empty or has no data rows'] };
    }
    
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    
    const columnMap = {
      company: headers.findIndex(h => ['company', 'company name', 'companyname'].includes(h)),
      position: headers.findIndex(h => ['position', 'job title', 'jobtitle'].includes(h)),
      platform: headers.findIndex(h => ['platform', 'source'].includes(h)),
      status: headers.findIndex(h => ['status', 'state'].includes(h)),
      dateApplied: headers.findIndex(h => ['date applied', 'dateapplied', 'date', 'applied date'].includes(h)),
      salary: headers.findIndex(h => ['salary', 'salary usd', 'salaryusd'].includes(h)),
      link: headers.findIndex(h => ['link', 'job link', 'urll', 'url'].includes(h)),
      notes: headers.findIndex(h => ['notes', 'note'].includes(h)),
      contactName: headers.findIndex(h => ['contact name', 'contactname', 'contact'].includes(h)),
      contactMedium: headers.findIndex(h => ['contact medium', 'contactmedium'].includes(h)),
      contactValue: headers.findIndex(h => ['contact value', 'contactvalue'].includes(h)),
      companyUrl: headers.findIndex(h => ['company url', 'companyurl', 'company link'].includes(h))
    };
    
    if (columnMap.company === -1 && columnMap.position === -1) {
      return { apps: [], errors: ['CSV must have at least "Company" or "Position" column'] };
    }
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      if (values.length === 0 || (values.length === 1 && values[0] === '')) {
        continue;
      }
      
      const company = columnMap.company !== -1 ? values[columnMap.company]?.trim() : '';
      const position = columnMap.position !== -1 ? values[columnMap.position]?.trim() : '';
      
      if (!company && !position) {
        errors.push(`Row ${i + 1}: Missing company and position`);
        continue;
      }
      
      const app = {
        company: company || '',
        position: position || '',
        platform: columnMap.platform !== -1 ? normalizeValue(values[columnMap.platform], 'platform') : 'other',
        status: columnMap.status !== -1 ? normalizeValue(values[columnMap.status], 'status') : 'applied',
        dateApplied: columnMap.dateApplied !== -1 ? values[columnMap.dateApplied]?.trim() : '',
        salary: columnMap.salary !== -1 ? parseInt(values[columnMap.salary]?.replace(/[^\d]/g, ''), 10) || null : null,
        link: columnMap.link !== -1 ? values[columnMap.link]?.trim() : '',
        notes: columnMap.notes !== -1 ? values[columnMap.notes]?.trim() : '',
        contactName: columnMap.contactName !== -1 ? values[columnMap.contactName]?.trim() : '',
        contactMedium: columnMap.contactMedium !== -1 ? normalizeValue(values[columnMap.contactMedium], 'contactMedium') : '',
        contactValue: columnMap.contactValue !== -1 ? values[columnMap.contactValue]?.trim() : '',
        companyUrl: columnMap.companyUrl !== -1 ? values[columnMap.companyUrl]?.trim() : ''
      };
      
      const validation = validateApplication(app);
      if (!validation.valid) {
        errors.push(`Row ${i + 1}: ${validation.errors.join(', ')}`);
        continue;
      }
      
      apps.push(app);
    }
    
    return { apps, errors };
  }

  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (inQuotes) {
        if (char === '"') {
          if (line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
    }
    
    result.push(current);
    return result;
  }

  function parseJSON(jsonContent) {
    const errors = [];
    
    if (!jsonContent || typeof jsonContent !== 'string') {
      return { apps: [], errors: ['Empty or invalid JSON file'] };
    }
    
    let data;
    try {
      data = JSON.parse(jsonContent);
    } catch (e) {
      void e;
      return { apps: [], errors: ['Invalid JSON format'] };
    }
    
    if (!Array.isArray(data)) {
      return { apps: [], errors: ['JSON must contain an array of applications'] };
    }
    
    if (data.length === 0) {
      return { apps: [], errors: ['JSON array is empty'] };
    }
    
    const apps = [];
    
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const app = normalizeApplication(item);
      
      const validation = validateApplication(app);
      if (!validation.valid) {
        errors.push(`Item ${i + 1}: ${validation.errors.join(', ')}`);
        continue;
      }
      
      apps.push(app);
    }
    
    return { apps, errors };
  }

  function normalizeApplication(app) {
    return {
      company: app.company || app.companyName || app.companyname || '',
      position: app.position || app.jobTitle || app.jobtitle || '',
      platform: normalizeValue(app.platform || app.source, 'platform'),
      status: normalizeValue(app.status || app.state, 'status'),
      dateApplied: app.dateApplied || app.dateApplied || app.date || '',
      salary: parseInt(app.salary || app.salaryUsd || app.salaryusd || 0, 10) || null,
      link: app.link || app.jobLink || app.url || '',
      notes: app.notes || app.note || '',
      contactName: app.contactName || app.contactname || app.contact || '',
      contactMedium: normalizeValue(app.contactMedium || app.contactmedium, 'contactMedium'),
      contactValue: app.contactValue || app.contactvalue || '',
      companyUrl: app.companyUrl || app.companyurl || app.companyLink || ''
    };
  }

  function normalizeValue(value, type) {
    if (!value) return '';
    
    const normalized = String(value).toLowerCase().trim();
    
    if (type === 'platform') {
      const platforms = { linkedin: 'linkedin', indeed: 'indeed', glassdoor: 'glassdoor', remoteok: 'remoteok', other: 'other' };
      return platforms[normalized] || 'other';
    }
    
    if (type === 'status') {
      const statuses = { applied: 'applied', interview: 'interview', rejected: 'rejected', offer: 'offer' };
      return statuses[normalized] || 'applied';
    }
    
    if (type === 'contactMedium') {
      const mediums = { email: 'email', phone: 'phone', linkedin: 'linkedin', other: 'other' };
      return mediums[normalized] || 'other';
    }
    
    return normalized;
  }

  function validateApplication(app) {
    const errors = [];
    
    if (!app.company && !app.position) {
      errors.push('Company or Position is required');
    }
    
    if (app.link && !isValidUrl(app.link)) {
      errors.push('Invalid job link URL');
    }
    
    if (app.companyUrl && !isValidUrl(app.companyUrl)) {
      errors.push('Invalid company URL');
    }
    
    const validPlatforms = ['linkedin', 'indeed', 'glassdoor', 'remoteok', 'other'];
    if (app.platform && !validPlatforms.includes(app.platform)) {
      errors.push('Invalid platform');
    }
    
    const validStatuses = ['applied', 'interview', 'rejected', 'offer'];
    if (app.status && !validStatuses.includes(app.status)) {
      errors.push('Invalid status');
    }
    
    const validMediums = ['email', 'phone', 'linkedin', 'other'];
    if (app.contactMedium && !validMediums.includes(app.contactMedium)) {
      errors.push('Invalid contact medium');
    }
    
    return { valid: errors.length === 0, errors };
  }

  function isValidUrl(url) {
    if (!url) return true;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function isValidEmail(email) {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Export for both module and global usage
  const utils = {
    generateUUID,
    formatDate,
    escapeHtml,
    formatPlatform,
    formatStatus,
    formatSalary,
    toCSV,
    escapeCsvField,
    getTodayDate,
    getExportFilename,
    downloadFile,
    parseCSV,
    parseCSVLine,
    parseJSON,
    normalizeApplication,
    normalizeValue,
    validateApplication,
    isValidUrl,
    isValidEmail
  };

  // Export for ES modules
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = utils;
  }

  // Attach to global for browser usage
  if (typeof global !== 'undefined') {
    Object.assign(global, utils);
  }
})(typeof window !== 'undefined' ? window : global);
