/**
 * hired_hub - Utils Tests
 */
import { describe, it, expect, vi } from 'vitest';

// Helper to escape HTML entities (simulates browser behavior)
function escapeHtmlEntities(str) {
  if (typeof str !== 'string') return String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Mock browser globals - escapeHtml needs actual DOM behavior
const mockDocument = {
  createElement: (tag) => {
    let text = '';
    return {
      tagName: tag.toUpperCase(),
      get textContent() { return text; },
      set textContent(v) { text = String(v); },
      get innerHTML() { return escapeHtmlEntities(text); },
      set innerHTML(v) { text = v; },
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      classList: {
        add: vi.fn(),
        remove: vi.fn()
      },
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
      style: {}
    };
  },
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
};

global.document = mockDocument;
global.URL = URL;
global.Blob = Blob;

// Import all functions from utils
import * as utils from '../utils.js';

const {
  generateUUID,
  escapeHtml,
  formatDate,
  formatPlatform,
  formatStatus,
  formatSalary,
  escapeCsvField,
  toCSV,
  getTodayDate,
  getExportFilename,
  parseCSV,
  parseCSVLine,
  parseJSON,
  normalizeValue,
  validateApplication,
  isValidUrl,
  isValidEmail
} = utils;

describe('generateUUID', () => {
  it('should generate a valid UUID v4 format', () => {
    const uuid = utils.generateUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should generate unique UUIDs', () => {
    const uuids = new Set();
    for (let i = 0; i < 100; i++) {
      uuids.add(utils.generateUUID());
    }
    expect(uuids.size).toBe(100);
  });
});

describe('escapeHtml', () => {
  it('should escape basic HTML tags', () => {
    expect(utils.escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('should escape ampersands', () => {
    expect(utils.escapeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  it('should escape quotes', () => {
    expect(utils.escapeHtml('He said "hello"')).toBe('He said &quot;hello&quot;');
  });

  it('should return empty string for null/undefined', () => {
    expect(utils.escapeHtml(null)).toBe('');
    expect(utils.escapeHtml(undefined)).toBe('');
  });

  it('should handle empty string', () => {
    expect(utils.escapeHtml('')).toBe('');
  });

  it('should handle special characters', () => {
    expect(utils.escapeHtml('<>&"\'')).toBe('&lt;&gt;&amp;&quot;&#39;');
  });

  it('should handle numbers', () => {
    expect(utils.escapeHtml(123)).toBe('123');
  });
});

describe('formatDate', () => {
  it('should format ISO date string', () => {
    const result = utils.formatDate('2024-03-15');
    expect(result).toMatch(/\d{1,2}, \d{4}/);
  });

  it('should return empty string for null/undefined', () => {
    expect(utils.formatDate(null)).toBe('');
    expect(utils.formatDate(undefined)).toBe('');
  });

  it('should return empty string for empty string', () => {
    expect(utils.formatDate('')).toBe('');
  });

  it('should handle invalid date', () => {
    const result = utils.formatDate('invalid-date');
    expect(result).toBe('Invalid Date');
  });
});

describe('formatPlatform', () => {
  it('should format linkedin', () => {
    expect(utils.formatPlatform('linkedin')).toBe('LinkedIn');
  });

  it('should format indeed', () => {
    expect(utils.formatPlatform('indeed')).toBe('Indeed');
  });

  it('should format glassdoor', () => {
    expect(utils.formatPlatform('glassdoor')).toBe('Glassdoor');
  });

  it('should format remoteok', () => {
    expect(utils.formatPlatform('remoteok')).toBe('RemoteOK');
  });

  it('should format other', () => {
    expect(utils.formatPlatform('other')).toBe('Other');
  });

  it('should return unknown platform as-is', () => {
    expect(utils.formatPlatform('unknown')).toBe('unknown');
  });
});

describe('formatStatus', () => {
  it('should format applied', () => {
    expect(utils.formatStatus('applied')).toBe('Applied');
  });

  it('should format interview', () => {
    expect(utils.formatStatus('interview')).toBe('Interview');
  });

  it('should format rejected', () => {
    expect(utils.formatStatus('rejected')).toBe('Rejected');
  });

  it('should format offer', () => {
    expect(utils.formatStatus('offer')).toBe('Offer');
  });

  it('should return unknown status as-is', () => {
    expect(utils.formatStatus('unknown')).toBe('unknown');
  });
});

describe('formatSalary', () => {
  it('should format salary with dollar sign and commas', () => {
    expect(utils.formatSalary(120000)).toBe('$120,000');
  });

  it('should format zero salary as empty string', () => {
    expect(utils.formatSalary(0)).toBe('');
  });

  it('should return empty string for null/undefined', () => {
    expect(utils.formatSalary(null)).toBe('');
    expect(utils.formatSalary(undefined)).toBe('');
  });

  it('should format large salary', () => {
    expect(utils.formatSalary(1000000)).toBe('$1,000,000');
  });

  it('should format small salary', () => {
    expect(utils.formatSalary(1000)).toBe('$1,000');
  });
});

describe('escapeCsvField', () => {
  it('should not modify simple fields', () => {
    expect(utils.escapeCsvField('simple')).toBe('simple');
  });

  it('should wrap field with comma in quotes', () => {
    expect(utils.escapeCsvField('hello, world')).toBe('"hello, world"');
  });

  it('should wrap field with quotes in quotes and escape', () => {
    expect(utils.escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });

  it('should wrap field with newline in quotes', () => {
    expect(utils.escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
  });

  it('should return empty string for null/undefined', () => {
    expect(utils.escapeCsvField(null)).toBe('');
    expect(utils.escapeCsvField(undefined)).toBe('');
  });

  it('should handle number', () => {
    expect(utils.escapeCsvField(123)).toBe('123');
  });
});

describe('toCSV', () => {
  it('should generate CSV with headers', () => {
    const apps = [{
      company: 'Acme',
      position: 'Developer',
      platform: 'linkedin',
      status: 'applied',
      dateApplied: '2024-01-15',
      salary: 100000,
      link: 'https://example.com',
      notes: 'Test note',
      contactName: 'John',
      contactMedium: 'email',
      contactValue: 'john@example.com',
      companyUrl: 'https://acme.com'
    }];
    const csv = utils.toCSV(apps);
    expect(csv).toContain('Company,Position,Platform,Status');
    expect(csv).toContain('Acme,Developer,linkedin,applied');
  });

  it('should escape fields with commas', () => {
    const apps = [{ company: 'Acme, Inc', position: 'Dev', platform: 'linkedin', status: 'applied', dateApplied: '2024-01-15' }];
    const csv = utils.toCSV(apps);
    expect(csv).toContain('"Acme, Inc"');
  });

  it('should handle empty array', () => {
    const csv = utils.toCSV([]);
    expect(csv).toContain('Company');
  });

  it('should handle missing optional fields', () => {
    const apps = [{ company: 'Acme', position: 'Dev', platform: 'linkedin', status: 'applied', dateApplied: '2024-01-15' }];
    const csv = utils.toCSV(apps);
    expect(csv).toContain('Acme,Dev,linkedin,applied');
  });
});

describe('getTodayDate', () => {
  it('should return date in YYYY-MM-DD format', () => {
    const date = utils.getTodayDate();
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getExportFilename', () => {
  it('should generate filename with date and extension', () => {
    const filename = utils.getExportFilename('csv');
    expect(filename).toMatch(/^hired_hub_\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('should work with json extension', () => {
    const filename = utils.getExportFilename('json');
    expect(filename).toMatch(/^hired_hub_\d{4}-\d{2}-\d{2}\.json$/);
  });
});

describe('parseCSV', () => {
  it('should parse valid CSV', () => {
    const csv = 'Company,Position,Platform,Status,Date Applied\nAcme,Developer,linkedin,applied,2024-01-15';
    const result = utils.parseCSV(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].company).toBe('Acme');
    expect(result.apps[0].position).toBe('Developer');
  });

  it('should handle empty CSV', () => {
    const result = utils.parseCSV('');
    expect(result.errors).toContain('Empty or invalid CSV file');
    expect(result.apps).toHaveLength(0);
  });

  it('should handle CSV with only headers', () => {
    const csv = 'Company,Position';
    const result = utils.parseCSV(csv);
    expect(result.errors).toContain('CSV file is empty or has no data rows');
  });

  it('should normalize platform values', () => {
    const csv = 'Company,Position,Platform,Status,Date Applied\nAcme,Dev,LinkedIn,Applied,2024-01-15';
    const result = utils.parseCSV(csv);
    expect(result.apps[0].platform).toBe('linkedin');
  });

  it('should normalize status values', () => {
    const csv = 'Company,Position,Platform,Status,Date Applied\nAcme,Dev,linkedin,INTERVIEW,2024-01-15';
    const result = utils.parseCSV(csv);
    expect(result.apps[0].status).toBe('interview');
  });

  it('should skip rows with both company and position empty', () => {
    const csv = 'Company,Position,Platform,Status,Date Applied\n,,linkedin,applied,2024-01-15';
    const result = utils.parseCSV(csv);
    expect(result.apps).toHaveLength(0);
    expect(result.errors[0]).toMatch(/Row 2/);
  });

  it('should parse CSV with alternative column names', () => {
    const csv = 'company name,job title,source,state,applied date\nAcme,Dev,LinkedIn,applied,2024-01-15';
    const result = utils.parseCSV(csv);
    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].company).toBe('Acme');
    expect(result.apps[0].position).toBe('Dev');
  });

  it('should skip empty rows', () => {
    const csv = 'Company,Position,Platform,Status,Date Applied\n\nAcme,Dev,linkedin,applied,2024-01-15\n';
    const result = utils.parseCSV(csv);
    expect(result.apps).toHaveLength(1);
  });

  it('should handle invalid URL', () => {
    const csv = 'Company,Position,Platform,Status,Date Applied,Link\nAcme,Dev,linkedin,applied,2024-01-15,not-a-url';
    const result = utils.parseCSV(csv);
    expect(result.errors[0]).toMatch(/Invalid job link URL/);
  });
});

describe('parseCSVLine', () => {
  it('should parse simple line', () => {
    const result = utils.parseCSVLine('a,b,c');
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('should handle quoted fields with commas', () => {
    const result = utils.parseCSVLine('a,"b,c",d');
    expect(result).toEqual(['a', 'b,c', 'd']);
  });

  it('should handle escaped quotes inside quotes', () => {
    const result = utils.parseCSVLine('a,"b""c"');
    expect(result).toEqual(['a', 'b"c']);
  });

  it('should handle empty fields', () => {
    const result = utils.parseCSVLine('a,,c');
    expect(result).toEqual(['a', '', 'c']);
  });
});

describe('parseJSON', () => {
  it('should parse valid JSON array', () => {
    const json = '[{"company":"Acme","position":"Dev","platform":"linkedin","status":"applied","dateApplied":"2024-01-15"}]';
    const result = utils.parseJSON(json);
    expect(result.errors).toHaveLength(0);
    expect(result.apps).toHaveLength(1);
  });

  it('should handle empty JSON', () => {
    const result = utils.parseJSON('');
    expect(result.errors).toContain('Empty or invalid JSON file');
  });

  it('should handle invalid JSON', () => {
    const result = utils.parseJSON('{invalid}');
    expect(result.errors).toContain('Invalid JSON format');
  });

  it('should handle non-array JSON', () => {
    const result = utils.parseJSON('{"company":"Acme"}');
    expect(result.errors).toContain('JSON must contain an array of applications');
  });

  it('should handle empty array', () => {
    const result = utils.parseJSON('[]');
    expect(result.errors).toContain('JSON array is empty');
  });

  it('should normalize field names', () => {
    const json = '[{"companyName":"Acme","jobTitle":"Dev","source":"linkedin","state":"applied","date":"2024-01-15"}]';
    const result = utils.parseJSON(json);
    expect(result.apps[0].company).toBe('Acme');
    expect(result.apps[0].position).toBe('Dev');
    expect(result.apps[0].platform).toBe('linkedin');
  });

  it('should skip invalid items', () => {
    const json = '[{"company":"Acme","position":"Dev"}, {"company":"","position":""}]';
    const result = utils.parseJSON(json);
    expect(result.apps).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
  });
});

describe('normalizeValue', () => {
  it('should normalize platform values', () => {
    expect(utils.normalizeValue('LinkedIn', 'platform')).toBe('linkedin');
    expect(utils.normalizeValue('LINKEDIN', 'platform')).toBe('linkedin');
    expect(utils.normalizeValue('unknown', 'platform')).toBe('other');
  });

  it('should normalize status values', () => {
    expect(utils.normalizeValue('APPLIED', 'status')).toBe('applied');
    expect(utils.normalizeValue('Interview', 'status')).toBe('interview');
    expect(utils.normalizeValue('unknown', 'status')).toBe('applied');
  });

  it('should normalize contactMedium values', () => {
    expect(utils.normalizeValue('EMAIL', 'contactMedium')).toBe('email');
    expect(utils.normalizeValue('Phone', 'contactMedium')).toBe('phone');
    expect(utils.normalizeValue('unknown', 'contactMedium')).toBe('other');
  });

  it('should return empty string for null/undefined', () => {
    expect(utils.normalizeValue(null, 'platform')).toBe('');
  });
});

describe('validateApplication', () => {
  it('should validate complete application', () => {
    const app = {
      company: 'Acme',
      position: 'Developer',
      platform: 'linkedin',
      status: 'applied',
      dateApplied: '2024-01-15',
      link: 'https://example.com'
    };
    const result = utils.validateApplication(app);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should require company or position', () => {
    const app = { company: '', position: '' };
    const result = utils.validateApplication(app);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Company or Position is required');
  });

  it('should validate invalid job link URL', () => {
    const app = { company: 'Acme', position: 'Dev', link: 'not-a-url' };
    const result = utils.validateApplication(app);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid job link URL');
  });

  it('should validate invalid company URL', () => {
    const app = { company: 'Acme', position: 'Dev', companyUrl: 'not-a-url' };
    const result = utils.validateApplication(app);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid company URL');
  });

  it('should validate invalid platform', () => {
    const app = { company: 'Acme', position: 'Dev', platform: 'invalid' };
    const result = utils.validateApplication(app);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid platform');
  });

  it('should validate invalid status', () => {
    const app = { company: 'Acme', position: 'Dev', status: 'invalid' };
    const result = utils.validateApplication(app);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid status');
  });

  it('should validate invalid contact medium', () => {
    const app = { company: 'Acme', position: 'Dev', contactMedium: 'invalid' };
    const result = utils.validateApplication(app);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid contact medium');
  });

  it('should allow valid https URL', () => {
    const app = { company: 'Acme', position: 'Dev', link: 'https://example.com' };
    const result = utils.validateApplication(app);
    expect(result.valid).toBe(true);
  });

  it('should allow valid http URL', () => {
    const app = { company: 'Acme', position: 'Dev', link: 'http://example.com' };
    const result = utils.validateApplication(app);
    expect(result.valid).toBe(true);
  });

  it('should allow missing optional fields', () => {
    const app = { company: 'Acme', position: 'Dev' };
    const result = utils.validateApplication(app);
    expect(result.valid).toBe(true);
  });
});

describe('isValidUrl', () => {
  it('should validate https URLs', () => {
    expect(utils.isValidUrl('https://example.com')).toBe(true);
  });

  it('should validate http URLs', () => {
    expect(utils.isValidUrl('http://example.com')).toBe(true);
  });

  it('should reject invalid URLs', () => {
    expect(utils.isValidUrl('not-a-url')).toBe(false);
  });

  it('should reject ftp URLs', () => {
    expect(utils.isValidUrl('ftp://example.com')).toBe(false);
  });

  it('should return true for empty string', () => {
    expect(utils.isValidUrl('')).toBe(true);
  });

  it('should return true for null/undefined', () => {
    expect(utils.isValidUrl(null)).toBe(true);
    expect(utils.isValidUrl(undefined)).toBe(true);
  });
});

describe('isValidEmail', () => {
  it('should validate correct email', () => {
    expect(utils.isValidEmail('test@example.com')).toBe(true);
  });

  it('should validate email with subdomain', () => {
    expect(utils.isValidEmail('test@sub.example.com')).toBe(true);
  });

  it('should reject invalid email', () => {
    expect(utils.isValidEmail('invalid')).toBe(false);
  });

  it('should reject email without domain', () => {
    expect(utils.isValidEmail('test@')).toBe(false);
  });

  it('should return true for empty string', () => {
    expect(utils.isValidEmail('')).toBe(true);
  });

  it('should return true for null/undefined', () => {
    expect(utils.isValidEmail(null)).toBe(true);
    expect(utils.isValidEmail(undefined)).toBe(true);
  });
});