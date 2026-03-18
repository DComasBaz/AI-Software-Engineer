# WebCalculator

A simple, responsive web-based calculator built with HTML, CSS, and JavaScript. It provides basic arithmetic operations with a clean UI and keyboard support.

## Features
- Basic arithmetic: addition, subtraction, multiplication, division
- Decimal calculations
- Clear (C) and All Clear (AC) functions
- Keyboard shortcuts:
  - `Enter` → evaluate (`=`)
  - `Esc` → clear current entry
  - Optional arrow keys for navigating input (if implemented)
- Error handling for invalid operations (e.g., division by zero) with user-friendly messages
- Responsive design for desktop and mobile devices

## Tech Stack
- **HTML** – Structure of the calculator interface (`index.html`)
- **CSS** – Styling and responsive layout (`styles.css`)
- **JavaScript** – Interactive logic and calculations (`script.js`)

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```
2. Open `index.html` in any modern web browser (no build step or server required).
3. The calculator will load with full functionality.

## Usage Guide
- **Button Layout**: The calculator displays a numeric keypad (0‑9), decimal point, arithmetic operators (`+`, `-`, `*`, `/`), an equals (`=`) button, and clear buttons (`C` for entry clear, `AC` for all clear).
- **Keyboard Shortcuts**:
  - Press `Enter` to evaluate the current expression (same as clicking `=`).
  - Press `Esc` to clear the current entry (same as clicking `C`).
  - Arrow keys may be used to move the cursor within the display if the implementation supports it.
- **Error Display**: When an invalid operation occurs (e.g., division by zero), the display shows an error message such as `Error` or `Invalid input`. The user can press `Esc` or `C` to reset.

## Development Notes
- **`index.html`** – Defines the calculator layout, including the display area and button grid. It links to `styles.css` for styling and `script.js` for behavior.
- **`styles.css`** – Provides responsive styling, ensuring the calculator looks good on various screen sizes. Adjustments can be made here to change colors, spacing, or layout.
- **`script.js`** – Contains all interactive logic:
  - Handles button clicks and keyboard events.
  - Performs arithmetic operations and updates the display.
  - Manages error states and clear functions.
- **Extending the Calculator**:
  - Add scientific functions (e.g., `sin`, `cos`, `log`) by extending the operation handling in `script.js` and adding corresponding buttons in `index.html`.
  - Implement a history log by storing previous calculations in an array and displaying them in a dedicated UI section.
  - Enhance accessibility with ARIA attributes and focus management.

## License
[Insert appropriate license here]

---

**Integration Flow**: The HTML file (`index.html`) loads the stylesheet (`styles.css`) for visual styling and then the script (`script.js`) which attaches event listeners to the DOM elements defined in the HTML. This separation ensures a clear, maintainable structure where presentation, style, and behavior are isolated.
