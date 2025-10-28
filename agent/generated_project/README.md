# SimpleCalculator

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/yourusername/SimpleCalculator/actions)

---

## Description

**SimpleCalculator** is a lightweight, web‑based calculator that runs entirely in the browser. It is built with plain HTML, CSS, and JavaScript—no build tools, frameworks, or external dependencies are required.

- **Tech Stack**: HTML5, CSS3 (custom properties & responsive grid), vanilla JavaScript (ES6+).
- **Key Features**:
  - Full arithmetic support (addition, subtraction, multiplication, division).
  - Real‑time expression evaluation using a safe `Function` wrapper.
  - Keyboard navigation for a desktop‑friendly experience.
  - Accessible markup with ARIA live regions and proper button semantics.
  - Responsive layout that works on mobile and desktop screens.

---

## Demo

![Calculator Demo](https://via.placeholder.com/600x400?text=Calculator+Demo+GIF)

> **Live demo**: <https://yourusername.github.io/SimpleCalculator/>

---

## Installation / Usage

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/SimpleCalculator.git
   cd SimpleCalculator
   ```
2. **Open the app**
   Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari). No build step, npm install, or server is required.

---

## Keyboard Controls

| Key | Action |
|-----|--------|
| `0`‑`9` | Input digit |
| `.` | Decimal point |
| `+` | Addition |
| `-` | Subtraction |
| `*` | Multiplication |
| `/` | Division |
| `Enter` | Evaluate expression (=) |
| `Backspace` | Delete last character |
| `Escape` | Clear the display |

---

## Code Structure

- **`index.html`** – Defines the calculator layout and assigns IDs/classes used by the script and stylesheet.
- **`style.css`** – Contains all styling, including a responsive CSS grid, custom properties for colors, and focus styles for accessibility.
- **`script.js`** – Implements the `Calculator` class, wires up button and keyboard events, and safely evaluates arithmetic expressions using `new Function`.

---

## Design Decisions

### Why `Function` instead of `eval`
Using `new Function('return ' + expression)()` provides a sandboxed way to evaluate a mathematical expression without exposing the full `eval` capabilities. It limits the evaluated code to a single expression, mitigating security risks while keeping the implementation concise.

### Accessibility Considerations
- Buttons are real `<button>` elements, ensuring they are focusable and operable via keyboard.
- The result display uses an ARIA live region (`aria-live="polite"`) so screen readers announce updates automatically.
- Contrast ratios and focus outlines follow WCAG guidelines for readability.

---

## Contributing

Contributions are welcome! To contribute:
1. Fork the repository.
2. Create a new branch for your feature or bug‑fix.
3. Ensure your changes follow the existing code style.
4. Open a Pull Request describing the changes and why they are needed.

Please make sure any new features keep the project dependency‑free and maintain accessibility standards.

---

## License

This project is licensed under the **MIT License** (see the `LICENSE` file for details). You may also use it under the terms of the **Apache License 2.0** if you prefer.
