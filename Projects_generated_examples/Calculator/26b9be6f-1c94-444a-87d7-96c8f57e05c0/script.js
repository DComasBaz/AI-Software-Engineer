// script.js
// Calculator functionality wrapped in an IIFE. Exposes a Calculator class on the global scope.
(() => {
  const MAX_DISPLAY_LENGTH = 12;

  class Calculator {
    constructor() {
      // State variables
      this.currentInput = '';
      this.previousValue = null;
      this.operator = null;
      this.error = false;

      // DOM references
      this.display = document.getElementById('display');
      this.buttons = document.querySelectorAll('.buttons button');

      // Initialize display
      this.updateDisplay('0');

      // Bind event handlers
      this.handleButtonClick = this.handleButtonClick.bind(this);
      this.handleKeyboard = this.handleKeyboard.bind(this);

      // Attach listeners
      this.buttons.forEach(btn => btn.addEventListener('click', this.handleButtonClick));
      document.addEventListener('keydown', this.handleKeyboard);
    }

    // Utility: update the calculator display, truncating if necessary
    updateDisplay(value) {
      if (typeof value !== 'string') value = String(value);
      // Truncate to max length, but keep a leading '-' if present
      if (value.length > MAX_DISPLAY_LENGTH) {
        value = value.slice(0, MAX_DISPLAY_LENGTH);
      }
      this.display.value = value;
    }

    // Reset all state to initial condition
    clearAll() {
      this.currentInput = '';
      this.previousValue = null;
      this.operator = null;
      this.error = false;
      this.updateDisplay('0');
    }

    // Remove the last character from the current input
    backspace() {
      if (this.error) return; // ignore backspace in error state
      if (this.currentInput.length > 0) {
        this.currentInput = this.currentInput.slice(0, -1);
        this.updateDisplay(this.currentInput || '0');
      }
    }

    // Perform a binary operation; returns a number or the string 'Error'
    performOperation(a, b, op) {
      const numA = Number(a);
      const numB = Number(b);
      switch (op) {
        case '+':
          return numA + numB;
        case '-':
          return numA - numB;
        case '*':
          return numA * numB;
        case '/':
          if (numB === 0) return 'Error';
          return numA / numB;
        default:
          return numB; // no operator means just return the second operand
      }
    }

    // Process a button click event
    handleButtonClick(e) {
      const btn = e.currentTarget;
      const rawAction = btn.dataset.action; // e.g., "add", "digit", "clear"
      const value = btn.innerText.trim();

      // Map HTML specific actions to internal actions
      let action = rawAction;
      let mappedValue = value;
      if (['add', 'subtract', 'multiply', 'divide'].includes(rawAction)) {
        action = 'operator';
        const map = { add: '+', subtract: '-', multiply: '*', divide: '/' };
        mappedValue = map[rawAction];
      }

      this.processInput(action, mappedValue);
    }

    // Process a keyboard event
    handleKeyboard(e) {
      const key = e.key;
      // Map keys to actions/value similar to button dataset
      const digitKeys = /[0-9]/;
      if (digitKeys.test(key)) {
        this.processInput('digit', key);
        return;
      }
      switch (key) {
        case '.':
          this.processInput('decimal', '.');
          break;
        case '+':
        case '-':
        case '*':
        case '/':
          this.processInput('operator', key);
          break;
        case 'Enter':
        case '=':
          this.processInput('equals', '=');
          break;
        case 'Backspace':
          this.processInput('backspace', null);
          break;
        case 'Escape':
          this.processInput('clear', null);
          break;
        default:
          // ignore other keys
          break;
      }
    }

    // Central dispatcher for all inputs (button or keyboard)
    processInput(action, value) {
      if (this.error && action !== 'clear') {
        // In error state only clear can reset
        return;
      }
      switch (action) {
        case 'digit':
          this.inputDigit(value);
          break;
        case 'decimal':
          this.inputDecimal();
          break;
        case 'operator':
          this.inputOperator(value);
          break;
        case 'equals':
          this.inputEquals();
          break;
        case 'clear':
          this.clearAll();
          break;
        case 'backspace':
          this.backspace();
          break;
        default:
          // No action
          break;
      }
    }

    // Append a digit to the current input respecting leading zero rules
    inputDigit(digit) {
      if (this.currentInput === '0' && digit === '0') {
        // Prevent multiple leading zeros
        return;
      }
      if (this.currentInput === '0' && digit !== '0' && !this.currentInput.includes('.')) {
        // Replace leading zero unless we are after a decimal point
        this.currentInput = digit;
      } else {
        this.currentInput += digit;
      }
      this.updateDisplay(this.currentInput);
    }

    // Add a decimal point if not already present
    inputDecimal() {
      if (this.currentInput === '') {
        this.currentInput = '0.';
      } else if (!this.currentInput.includes('.')) {
        this.currentInput += '.';
      }
      this.updateDisplay(this.currentInput);
    }

    // Handle operator input
    inputOperator(op) {
      if (this.currentInput === '' && this.previousValue === null) {
        // No number entered yet; ignore operator
        return;
      }
      if (this.operator && this.currentInput !== '') {
        // Compute pending operation first
        const result = this.performOperation(this.previousValue, this.currentInput, this.operator);
        if (result === 'Error') {
          this.error = true;
          this.updateDisplay('Error');
          return;
        }
        this.previousValue = result;
        this.updateDisplay(String(result));
      } else if (this.currentInput !== '') {
        this.previousValue = Number(this.currentInput);
      }
      this.operator = op;
      this.currentInput = '';
    }

    // Compute the result when equals is pressed
    inputEquals() {
      if (!this.operator || this.currentInput === '' || this.previousValue === null) {
        // Nothing to compute
        return;
      }
      const result = this.performOperation(this.previousValue, this.currentInput, this.operator);
      if (result === 'Error') {
        this.error = true;
        this.updateDisplay('Error');
        return;
      }
      this.updateDisplay(String(result));
      // Reset state for next calculation
      this.currentInput = String(result);
      this.previousValue = null;
      this.operator = null;
    }
  }

  // Expose Calculator globally for potential external use
  window.Calculator = Calculator;

  // Auto‑instantiate when the script loads
  new Calculator();
})();
