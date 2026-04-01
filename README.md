# hired_hub - Chrome Extension

Track your job applications across platforms.

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `hired_hub` folder
5. The extension icon will appear in your toolbar

## Features

- **Add Applications**: Track company, position, platform, status, date, salary, link, and notes
- **Filter**: Filter by status (Applied, Interview, Offer, Rejected) and platform (LinkedIn, Indeed, Glassdoor, RemoteOK, Other)
- **Stats**: View counts for each status
- **Export**: Export to CSV or JSON
- **Import**: Import from CSV or JSON files
- **Sync**: Data automatically syncs across your Chrome instances (when signed in to the same Google account)

## Usage

1. Click the extension icon in your toolbar
2. Click the "+" button to add a new application (or press `N`)
3. Fill in the details and click "Save"
4. Use filters to find specific applications
5. Click the export buttons to download your data
6. Click the import buttons to load data from CSV or JSON files

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` | Open "Add Application" form |

## Platform Options

- LinkedIn
- Indeed
- Glassdoor
- RemoteOK
- Other

## Status Options

- Applied (just submitted)
- Interview (got an interview)
- Offer (received an offer!)
- Rejected (not selected)

## Data Format

### JSON Export Format
```json
[
  {
    "id": "uuid-here",
    "company": "Acme Corp",
    "position": "Frontend Developer",
    "platform": "linkedin",
    "status": "applied",
    "dateApplied": "2024-03-15",
    "salary": 120000,
    "link": "https://...",
    "notes": "Some notes",
    "contactName": "John Doe",
    "contactMedium": "email",
    "contactValue": "john@example.com",
    "companyUrl": "https://acme.com"
  }
]
```

### CSV Export Format
| Column | Description |
|--------|-------------|
| Company | Company name |
| Position | Job title |
| Platform | linkedin, indeed, glassdoor, remoteok, other |
| Status | applied, interview, offer, rejected |
| Date Applied | YYYY-MM-DD format |
| Salary | Annual salary in USD |
| Link | Job posting URL |
| Notes | Additional notes |
| Contact Name | Name of contact person |
| Contact Medium | email, phone, linkedin, other |
| Contact Value | Email or phone number |
| Company URL | Company website |

## Troubleshooting

### Storage Full
If you see "Storage is full" error:
1. Export your data (CSV or JSON)
2. Delete some old applications
3. Import your data back if needed

### Import Issues
- **CSV**: Ensure headers match expected column names (Company, Position, Platform, Status, Date Applied, etc.)
- **JSON**: Ensure it's an array of application objects
- Invalid rows will be skipped with error messages

### Data Not Syncing
- Make sure you're signed into Chrome
- Check `chrome://settings/syncSetup` to ensure Sync is enabled

## Development

### Prerequisites
- Node.js 18+
- npm 9+

### Setup
```bash
npm install
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

### Making Changes
1. Load the extension in developer mode (`chrome://extensions/`)
2. Make changes to the files
3. Click the "Reload" button in the extensions page to see changes

## Files

```
hired_hub/
├── manifest.json       # Extension manifest
├── popup.html          # Main popup UI
├── popup.js            # Application logic
├── styles.css          # Styles
├── utils.js            # Utility functions (testable)
├── background.js       # Service worker
├── vitest.config.js    # Test configuration
├── package.json        # Dependencies and scripts
├── tests/
│   └── utils.test.js   # Unit tests
├── icon/               # Extension icons
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
└── README.md           # This file
```

## Changelog

### v1.0.0 (2024-03)
- Initial release
- Add/edit/delete job applications
- Filter by status and platform
- Sort by date (newest/oldest first)
- Statistics dashboard
- Export to CSV and JSON
- Import from CSV and JSON
- Status timeline tracking
- Dark theme UI

---

Built with ❤️ for job seekers everywhere.
