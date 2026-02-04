# 03 - React Kanban

> A production-ready Kanban board with 48+ features including drag-and-drop, subtasks, comments, activity tracking, search, and more.

![Screenshot](./screenshot.png)

## What This Demonstrates

This comprehensive example showcases TicketKit's full capabilities:

- **React frontend** with Vite and modern hooks
- **Native HTML5 drag-and-drop** (no library needed)
- **Subtask management** with workflow-compliant state transitions
- **Comments system** with threaded replies
- **Activity timeline** for complete audit logging
- **Search & filtering** by priority, labels, and keywords
- **Board management** with creation and switching
- **Flat design system** with professional, content-focused UI
- **In-place editing** for all ticket fields
- **81% API coverage** (13 of 16 endpoints)

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Start both server and client
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001

## Project Structure

```
03-react-kanban/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.jsx         # Main app component
│   │   ├── App.css         # All styles
│   │   ├── main.jsx        # Entry point
│   │   └── components/
│   │       ├── Board.jsx   # Board container
│   │       ├── Column.jsx  # Kanban column
│   │       ├── Ticket.jsx  # Ticket card
│   │       └── CreateTicketModal.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                 # Express backend
│   ├── index.js
│   └── package.json
└── package.json            # Root scripts
```

## Features (48 Total)

### UI/UX (10 features)
1. **Flat design system** - No emojis, minimal decoration, professional appearance
2. **Compact spacing** - Content-focused layout throughout
3. **Text-based priority labels** - URGENT, HIGH, MEDIUM, LOW
4. **Square avatars** - Clean user representation
5. **Horizontal comment form** - Optimized layout at bottom
6. **Responsive layout** - Works on all screen sizes
7. **Professional color scheme** - Subtle, accessible colors
8. **Accessible** - ARIA labels for screen readers
9. **Clean visual hierarchy** - Clear information architecture
10. **Content-focused design** - Distraction-free interface

### Ticket Management (12 features)
11. **Drag-and-drop** between columns (native HTML5)
12. **Create tickets** with priority, labels, assignees, due dates
13. **Delete tickets** from card menu
14. **In-place title editing** - Click to edit
15. **In-place description editing** - Textarea with auto-resize
16. **In-place priority editing** - Dropdown selector
17. **In-place labels editing** - Comma-separated input
18. **In-place assignees editing** - User ID input
19. **In-place due date editing** - Date picker
20. **Overdue indicator** - Red badge when past due
21. **Smart "Save" button** - Only appears when fields modified
22. **Auto-refresh board** after save

### Subtasks (7 features)
23. **Create subtasks** inline
24. **Check/uncheck subtasks** with working checkboxes
25. **Workflow-compliant state transitions** - Sequential status changes
26. **Incomplete count badge** - Shows number of incomplete subtasks in tab
27. **Progress bar** - Visual completion percentage
28. **Sort incomplete first** - Prioritizes active subtasks
29. **Real-time parent updates** - Board refreshes automatically

### Comments (4 features)
30. **View all comments** - Chronological order
31. **Add comments inline** - Simple textarea input
32. **User avatars** - Initials displayed
33. **Timestamp display** - Shows when comment was added

### Activity (2 features)
34. **Complete audit log** - Full history of all changes
35. **Field change tracking** - Shows what changed and who changed it

### Search & Filter (3 features)
36. **Real-time search** - Instant results as you type
37. **Filter by priority** - Dropdown to filter urgent/high/medium/low
38. **Clear filters** - Button to reset all filters

### Boards (4 features)
39. **Board switching** - Dropdown to switch between boards
40. **Create new boards** - Modal with name input
41. **Auto-switch to new board** - Immediately switches after creation
42. **Active board indicator** - Check mark on current board

### System (6 features)
43. **RESTful API integration** - Clean API calls with fetch
44. **Error handling** - Try-catch blocks with user-friendly messages
45. **Loading states** - Spinners and disabled states during operations
46. **Empty states** - Helpful messages when no data
47. **In-memory database** - Fast, ephemeral storage
48. **Demo data seeding** - Auto-populated sample tickets on startup

## Component Architecture

```
client/src/components/
├── ActivityTimeline.jsx      # Audit log viewer
├── Board.jsx                  # Board container
├── BoardSwitcher.jsx          # Board dropdown selector
├── Column.jsx                 # Kanban column with drop zones
├── CreateBoardModal.jsx       # New board creation
├── CreateTicketModal.jsx      # New ticket form
├── SearchBar.jsx              # Search and filter controls
├── SubtaskList.jsx            # Subtask manager with checkboxes
├── Ticket.jsx                 # Ticket card with drag support
└── TicketDetailModal.jsx      # Combined view/edit modal
```

## Customization

### Change Columns

Edit `Board.jsx`:

```javascript
const COLUMN_ORDER = ['backlog', 'todo', 'in_progress', 'review', 'done'];

const COLUMN_LABELS = {
  backlog: '📥 Backlog',
  todo: '📋 To Do',
  // ...
};
```

### Change Theme

Edit CSS variables in `App.css`:

```css
:root {
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-primary: #3b82f6;
  /* ... */
}
```

### Use Different Workflow

Change the workflow in `server/index.js`:

```javascript
const board = await kit.createBoard({
  name: 'Demo Project',
  workflow_id: 'scrum'  // or 'support', 'simple'
});
```

## API Endpoints Used (13 of 16)

| Method | Endpoint | Purpose | Feature |
|--------|----------|---------|---------|
| GET | `/api/boards` | List all boards | Board switcher |
| POST | `/api/boards` | Create new board | Board creation |
| GET | `/api/boards/:id/kanban` | Get Kanban view | Board display |
| POST | `/api/tickets` | Create ticket | Ticket creation |
| PATCH | `/api/tickets/:id` | Update ticket | In-place editing |
| DELETE | `/api/tickets/:id` | Delete ticket | Ticket deletion |
| POST | `/api/tickets/:id/move` | Move ticket status | Drag-and-drop |
| GET | `/api/tickets/:id/comments` | List comments | Comments tab |
| POST | `/api/tickets/:id/comments` | Add comment | Comment form |
| GET | `/api/tickets/:id/activity` | Get activity log | Activity timeline |
| GET | `/api/tickets/:id/subtasks` | List subtasks | Subtasks tab |
| POST | `/api/tickets/:id/subtasks` | Create subtask | Subtask creation |
| PATCH | `/api/tickets/:id` | Update subtask status | Subtask checkboxes |

**Unused Endpoints (3):**
- `GET /api/boards/:id` - Redundant (using list endpoint)
- `POST /api/tickets/:id/assign` - Using PATCH instead
- `GET /api/search` - Client-side filtering sufficient for demo

**API Coverage: 81.25%** (13 of 16 endpoints demonstrated)

## Building for Production

```bash
# Build the React app
npm run build

# The output is in client/dist/
```

Serve with any static file server:

```bash
npx serve client/dist
```

## Technical Highlights

### Workflow Compliance

The subtask system implements strict workflow state machine transitions:

```javascript
// Forward transitions: backlog → todo → in_progress → review → done
// Backward transitions: done → review → in_progress → todo

// Cannot skip states - must transition sequentially
// This prevents workflow violations and maintains data integrity
```

### Combined View/Edit Modal

Single `TicketDetailModal` component handles both viewing and editing:

```jsx
// Smart "Save" button only appears when fields are modified
const [hasChanges, setHasChanges] = useState(false);

// Three-row header layout: ID badge + actions | title | metadata
// Tabs for Comments, Activity, and Subtasks
```

### Native Drag-and-Drop

No libraries required - uses HTML5 drag events:

```jsx
<div
  draggable
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
>
  {/* Ticket content */}
</div>
```

## Future Enhancement Ideas

- **Real-time collaboration** - WebSocket for live updates
- **Persistent storage** - File-based SQLite instead of in-memory
- **Bulk operations** - Multi-select tickets for batch actions
- **Keyboard shortcuts** - Power user features (j/k navigation, etc.)
- **Dark mode** - Theme toggle
- **Time tracking** - Log hours on tickets
- **Custom fields** - User-defined metadata
- **Email notifications** - Alert on ticket changes
- **Mobile app** - React Native version
- **Offline support** - Service worker with sync

## Related Examples

- **[01-basic](../01-basic)** — Simple task list basics
- **[02-express-api](../02-express-api)** — REST API fundamentals
- **[ticketkit-examples/](../)** — More examples and use cases
