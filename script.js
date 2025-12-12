/**
 * Scientific Calculator Pro
 * A modern, multi-layer scientific calculator with history and theme support
 */

class ScientificCalculator {
    constructor() {
        // Display elements
        this.expressionDisplay = document.getElementById('expression');
        this.resultDisplay = document.getElementById('result');

        // State
        this.currentInput = '0';
        this.expression = '';
        this.previousInput = '';
        this.operator = null;
        this.waitingForOperand = false;
        this.lastResult = null;
        this.isRadians = true;

        // History
        this.history = [];
        this.maxHistory = 20;

        // UI Elements
        this.historyPanel = document.getElementById('historyPanel');
        this.historyList = document.getElementById('historyList');
        this.historyToggle = document.getElementById('historyToggle');
        this.clearHistoryBtn = document.getElementById('clearHistory');
        this.themeToggle = document.getElementById('themeToggle');
        this.angleToggle = document.getElementById('angleToggle');
        this.layerTabs = document.querySelectorAll('.layer-tab');
        this.layerContents = document.querySelectorAll('.layer-content');

        this.init();
    }

    init() {
        // Load saved data
        this.loadTheme();
        this.loadHistory();

        // Event listeners
        document.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('keydown', this.handleKeydown.bind(this));

        // Theme toggle
        this.themeToggle?.addEventListener('click', () => this.toggleTheme());

        // History toggle
        this.historyToggle?.addEventListener('click', () => this.toggleHistory());
        this.clearHistoryBtn?.addEventListener('click', () => this.clearHistory());

        // Angle mode toggle
        this.angleToggle?.addEventListener('click', () => this.toggleAngleMode());

        // Layer tabs
        this.layerTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchLayer(tab.dataset.layer));
        });

        // Update displays
        this.updateDisplay();
    }

    // ==================== Theme Management ====================

    loadTheme() {
        const savedTheme = localStorage.getItem('calculator-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('calculator-theme', newTheme);
    }

    // ==================== Angle Mode ====================

    toggleAngleMode() {
        this.isRadians = !this.isRadians;
        const label = this.angleToggle.querySelector('.mode-label');
        label.textContent = this.isRadians ? 'RAD' : 'DEG';
        this.angleToggle.classList.toggle('active', !this.isRadians);
    }

    // ==================== Layer Management ====================

    switchLayer(layerName) {
        this.layerTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.layer === layerName);
        });

        this.layerContents.forEach(content => {
            content.classList.toggle('active', content.id === `layer-${layerName}`);
        });
    }

    // ==================== History Management ====================

    toggleHistory() {
        this.historyPanel.classList.toggle('open');
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('calculator-history');
            if (saved) {
                this.history = JSON.parse(saved);
                this.renderHistory();
            }
        } catch (e) {
            this.history = [];
        }
    }

    saveHistory() {
        localStorage.setItem('calculator-history', JSON.stringify(this.history));
    }

    addToHistory(expression, result) {
        this.history.unshift({ expression, result, timestamp: Date.now() });
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }
        this.saveHistory();
        this.renderHistory();
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.renderHistory();
    }

    renderHistory() {
        if (!this.historyList) return;

        if (this.history.length === 0) {
            this.historyList.innerHTML = '<div class="history-empty">No calculations yet</div>';
            return;
        }

        this.historyList.innerHTML = this.history.map((item, index) => `
            <div class="history-item" data-index="${index}">
                <div class="history-expression">${this.escapeHtml(item.expression)}</div>
                <div class="history-result">= ${this.escapeHtml(item.result)}</div>
            </div>
        `).join('');

        // Add click handlers to history items
        this.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                const historyItem = this.history[index];
                if (historyItem) {
                    this.currentInput = historyItem.result;
                    this.updateDisplay();
                    this.toggleHistory();
                }
            });
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== Event Handlers ====================

    handleClick(e) {
        const btn = e.target.closest('.btn');
        if (!btn) return;

        const action = btn.dataset.action;
        const number = btn.dataset.number;

        // Add button press feedback
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = '';
        }, 100);

        if (number !== undefined) {
            this.inputNumber(number);
        } else if (action) {
            this.handleAction(action);
        }
    }

    handleKeydown(e) {
        // Don't prevent default for all keys
        const key = e.key;

        if (key >= '0' && key <= '9') {
            e.preventDefault();
            this.inputNumber(key);
        } else if (key === '.') {
            e.preventDefault();
            this.handleAction('decimal');
        } else if (key === '+') {
            e.preventDefault();
            this.handleAction('add');
        } else if (key === '-') {
            e.preventDefault();
            this.handleAction('subtract');
        } else if (key === '*') {
            e.preventDefault();
            this.handleAction('multiply');
        } else if (key === '/') {
            e.preventDefault();
            this.handleAction('divide');
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            this.handleAction('equals');
        } else if (key === 'Escape') {
            e.preventDefault();
            this.handleAction('clear');
        } else if (key === 'Backspace') {
            e.preventDefault();
            this.handleAction('backspace');
        } else if (key === '%') {
            e.preventDefault();
            this.handleAction('percent');
        } else if (key === '^') {
            e.preventDefault();
            this.handleAction('powerOf');
        }
    }

    // ==================== Input Handling ====================

    inputNumber(num) {
        if (this.waitingForOperand) {
            this.currentInput = num;
            this.waitingForOperand = false;
        } else {
            this.currentInput = this.currentInput === '0' ? num : this.currentInput + num;
        }

        // Limit input length
        if (this.currentInput.length > 15) {
            this.currentInput = this.currentInput.slice(0, 15);
        }

        this.updateDisplay();
    }

    handleAction(action) {
        const actions = {
            'add': () => this.handleOperator('+'),
            'subtract': () => this.handleOperator('-'),
            'multiply': () => this.handleOperator('*'),
            'divide': () => this.handleOperator('/'),
            'equals': () => this.calculate(),
            'decimal': () => this.inputDecimal(),
            'clear': () => this.clear(),
            'clearEntry': () => this.clearEntry(),
            'backspace': () => this.backspace(),
            'negate': () => this.negate(),
            'percent': () => this.percent(),
            'sin': () => this.sin(),
            'cos': () => this.cos(),
            'tan': () => this.tan(),
            'asin': () => this.asin(),
            'acos': () => this.acos(),
            'log': () => this.log(),
            'ln': () => this.ln(),
            'sqrt': () => this.sqrt(),
            'power': () => this.power(),
            'powerOf': () => this.powerOf(),
            'factorial': () => this.factorial(),
            'pi': () => this.pi(),
            'e': () => this.e(),
            'inverse': () => this.inverse(),
        };

        if (actions[action]) {
            actions[action]();
        }
    }

    // ==================== Operators ====================

    handleOperator(nextOperator) {
        const inputValue = parseFloat(this.currentInput);

        if (this.previousInput === '') {
            this.previousInput = inputValue;
        } else if (this.operator && !this.waitingForOperand) {
            const currentValue = this.previousInput || 0;
            const newValue = this.performCalculation(currentValue, inputValue, this.operator);

            if (newValue === 'Error') {
                this.currentInput = 'Error';
                this.previousInput = '';
                this.operator = null;
                this.updateDisplay();
                return;
            }

            this.currentInput = this.formatNumber(newValue);
            this.previousInput = newValue;
        }

        this.waitingForOperand = true;
        this.operator = nextOperator;
        this.updateExpressionDisplay();

        // Highlight active operator button
        this.highlightOperator(nextOperator);
    }

    highlightOperator(op) {
        document.querySelectorAll('.btn.op').forEach(btn => {
            btn.classList.remove('active');
        });

        const opMap = { '+': 'add', '-': 'subtract', '*': 'multiply', '/': 'divide' };
        const actionName = opMap[op];
        if (actionName) {
            const btn = document.querySelector(`[data-action="${actionName}"]`);
            if (btn) btn.classList.add('active');
        }
    }

    calculate() {
        if (this.operator && this.previousInput !== '' && !this.waitingForOperand) {
            const inputValue = parseFloat(this.currentInput);
            const currentValue = this.previousInput || 0;
            const newValue = this.performCalculation(currentValue, inputValue, this.operator);

            // Build expression for history
            const opSymbol = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^' };
            const expr = `${this.formatNumber(currentValue)} ${opSymbol[this.operator] || this.operator} ${this.formatNumber(inputValue)}`;

            if (newValue === 'Error') {
                this.currentInput = 'Error';
            } else {
                this.currentInput = this.formatNumber(newValue);
                this.lastResult = newValue;
                this.addToHistory(expr, this.currentInput);
            }

            this.previousInput = '';
            this.operator = null;
            this.waitingForOperand = false;
            this.expression = '';

            this.updateDisplay();
            this.clearExpressionDisplay();

            // Remove operator highlights
            document.querySelectorAll('.btn.op').forEach(btn => {
                btn.classList.remove('active');
            });
        }
    }

    performCalculation(firstOperand, secondOperand, operator) {
        switch (operator) {
            case '+':
                return firstOperand + secondOperand;
            case '-':
                return firstOperand - secondOperand;
            case '*':
                return firstOperand * secondOperand;
            case '/':
                return secondOperand !== 0 ? firstOperand / secondOperand : 'Error';
            case '^':
                return Math.pow(firstOperand, secondOperand);
            default:
                return secondOperand;
        }
    }

    // ==================== Basic Operations ====================

    inputDecimal() {
        if (this.waitingForOperand) {
            this.currentInput = '0.';
            this.waitingForOperand = false;
        } else if (!this.currentInput.includes('.')) {
            this.currentInput += '.';
        }

        this.updateDisplay();
    }

    clear() {
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = null;
        this.waitingForOperand = false;
        this.expression = '';

        this.updateDisplay();
        this.clearExpressionDisplay();

        document.querySelectorAll('.btn.op').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    clearEntry() {
        this.currentInput = '0';
        this.updateDisplay();
    }

    backspace() {
        if (this.currentInput === 'Error') {
            this.currentInput = '0';
        } else if (this.currentInput.length > 1) {
            this.currentInput = this.currentInput.slice(0, -1);
        } else {
            this.currentInput = '0';
        }
        this.updateDisplay();
    }

    negate() {
        if (this.currentInput !== '0' && this.currentInput !== 'Error') {
            if (this.currentInput.startsWith('-')) {
                this.currentInput = this.currentInput.slice(1);
            } else {
                this.currentInput = '-' + this.currentInput;
            }
        }
        this.updateDisplay();
    }

    percent() {
        const value = parseFloat(this.currentInput);
        if (!isNaN(value)) {
            this.currentInput = this.formatNumber(value / 100);
            this.updateDisplay();
        }
    }

    // ==================== Scientific Functions ====================

    sin() {
        const value = parseFloat(this.currentInput);
        const angle = this.isRadians ? value : this.toRadians(value);
        const result = Math.sin(angle);
        this.setScientificResult('sin', value, result);
    }

    cos() {
        const value = parseFloat(this.currentInput);
        const angle = this.isRadians ? value : this.toRadians(value);
        const result = Math.cos(angle);
        this.setScientificResult('cos', value, result);
    }

    tan() {
        const value = parseFloat(this.currentInput);
        const angle = this.isRadians ? value : this.toRadians(value);
        const result = Math.tan(angle);
        this.setScientificResult('tan', value, result);
    }

    asin() {
        const value = parseFloat(this.currentInput);
        if (value < -1 || value > 1) {
            this.currentInput = 'Error';
        } else {
            let result = Math.asin(value);
            if (!this.isRadians) result = this.toDegrees(result);
            this.setScientificResult('sin⁻¹', value, result);
        }
        this.updateDisplay();
    }

    acos() {
        const value = parseFloat(this.currentInput);
        if (value < -1 || value > 1) {
            this.currentInput = 'Error';
        } else {
            let result = Math.acos(value);
            if (!this.isRadians) result = this.toDegrees(result);
            this.setScientificResult('cos⁻¹', value, result);
        }
        this.updateDisplay();
    }

    log() {
        const value = parseFloat(this.currentInput);
        if (value > 0) {
            const result = Math.log10(value);
            this.setScientificResult('log', value, result);
        } else {
            this.currentInput = 'Error';
            this.updateDisplay();
        }
    }

    ln() {
        const value = parseFloat(this.currentInput);
        if (value > 0) {
            const result = Math.log(value);
            this.setScientificResult('ln', value, result);
        } else {
            this.currentInput = 'Error';
            this.updateDisplay();
        }
    }

    sqrt() {
        const value = parseFloat(this.currentInput);
        if (value >= 0) {
            const result = Math.sqrt(value);
            this.setScientificResult('√', value, result);
        } else {
            this.currentInput = 'Error';
            this.updateDisplay();
        }
    }

    power() {
        const value = parseFloat(this.currentInput);
        const result = Math.pow(value, 2);
        this.setScientificResult('sqr', value, result);
    }

    powerOf() {
        this.handleOperator('^');
    }

    factorial() {
        const value = parseInt(this.currentInput);
        if (value >= 0 && value <= 170 && Number.isInteger(parseFloat(this.currentInput))) {
            let result = 1;
            for (let i = 2; i <= value; i++) {
                result *= i;
            }
            this.setScientificResult('fact', value, result);
        } else {
            this.currentInput = 'Error';
            this.updateDisplay();
        }
    }

    pi() {
        this.currentInput = this.formatNumber(Math.PI);
        this.updateDisplay();
    }

    e() {
        this.currentInput = this.formatNumber(Math.E);
        this.updateDisplay();
    }

    inverse() {
        const value = parseFloat(this.currentInput);
        if (value !== 0) {
            const result = 1 / value;
            this.setScientificResult('1/', value, result);
        } else {
            this.currentInput = 'Error';
            this.updateDisplay();
        }
    }

    setScientificResult(funcName, input, result) {
        const expr = `${funcName}(${this.formatNumber(input)})`;
        this.currentInput = this.formatNumber(result);
        this.addToHistory(expr, this.currentInput);
        this.updateDisplay();
    }

    // ==================== Utility Functions ====================

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    toDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    formatNumber(num) {
        if (typeof num === 'string') return num;
        if (!isFinite(num)) return 'Error';

        // Handle very small numbers close to zero
        if (Math.abs(num) < 1e-10 && num !== 0) {
            return num.toExponential(6);
        }

        // Handle very large numbers
        if (Math.abs(num) >= 1e12) {
            return num.toExponential(6);
        }

        // Round to avoid floating point issues
        const rounded = Math.round(num * 1e10) / 1e10;

        // Convert to string and limit decimal places
        let str = rounded.toString();

        // Limit total length
        if (str.length > 12) {
            if (str.includes('.')) {
                const [intPart, decPart] = str.split('.');
                const maxDecimals = Math.max(0, 11 - intPart.length);
                str = rounded.toFixed(maxDecimals);
            } else {
                str = rounded.toExponential(6);
            }
        }

        return str;
    }

    // ==================== Display Updates ====================

    updateDisplay() {
        if (!this.resultDisplay) return;

        let displayValue = this.currentInput;

        // Add thousand separators for display (but not for scientific notation)
        if (!displayValue.includes('e') && displayValue !== 'Error') {
            const parts = displayValue.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            displayValue = parts.join('.');
        }

        this.resultDisplay.textContent = displayValue;

        // Adjust font size for long numbers
        if (displayValue.length > 10) {
            this.resultDisplay.classList.add('small');
        } else {
            this.resultDisplay.classList.remove('small');
        }
    }

    updateExpressionDisplay() {
        if (!this.expressionDisplay) return;

        if (this.operator && this.previousInput !== '') {
            const opSymbol = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^' };
            this.expressionDisplay.textContent = `${this.formatNumber(this.previousInput)} ${opSymbol[this.operator] || this.operator}`;
        }
    }

    clearExpressionDisplay() {
        if (this.expressionDisplay) {
            this.expressionDisplay.textContent = '';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.calculator = new ScientificCalculator();
});
