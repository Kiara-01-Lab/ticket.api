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

## [Unreleased]

_Changes that are in development but not yet released will appear here._

---

[0.1.0]: https://github.com/Kiara-01-Lab/ticket.api-public/releases/tag/v0.1.0
