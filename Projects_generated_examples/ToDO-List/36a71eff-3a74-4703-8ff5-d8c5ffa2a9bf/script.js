// Task model definition
// This module defines the Task class used throughout the application.
// It can be used both in a browser environment (attached to window) and in a CommonJS/module environment.

class Task {
  /**
   * Create a new Task.
   * @param {string|number} id - Unique identifier for the task.
   * @param {string} text - Description of the task.
   * @param {boolean} [completed=false] - Completion status.
   */
  constructor(id, text, completed = false) {
    this.id = id;
    this.text = text;
    this.completed = completed;
  }

  /**
   * Toggle the completed state of the task.
   */
  toggle() {
    this.completed = !this.completed;
  }

  /**
   * Convert the task instance to a plain object suitable for JSON serialization.
   * @returns {{id: (string|number), text: string, completed: boolean}}
   */
  toJSON() {
    return {
      id: this.id,
      text: this.text,
      completed: this.completed,
    };
  }
}

// Persistence layer using localStorage
const STORAGE_KEY = 'todo-tasks';

/**
 * Load tasks from localStorage.
 * @returns {Task[]} Array of Task instances.
 */
function loadTasks() {
  if (typeof localStorage === 'undefined') {
    // Not in a browser environment; return empty array.
    return [];
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      return [];
    }
    return data.map(item => new Task(item.id, item.text, item.completed));
  } catch (e) {
    // If parsing fails, clear the corrupted data and return empty list.
    console.error('Failed to parse tasks from localStorage:', e);
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

/**
 * Save an array of Task objects to localStorage.
 * @param {Task[]} tasks
 */
function saveTasks(tasks) {
  if (typeof localStorage === 'undefined') {
    // Not in a browser environment; no-op.
    return;
  }
  const plain = tasks.map(task => task.toJSON());
  try {
    const serialized = JSON.stringify(plain);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    console.error('Failed to serialize tasks for localStorage:', e);
  }
}

/**
 * Create a DOM element representing a single task.
 * @param {Task} task - The task instance to render.
 * @returns {HTMLLIElement} The constructed <li> element.
 *
 * The element includes:
 *   - A checkbox reflecting completion state.
 *   - A label showing the task text.
 *   - A hidden text input for edit mode.
 *   - A delete button.
 *
 * Event listeners are attached to dispatch custom events that higher‑level
 * code can listen for:
 *   - "toggle"   – when the checkbox changes.
 *   - "edit"     – when an edit is committed (blur or Enter).
 *   - "delete"   – when the delete button is clicked.
 * The events bubble, and their `detail` property contains the task id and
 * any relevant payload.
 */
function createTaskElement(task) {
  // Create the container <li>
  const li = document.createElement('li');
  li.className = 'task-item';
  li.dataset.id = task.id;

  // Checkbox for completion toggle
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'toggle';
  checkbox.checked = !!task.completed;
  li.appendChild(checkbox);

  // Label displaying the task text
  const label = document.createElement('label');
  label.className = 'task-label';
  label.textContent = task.text;
  li.appendChild(label);

  // Hidden input for editing
  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'edit-input';
  editInput.style.display = 'none'; // hidden by default
  li.appendChild(editInput);

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = '✖';
  li.appendChild(deleteBtn);

  // ----- Event handling -----

  // Toggle completion
  checkbox.addEventListener('change', () => {
    li.dispatchEvent(new CustomEvent('toggle', {
      detail: { id: task.id, completed: checkbox.checked },
      bubbles: true,
    }));
  });

  // Enter edit mode on double‑click of the label
  label.addEventListener('dblclick', () => {
    editInput.value = task.text;
    label.style.display = 'none';
    editInput.style.display = '';
    editInput.focus();
    editInput.select();
  });

  // Helper to commit edit
  const commitEdit = () => {
    const newText = editInput.value.trim();
    if (newText && newText !== task.text) {
      li.dispatchEvent(new CustomEvent('edit', {
        detail: { id: task.id, text: newText },
        bubbles: true,
      }));
    }
    // Restore view mode
    editInput.style.display = 'none';
    label.style.display = '';
  };

  // Commit on blur
  editInput.addEventListener('blur', commitEdit);

  // Commit on Enter key
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      commitEdit();
      // Prevent form submission if inside a form
      e.preventDefault();
    }
  });

  // Delete button click
  deleteBtn.addEventListener('click', () => {
    li.dispatchEvent(new CustomEvent('delete', {
      detail: { id: task.id },
      bubbles: true,
    }));
  });

  return li;
}

/**
 * Render the list of tasks into the UI.
 *
 * @param {Task[]} tasks - Array of Task instances.
 * @param {string} [filter='all'] - One of "all", "active", "completed".
 */
function renderTasks(tasks, filter = 'all') {
  // Find the task list container.
  const listEl = document.getElementById('task-list');
  if (!listEl) {
    console.warn('renderTasks: No element with id "task-list" found.');
    return;
  }

  // Clear any existing content.
  listEl.innerHTML = '';

  // Determine which tasks should be displayed based on the filter.
  const filtered = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return !!task.completed;
    return true; // 'all' or any unknown value defaults to showing everything.
  });

  // Append each task element to the list.
  filtered.forEach(task => {
    const el = createTaskElement(task);
    listEl.appendChild(el);
  });

  // Update filter button UI state.
  const filterNames = ['all', 'active', 'completed'];
  filterNames.forEach(name => {
    const btn = document.getElementById(`filter-${name}`);
    if (btn) {
      btn.classList.toggle('active-filter', name === filter);
    }
  });

  // Show or hide the "Clear completed" button based on existence of completed tasks.
  const clearBtn = document.getElementById('clear-completed');
  if (clearBtn) {
    const anyCompleted = tasks.some(t => t.completed);
    clearBtn.style.display = anyCompleted ? '' : 'none';
  }
}

// Export for module systems or attach to the global window object for browser usage.
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { Task, loadTasks, saveTasks, createTaskElement, renderTasks };
} else if (typeof define === 'function' && define.amd) {
  define(function () { return { Task, loadTasks, saveTasks, createTaskElement, renderTasks }; });
} else {
  // Attach to global window (browser) if available.
  if (typeof window !== 'undefined') {
    window.Task = Task;
    window.loadTasks = loadTasks;
    window.saveTasks = saveTasks;
    window.createTaskElement = createTaskElement;
    window.renderTasks = renderTasks;
  }
}

/* -------------------------------------------------------------------------- */
/* User Interaction Handlers and Application Initialization                    */
/* -------------------------------------------------------------------------- */

// Global state
let tasks = [];
let currentFilter = 'all';

/**
 * Re‑render the UI using the current tasks and filter.
 */
function refreshUI() {
  renderTasks(tasks, currentFilter);
}

/**
 * Add a new task from the input field when the user presses Enter.
 * @param {KeyboardEvent} event
 */
function handleAddTask(event) {
  if (event.key !== 'Enter') return;
  const input = event.target;
  const text = input.value.trim();
  if (!text) return;
  const id = Date.now(); // simple unique id based on timestamp
  const newTask = new Task(id, text);
  tasks.push(newTask);
  input.value = '';
  saveTasks(tasks);
  refreshUI();
}

/**
 * Toggle completion status of a task.
 * @param {string|number} id
 */
function handleToggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.toggle();
    saveTasks(tasks);
    refreshUI();
  }
}

/**
 * Edit the text of a task.
 * @param {string|number} id
 * @param {string} newText
 */
function handleEditTask(id, newText) {
  const task = tasks.find(t => t.id === id);
  if (task && newText.trim()) {
    task.text = newText.trim();
    saveTasks(tasks);
    refreshUI();
  }
}

/**
 * Delete a task from the list.
 * @param {string|number} id
 */
function handleDeleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks(tasks);
  refreshUI();
}

/**
 * Remove all completed tasks.
 */
function handleClearCompleted() {
  tasks = tasks.filter(t => !t.completed);
  saveTasks(tasks);
  refreshUI();
}

/**
 * Change the current filter and re‑render.
 * @param {string} filter - "all", "active" or "completed".
 */
function handleFilterChange(filter) {
  if (['all', 'active', 'completed'].includes(filter)) {
    currentFilter = filter;
    refreshUI();
  }
}

/**
 * Initialise the application: load persisted tasks, wire up DOM events,
 * and render the initial UI.
 */
function initApp() {
  // Load persisted tasks
  tasks = loadTasks();
  // Initial render
  refreshUI();

  // Input: add task on Enter
  const newTaskInput = document.getElementById('new-task-input');
  if (newTaskInput) {
    newTaskInput.addEventListener('keydown', handleAddTask);
  }

  // Delegated custom events from task items
  const taskList = document.getElementById('task-list');
  if (taskList) {
    taskList.addEventListener('toggle', (e) => {
      const { id } = e.detail;
      handleToggleTask(id);
    });
    taskList.addEventListener('edit', (e) => {
      const { id, text } = e.detail;
      handleEditTask(id, text);
    });
    taskList.addEventListener('delete', (e) => {
      const { id } = e.detail;
      handleDeleteTask(id);
    });
  }

  // Filter buttons
  ['all', 'active', 'completed'].forEach(name => {
    const btn = document.getElementById(`filter-${name}`);
    if (btn) {
      btn.addEventListener('click', () => handleFilterChange(name));
    }
  });

  // Clear completed button
  const clearBtn = document.getElementById('clear-completed');
  if (clearBtn) {
    clearBtn.addEventListener('click', handleClearCompleted);
  }

  // Global keyboard shortcut: Ctrl+Enter focuses the input field
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      if (newTaskInput) newTaskInput.focus();
      e.preventDefault();
    }
  });
}

// Run init after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
