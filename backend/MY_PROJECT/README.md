# To-Do List App

A simple, responsive web-based to-do list application for managing daily tasks.

## Description

This is a lightweight, single-page to-do list application built with vanilla HTML, CSS, and JavaScript. It provides essential task management features with persistent storage using browser localStorage, ensuring tasks remain available across browser sessions. The application follows a clean architecture with separation of concerns between structure (HTML), presentation (CSS), and behavior (JavaScript).

## Features

* Add new tasks via input field or Enter key
* Mark tasks as complete/incomplete with checkboxes
* Delete individual tasks with delete button
* Automatic persistence to browser localStorage
* Responsive design for mobile and desktop
* Clean, intuitive user interface
* Task list updates in real-time

## Setup

1. Clone or download the repository.
2. Open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge).

## Code Structure

### HTML Structure
- Semantic structure with header, main content area, and task list container
- Input field and add button for new tasks
- Task items with checkbox, text, and delete button

### CSS Responsiveness
- Mobile-first responsive design approach
- Flexbox layout for dynamic content alignment
- Media queries for tablet and desktop adaptations
- Interactive hover states on interactive elements

### JavaScript Data Flow
- Event listeners for user interactions (add, toggle, delete)
- localStorage API for persistent task storage
- Array-based task management with unique IDs
- DOM manipulation for real-time UI updates
- Automatic save/load on page lifecycle

```html
<!-- Screenshot placeholder - add screenshot here -->
```

## License

MIT License - see LICENSE file for details.