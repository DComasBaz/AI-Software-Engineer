// script.js
// Simple Calculator core logic encapsulated in an IIFE.
// Exposes a `Calculator` class on the global `window` object.

(() => {
  /** Utility: check if a character is an operator */
  const isOperator = (char) => /[+\-×÷*\/]/.test(char);

  /** Utility: sanitize expression before evaluation */
  const sanitize = (expr) => {
    // Allow only digits, decimal point, parentheses, and basic operators.
    // Replace visual operators with JS equivalents before sanitizing.
    const visualReplaced = expr.replace(/×/g, '*').replace(/÷/g, '/');
    // Remove any character not part of a valid arithmetic expression.
    return visualReplaced.replace(/[^0-9+\-*/().]/g, '');
  };

  class Calculator {
    /**
     * @param {HTMLElement} displayEl - The element displaying the expression/result.
     * @param {NodeListOf<HTMLButtonElement>} buttons - All calculator buttons.
     */
    constructor(displayEl, buttons) {
      this.displayEl = displayEl;
      this.buttons = buttons;
      this.expression = '';
      this._errorTimeout = null;
      this.bindEvents();
      this.updateDisplay();
    }

    /** Attach click and keyboard listeners */
    bindEvents() {
      // Click listeners for buttons
      this.buttons.forEach((button) => {
        button.addEventListener('click', (e) => {
          const value = e.currentTarget.dataset.value;
          this.handleButton(value);
        });
      });

      // Keyboard listener
      document.addEventListener('keydown', (e) => this.handleKey(e));
    }

    /** Central dispatcher for button values */
    handleButton(value) {
      if (!value) return;
      switch (value) {
        case 'C':
          this.clear();
          break;
        case '←':
          this.backspace();
          break;
        case '=':
          this.evaluate();
          break;
        default:
          this._appendValue(value);
      }
      this.updateDisplay();
    }

    /** Translate keyboard events to calculator values */
    handleKey(event) {
      const key = event.key;
      let mapped = null;

      if (key >= '0' && key <= '9') mapped = key;
      else if (key === '.') mapped = '.';
      else if (key === '+' || key === '-') mapped = key;
      else if (key === '*' || key === 'x' || key === 'X') mapped = '*';
      else if (key === '/' ) mapped = '/';
      else if (key === 'Enter') mapped = '=';
      else if (key === 'Backspace') mapped = '←';
      else if (key === 'Escape') mapped = 'C';
      else if (key === '(') mapped = '(';
      else if (key === ')') mapped = ')';

      if (mapped) {
        event.preventDefault();
        this.handleButton(mapped);
      }
    }

    /** Append a numeric/operator/decimal to the expression with validation */
    _appendValue(value) {
      const lastChar = this.expression.slice(-1);

      // Prevent multiple decimals in the same number segment
      if (value === '.') {
        // Find the current number segment (characters after last operator)
        const segments = this.expression.split(/[*+\-\/÷×]/);
        const currentSegment = segments[segments.length - 1];
        if (currentSegment.includes('.')) return; // ignore extra decimal
        // If expression is empty or last char is an operator, prepend a leading zero
        if (this.expression === '' || isOperator(lastChar)) {
          this.expression += '0';
        }
        this.expression += '.';
        return;
      }

      // If value is an operator
      if (isOperator(value)) {
        // Disallow two operators in a row (except handling negative numbers)
        if (this.expression === '' && value !== '-') return; // cannot start with other operators
        if (isOperator(lastChar) && !(value === '-' && lastChar !== '-')) {
          // Replace the last operator with the new one (except when allowing a negative sign after another operator)
          this.expression = this.expression.slice(0, -1) + value;
          return;
        }
        this.expression += value;
        return;
      }

      // For numbers and parentheses, just append
      this.expression += value;
    }

    /** Update the calculator display */
    updateDisplay() {
      // If an error timeout is pending, keep showing the error until cleared.
      if (this._errorTimeout) return;

      const maxLength = 30; // arbitrary limit for display length
      let displayText = this.expression || '0';

      // Replace JS operators with visual ones for a nicer UI
      displayText = displayText.replace(/\*/g, '×').replace(/\//g, '÷');

      if (displayText.length > maxLength) {
        const start = displayText.length - maxLength;
        displayText = '…' + displayText.slice(start);
      }
      this.displayEl.textContent = displayText;
    }

    /** Evaluate the current expression safely */
    evaluate() {
      if (!this.expression) return;
      // Replace visual symbols with JS operators (in case they are present)
      let expr = this.expression.replace(/×/g, '*').replace(/÷/g, '/');
      // Sanitize the expression
      expr = sanitize(expr);

      try {
        // Use Function constructor for safe evaluation (no eval)
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict";return (${expr})`)();
        // Detect division by zero (result is Infinity or -Infinity)
        if (!isFinite(result)) {
          throw new Error('Division by zero');
        }
        this.expression = String(result);
        this.updateDisplay();
      } catch (e) {
        this._showError();
      }
    }

    /** Show error message briefly */
    _showError() {
      this.displayEl.textContent = 'Error';
      clearTimeout(this._errorTimeout);
      this._errorTimeout = setTimeout(() => {
        this._errorTimeout = null;
        this.clear();
      }, 1500);
    }

    /** Clear the current expression */
    clear() {
      this.expression = '';
      this.updateDisplay();
    }

    /** Remove the last character from the expression */
    backspace() {
      this.expression = this.expression.slice(0, -1);
      this.updateDisplay();
    }
  }

  // Expose the Calculator class globally
  window.Calculator = Calculator;

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    const displayEl = document.getElementById('display');
    const buttons = document.querySelectorAll('.keypad button');
    if (displayEl && buttons.length) {
      new Calculator(displayEl, buttons);
    }
  });
})();
