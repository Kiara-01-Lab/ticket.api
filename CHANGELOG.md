# Changelog

All notable changes to TicketKit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-02-04

### 🎉 Initial Beta Release

TicketKit's first public beta release! A lightweight JavaScript SDK for building task management systems like Trello, Asana, Jira, or vertical SaaS applications.

### ✨ Core Features

**SDK & Storage**
- Complete CRUD operations for boards, tickets, comments, and subtasks
- In-memory SQLite database with sql.js (production-ready file storage available)
- TypeScript definitions included (index.d.ts)
- Event emitter for real-time updates (`ticket:created`, `ticket:updated`, etc.)
- Export/import functionality for data portability

**Workflow Engine**
- 4 built-in workflows: Kanban, Scrum, Support (Zendesk-style), Simple
- Custom workflow support with state machine validation
- Enforced workflow transitions prevent invalid state changes
- Backlog management and Kanban view generation

**Ticket Management**
- Full metadata support: priority, labels, assignees, due dates, custom fields
- Parent-child relationships for subtasks and epics
- Position-based ordering within workflow states
- Bulk operations for batch updates
- Advanced search with query syntax (`status:todo`, `label:bug`, etc.)

**Activity & Comments**
- Automatic activity logging for all changes (who, what, when)
- Threaded comment system with parent-child replies
- Complete audit trail for compliance and debugging

**Developer Experience**
- Zero configuration required - works out of the box
- Async/await API throughout
- Comprehensive JSDoc comments
- 30 passing tests with 76%+ code coverage
- No external database dependencies

### 📦 Examples Included

**React Kanban Board** (`ticketkit-examples/react-kanban/`)
- Full-stack Kanban application with 48+ features
- React frontend with drag-and-drop (native HTML5)
- Express REST API backend
- Demonstrates 81% of TicketKit's API surface
- In-place editing, subtasks, comments, activity timeline, search

**Wedding Planner Vertical SaaS** (`ticketkit-examples/wedding-planner/`)
- Production-ready vertical SaaS example solving 5 real pain points
- Custom vendor management workflow (10 states)
- Custom client decision workflow (6 states)
- Multi-event dashboard with React UI
- Ghosting detection, approval audit trail, contact management
- Shows how to build industry-specific applications with TicketKit

### 📚 Documentation

- Comprehensive README with quick start, API reference, and examples
- CONTRIBUTING.md with development guidelines
- CODE_OF_CONDUCT.md (Contributor Covenant)
- SECURITY.md with responsible disclosure policy
- Architecture diagrams (SVG) for examples
- Detailed example READMEs with API endpoint documentation

### 🔧 CI/CD

- GitHub Actions workflow for tests (Node 16, 18, 20 on Ubuntu, macOS, Windows)
- Codecov integration for coverage reporting
- Automated changelog generation
- Pre-publish test checks

### 📝 Known Limitations

This beta release has some intentional limitations:

- Test coverage at 76% (target: 80%+ for v1.0)
- Import functionality implemented but not fully tested
- File-based SQLite storage available but in-memory is default
- Some workflow edge cases not fully validated

### 🎯 What's Next

We're targeting v1.0 with:
- Increased test coverage (80%+)
- Performance optimizations for large datasets
- Additional built-in workflows (Bug Tracker, Sprint Planner)
- WebSocket support for real-time collaboration
- Plugin system for extensibility

### 🙏 Credits

Built with ❤️ by the Kiara Lab team.

Special thanks to early contributors and the open source community.

---

## [0.2.0] - 2025-02-27

### 🎉 Production-Ready Release

TicketKit v0.2.0 brings PostgreSQL support, file attachments, activity log exports, and cumulative flow diagrams - making it production-ready for serious applications.

### ✨ Major Features

**PostgreSQL Adapter**
- Full PostgreSQL support for production deployments
- Connection pooling with automatic SSL detection for cloud databases
- JSONB storage for arrays and objects (labels, assignees, custom_fields)
- Parameterized queries for security (SQL injection prevention)
- Optimized indexes for performance
- Supports Supabase, AWS RDS, and other cloud PostgreSQL providers

**File Attachments**
- Complete attachment management system
- Methods: `createAttachment()`, `getAttachment()`, `listAttachments()`, `deleteAttachment()`
- Metadata tracking: filename, MIME type, file size, uploader, timestamps
- Automatic activity logging for attachment operations
- Database schema with foreign key relationships

**Activity Log Export**
- Export activity logs in JSON or CSV format
- Timezone support for timestamps
- Advanced querying: filter by date range, actors, actions
- CSV includes: timestamp, ticket_id, ticket_title, actor, action, details
- Methods: `exportActivityLog()`, `queryActivity()`

**Cumulative Flow Diagram (CFD) Reporting**
- Track ticket distribution across workflow states over time
- Methods: `takeSnapshot()`, `getCFDData()`, `backfillSnapshots()`
- Date range filtering for custom reports
- Automatic snapshot scheduling capability
- Useful for agile metrics and bottleneck identification

### 🔧 Improvements

**Database Enhancements**
- Added `board_id` column to activities table for efficient querying
- Added `attachments` table with comprehensive metadata
- Added `status_snapshots` table for CFD data
- Improved index strategy for faster queries
- Better error handling for database operations

**SSL/TLS Support**
- Automatic SSL detection for cloud databases
- Smart connection string parsing (removes problematic parameters)
- Support for self-signed certificates in development
- Works with Supabase, AWS RDS, Railway, Render

**API Consistency**
- Added `addAttachment()` convenience wrapper
- Consistent error messages across all adapters
- Better TypeScript definitions for new features

### 📦 Dependencies

**Added:**
- `pg` v8.18.0 - PostgreSQL client for Node.js

### 📝 Exports

**New Exports:**
```javascript
const { PostgreSQLAdapter } = require('ticketkit');
```

**Complete Export List:**
```javascript
const {
  TicketKit,
  SQLiteAdapter,
  PostgreSQLAdapter,  // NEW
  StorageAdapter,
  WORKFLOWS
} = require('ticketkit');
```

### 🚀 Migration Guide (v0.1.0 → v0.2.0)

**If using SQLite (no changes required):**
```javascript
// Still works exactly the same
const kit = await TicketKit.create();
```

**To switch to PostgreSQL:**
```javascript
const { TicketKit, PostgreSQLAdapter } = require('ticketkit');

const adapter = new PostgreSQLAdapter(process.env.DATABASE_URL);
const kit = await TicketKit.create({ storage: adapter });
```

**Using new features (fully backward compatible):**
```javascript
// File attachments
const attachment = await kit.createAttachment({
  ticket_id: 'xyz',
  filename: 'report.pdf',
  original_filename: 'Q4 Report.pdf',
  mime_type: 'application/pdf',
  size_bytes: 102400,
  storage_path: '/uploads/xyz/report.pdf',
  uploaded_by: 'user@example.com'
});

// Activity log export
const { data, count } = await kit.exportActivityLog(boardId, {
  format: 'csv',
  from: '2025-01-01',
  to: '2025-02-27',
  timezone: 'America/New_York'
});

// CFD snapshots
await kit.takeSnapshot(boardId);  // Take snapshot now
const cfdData = await kit.getCFDData(boardId, {
  from: '2025-02-01',
  to: '2025-02-27'
});
```

### 📚 Documentation

- Updated README with PostgreSQL setup examples
- Added migration guide for v0.1.0 users
- TypeScript definitions updated for all new methods

### 🐛 Bug Fixes

- Fixed SSL connection issues with cloud databases
- Improved error messages for invalid workflow transitions
- Better handling of null values in JSONB fields
- Fixed timezone handling in activity exports

### 🔬 Technical Details

**Code Size:**
- index.js: 905 lines → 1,945 lines (+115%)
- Added 45 new async methods
- PostgreSQLAdapter: ~660 lines of production code

**Backward Compatibility:**
- ✅ 100% backward compatible with v0.1.0
- ✅ All existing tests still pass
- ✅ No breaking changes to API
- ✅ SQLite users unaffected

### 🎯 What's Next (v0.3.0)

- Real-time updates via WebSockets
- Advanced search with full-text indexing
- Role-based access control (RBAC)
- Batch operations optimization
- Additional workflow templates

---

## [0.1.0] - 2025-02-04

### 🎉 Initial Beta Release

TicketKit's first public beta release! A lightweight JavaScript SDK for building task management systems like Trello, Asana, Jira, or vertical SaaS applications.

### ✨ Core Features

**SDK & Storage**
- Complete CRUD operations for boards, tickets, comments, and subtasks
- In-memory SQLite database with sql.js (production-ready file storage available)
- TypeScript definitions included (index.d.ts)
- Event emitter for real-time updates (`ticket:created`, `ticket:updated`, etc.)
- Export/import functionality for data portability

**Workflow Engine**
- 4 built-in workflows: Kanban, Scrum, Support (Zendesk-style), Simple
- Custom workflow support with state machine validation
- Enforced workflow transitions prevent invalid state changes
- Backlog management and Kanban view generation

**Ticket Management**
- Full metadata support: priority, labels, assignees, due dates, custom fields
- Parent-child relationships for subtasks and epics
- Position-based ordering within workflow states
- Bulk operations for batch updates
- Advanced search with query syntax (`status:todo`, `label:bug`, etc.)

**Activity & Comments**
- Automatic activity logging for all changes (who, what, when)
- Threaded comment system with parent-child replies
- Complete audit trail for compliance and debugging

**Developer Experience**
- Zero configuration required - works out of the box
- Async/await API throughout
- Comprehensive JSDoc comments
- 30 passing tests with 76%+ code coverage
- No external database dependencies

### 📦 Examples Included

**React Kanban Board** (`ticketkit-examples/react-kanban/`)
- Full-stack Kanban application with 48+ features
- React frontend with drag-and-drop (native HTML5)
- Express REST API backend
- Demonstrates 81% of TicketKit's API surface
- In-place editing, subtasks, comments, activity timeline, search

**Wedding Planner Vertical SaaS** (`ticketkit-examples/wedding-planner/`)
- Production-ready vertical SaaS example solving 5 real pain points
- Custom vendor management workflow (10 states)
- Custom client decision workflow (6 states)
- Multi-event dashboard with React UI
- Ghosting detection, approval audit trail, contact management
- Shows how to build industry-specific applications with TicketKit

### 📚 Documentation

- Comprehensive README with quick start, API reference, and examples
- CONTRIBUTING.md with development guidelines
- CODE_OF_CONDUCT.md (Contributor Covenant)
- SECURITY.md with responsible disclosure policy
- Architecture diagrams (SVG) for examples
- Detailed example READMEs with API endpoint documentation

### 🔧 CI/CD

- GitHub Actions workflow for tests (Node 16, 18, 20 on Ubuntu, macOS, Windows)
- Codecov integration for coverage reporting
- Automated changelog generation
- Pre-publish test checks

### 📝 Known Limitations

This beta release has some intentional limitations:

- Test coverage at 76% (target: 80%+ for v1.0)
- Import functionality implemented but not fully tested
- File-based SQLite storage available but in-memory is default
- Some workflow edge cases not fully validated

### 🎯 What's Next

We're targeting v1.0 with:
- Increased test coverage (80%+)
- Performance optimizations for large datasets
- Additional built-in workflows (Bug Tracker, Sprint Planner)
- WebSocket support for real-time collaboration
- Plugin system for extensibility

### 🙏 Credits

Built with ❤️ by the Kiara Lab team.

Special thanks to early contributors and the open source community.

---

## [Unreleased]

_Changes that are in development but not yet released will appear here._

---

[0.2.0]: https://github.com/Kiara-01-Lab/ticket.api-public/releases/tag/v0.2.0
[0.1.0]: https://github.com/Kiara-01-Lab/ticket.api-public/releases/tag/v0.1.0
