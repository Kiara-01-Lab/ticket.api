# Contributing to TicketKit

Thanks for your interest in contributing to TicketKit! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm >= 7.0.0
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone git@github.com:YOUR_USERNAME/ticket.api.git
cd ticket.api
```

3. Add the upstream repository:

```bash
git remote add upstream git@github.com:Kiara-01-Lab/ticket.api-public.git
```

### Install Dependencies

```bash
npm install
```

### Verify Setup

Run the test suite to ensure everything is working:

```bash
npm test
```

All tests should pass with >75% coverage.

## Development Workflow

### Create a Branch

Create a new branch for your changes:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or updates

### Make Your Changes

1. Write your code
2. Add tests for new functionality
3. Ensure all tests pass: `npm test`
4. Update documentation if needed

### Commit Your Changes

We follow conventional commit messages:

```bash
git commit -m "feat: add ticket filtering by multiple labels"
git commit -m "fix: resolve workflow transition validation bug"
git commit -m "docs: update API reference for search methods"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test changes
- `refactor:` - Code refactoring
- `chore:` - Build/tooling changes

## Submitting Changes

### Before Submitting

1. **Update from upstream:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **Check code quality:**
   - No console.log statements in production code
   - No commented-out code
   - Follow existing code style

### Create a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Go to the [repository](https://github.com/Kiara-01-Lab/ticket.api-public)
3. Click "New Pull Request"
4. Select your branch
5. Fill out the PR template completely
6. Link any related issues

### PR Review Process

- Maintainers will review your PR
- Address any requested changes
- Once approved, your PR will be merged
- Your contribution will be included in the next release

## Coding Standards

### JavaScript Style

- Use ES6+ features where appropriate
- Use async/await instead of callbacks
- No semicolons (project convention)
- 2 spaces for indentation
- Descriptive variable names

### Code Quality

- **DRY principle:** Don't repeat yourself
- **Single responsibility:** Functions should do one thing well
- **Error handling:** Always handle errors gracefully
- **Comments:** Explain WHY, not WHAT

### Example

```javascript
// Good
async function deleteTicketWithCleanup(ticketId) {
  try {
    // Delete comments first to maintain referential integrity
    await this.deleteTicketComments(ticketId)
    await this.deleteTicket(ticketId)
  } catch (error) {
    throw new Error(`Failed to delete ticket ${ticketId}: ${error.message}`)
  }
}

// Avoid
async function del(id) {
  this.db.run("DELETE FROM tickets WHERE id = ?", [id])
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# CI mode (what GitHub Actions runs)
npm run test:ci
```

### Writing Tests

- Every new feature needs tests
- Bug fixes should include regression tests
- Aim for >75% code coverage
- Tests should be isolated and deterministic

### Test Structure

```javascript
describe('TicketKit - Feature Name', () => {
  let kit

  beforeEach(async () => {
    kit = await TicketKit.create()
  })

  test('should do something specific', async () => {
    // Arrange
    const board = await kit.createBoard({ name: 'Test' })

    // Act
    const result = await kit.someMethod(board.id)

    // Assert
    expect(result).toBeDefined()
    expect(result.id).toBe(board.id)
  })
})
```

## Reporting Bugs

### Before Reporting

1. Check [existing issues](https://github.com/Kiara-01-Lab/ticket.api-public/issues)
2. Try the latest version
3. Isolate the problem

### Creating a Bug Report

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml) and include:

- Clear title
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS)
- Code sample (if possible)
- Error messages/stack traces

## Suggesting Features

### Before Suggesting

1. Check if it already exists
2. Search [existing feature requests](https://github.com/Kiara-01-Lab/ticket.api-public/issues?q=label%3Aenhancement)
3. Consider if it fits the project scope

### Creating a Feature Request

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml) and include:

- Clear use case
- Proposed API/implementation
- Examples of how it would be used
- Why it benefits other users

## Questions?

- Open a [Discussion](https://github.com/Kiara-01-Lab/ticket.api-public/discussions)
- Check existing documentation
- Ask in your PR/issue

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to TicketKit!** 🎫
