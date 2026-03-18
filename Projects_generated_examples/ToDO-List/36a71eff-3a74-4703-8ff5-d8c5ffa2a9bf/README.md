# Simple To‑Do List App

A lightweight, browser‑only **To‑Do List** web application that lets users create, edit, complete, filter, and clear tasks. All data is persisted in the browser's `localStorage`, so tasks survive page reloads without any backend.

---

## Overview

- **Add tasks** with a single input field.
- **Edit** a task inline by double‑clicking its label.
- **Toggle** completion via a checkbox.
- **Delete** tasks individually.
- **Filter** tasks (All / Active / Completed).
- **Clear completed** tasks with one click.
- **Keyboard shortcuts** – `Enter` to add a task, `Ctrl+Enter` to focus the input, `Enter` while editing to commit changes.
- Fully **responsive** – works on mobile, tablet, and desktop.

---

## Tech Stack

| Technology | Role |
|------------|------|
| **HTML5**  | Structure of the page (`index.html`). |
| **CSS3**   | Styling and responsive layout (`styles.css`). |
| **JavaScript (ES6)** | Application logic, task model, storage, rendering, and event handling (`script.js`). |

No external libraries or build tools are required.

---

## Folder / File Structure

```
/ (project root)
├─ index.html      # Main page markup
├─ styles.css      # Styles and responsive design
└─ script.js       # All JavaScript (model, persistence, UI rendering, event handling)
```

All three files are placed at the project root for simplicity. The JavaScript file is written so it can be used directly in the browser **or** imported as a CommonJS/AMD module.

---

## Setup Instructions

1. **Clone the repository** (or download the zip):
   ```bash
   git clone https://github.com/your‑username/simple‑todo‑app.git
   cd simple‑todo‑app
   ```
2. **Open the app** – simply open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari, etc.). No server or build step is required.
   ```bash
   # On macOS/Linux you can use the open command:
   open index.html
   # Or on Windows:
   start index.html
   ```
3. The app will load any previously saved tasks from `localStorage` automatically.

---

## Usage Guide

### Adding a Task
- Click the input field at the top (or press `Ctrl+Enter` from anywhere) to focus it.
- Type the task description and press **Enter**.
- The new task appears at the bottom of the list.

### Editing a Task
- Double‑click a task's label.
- An inline text field appears; modify the text.
- Press **Enter** or click outside the field to commit the edit.

### Completing / Un‑completing a Task
- Click the checkbox next to a task to toggle its completed state.
- Completed tasks are shown with a visual style (e.g., strikethrough) and are included/excluded by the filter buttons.

### Deleting a Task
- Click the ✖ button on the right side of a task.

### Filtering Tasks
- **All** – shows every task.
- **Active** – shows only tasks that are not completed.
- **Completed** – shows only completed tasks.
- The active filter button is highlighted.

### Clearing Completed Tasks
- When at least one task is completed, the **Clear completed** button becomes visible.
- Click it to permanently remove all completed tasks.

### Keyboard Shortcuts
- **Enter** (while focus is on the new‑task input) – add a task.
- **Ctrl + Enter** – focus the new‑task input from anywhere.
- **Enter** (while editing a task) – commit the edit.

---

## Architecture

### 1. Task Model (`Task` class)
- Holds `id`, `text`, and `completed` properties.
- Provides `toggle()` to flip the completed flag and `toJSON()` for serialization.

### 2. Persistence Layer
- Uses **localStorage** under the key `todo-tasks`.
- `loadTasks()` reads and converts stored JSON into `Task` instances.
- `saveTasks(tasks)` serializes the current task array back to storage.

### 3. Rendering Flow (`renderTasks`)
- Clears the `<ul id="task-list">` container.
- Filters tasks based on the current filter (`all`, `active`, `completed`).
- For each visible task, `createTaskElement(task)` builds an `<li>` element with:
  - Checkbox
  - Label
  - Hidden edit input
  - Delete button
- Custom events (`toggle`, `edit`, `delete`) are dispatched from each `<li>` and bubble up to the list container.
- Filter button UI state and the visibility of the **Clear completed** button are updated.

### 4. Event Handling & Application State
- Global `tasks` array holds the current in‑memory list.
- `currentFilter` stores the active filter.
- UI actions are wired in `initApp()`:
  - **Add** – `keydown` on the input.
  - **Toggle / Edit / Delete** – delegated custom events from task elements.
  - **Filter** – click listeners on filter buttons.
  - **Clear completed** – click listener on the clear button.
  - **Global shortcut** – `Ctrl+Enter` focuses the input.
- After any state change, `saveTasks()` persists the data and `refreshUI()` re‑renders.

### 5. Module Compatibility
- The script checks for CommonJS (`module.exports`), AMD (`define`), or falls back to attaching the public API (`Task`, `loadTasks`, `saveTasks`, `createTaskElement`, `renderTasks`) to `window` for direct browser usage.

---

## Responsive Design

- The layout uses a flexible container that scales to the viewport width.
- Font sizes and button paddings adapt via CSS media queries (see `styles.css`).
- On small screens, the task list occupies the full width, and controls wrap vertically for easy touch interaction.

---

## Known Limitations & Future Improvements

| Limitation | Explanation | Possible Fix |
|------------|-------------|--------------|
| **No server‑side sync** | Tasks are stored only locally; switching browsers or devices loses data. | Add a backend API or integrate with a cloud storage service. |
| **Simple ID generation** | Uses `Date.now()` which could collide if tasks are added extremely quickly. | Use a UUID generator or incrementing counter stored in `localStorage`. |
| **No drag‑and‑drop ordering** | Tasks are always displayed in creation order. | Implement a sortable list using the HTML5 Drag‑and‑Drop API. |
| **Limited accessibility** | ARIA attributes and focus management are minimal. | Enhance markup with proper ARIA roles, labels, and keyboard navigation. |
| **No unit tests** | The codebase lacks automated tests. | Add Jest or Mocha tests for the model and storage functions. |

---

## Contributing

Feel free to fork the repository, open issues, or submit pull requests. Please keep the code vanilla (no additional frameworks) to preserve the project's minimal footprint.

---

## License

This project is released under the **MIT License** – see the `LICENSE` file for details.
