// Data layer
let tasks = [];

function loadTasks() {
  const stored = localStorage.getItem('tasks');
  if (stored) {
    tasks = JSON.parse(stored);
  }
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Rendering
function renderAll(filter = 'all') {
  const taskList = document.getElementById('taskList');
  taskList.innerHTML = '';

  let filteredTasks = tasks;
  if (filter === 'active') {
    filteredTasks = tasks.filter(task => !task.complete);
  } else if (filter === 'completed') {
    filteredTasks = tasks.filter(task => task.complete);
  }

  filteredTasks.forEach(task => {
    const li = document.createElement('li');
    
    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.complete;
    checkbox.addEventListener('change', () => {
      task.complete = checkbox.checked;
      saveTasks();
      renderAll(filter);
    });
    
    // Task text span
    const span = document.createElement('span');
    span.textContent = task.text;
    if (task.complete) {
      span.classList.add('completed');
    }
    
    // Double click to edit
    span.addEventListener('dblclick', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = task.text;
      input.className = 'edit-input';
      
      const saveEdit = () => {
        task.text = input.value.trim();
        if (task.text) {
          saveTasks();
          renderAll(filter);
        }
      };
      
      input.addEventListener('blur', saveEdit);
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          saveEdit();
        }
      });
      
      li.replaceChild(input, span);
      input.focus();
    });
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'deleteBtn';
    deleteBtn.addEventListener('click', () => {
      const index = tasks.findIndex(t => t.id === task.id);
      if (index !== -1) {
        tasks.splice(index, 1);
        saveTasks();
        renderAll(filter);
      }
    });
    
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });

  // Update task counter
  const activeCount = tasks.filter(task => !task.complete).length;
  document.getElementById('taskCounter').textContent = `${activeCount} active task${activeCount !== 1 ? 's' : ''}`;
}

// User input
function addTask() {
  const input = document.getElementById('taskInput');
  const text = input.value.trim();
  
  if (text) {
    tasks.push({
      id: Date.now(),
      text: text,
      complete: false
    });
    saveTasks();
    input.value = '';
    renderAll();
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  renderAll();
  
  // Add button
  document.getElementById('addBtn').addEventListener('click', addTask);
  
  // Enter key on input
  document.getElementById('taskInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addTask();
    }
  });
  
  // Filter buttons
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      button.classList.add('active');
      
      const filter = button.getAttribute('data-filter');
      renderAll(filter);
    });
  });
  
  // Clear completed button
  document.getElementById('clearBtn').addEventListener('click', () => {
    tasks = tasks.filter(task => !task.complete);
    saveTasks();
    renderAll();
  });
});