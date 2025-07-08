class ScientificCalculator {
    constructor() {
        this.primaryDisplay = document.getElementById('primaryDisplay');
        this.secondaryDisplay = document.getElementById('secondaryDisplay');
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = null;
        this.waitingForOperand = false;
        this.memory = 0;
        this.isRadians = true;
        this.lastResult = null;
        this.parenthesesCount = 0;
        
        this.init();
    }
    
    init() {
        document.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        this.updateDisplay();
    }
    
    handleClick(e) {
        if (!e.target.classList.contains('btn')) return;
        
        const action = e.target.dataset.action;
        const number = e.target.dataset.number;
        
        if (number !== undefined) {
            this.inputNumber(number);
        } else if (action) {
            this.handleAction(action);
        }
    }
    
    handleKeydown(e) {
        e.preventDefault();
        
        const key = e.key;
        
        if (key >= '0' && key <= '9') {
            this.inputNumber(key);
        } else if (key === '.') {
            this.handleAction('decimal');
        } else if (key === '+') {
            this.handleAction('add');
        } else if (key === '-') {
            this.handleAction('subtract');
        } else if (key === '*') {
            this.handleAction('multiply');
        } else if (key === '/') {
            this.handleAction('divide');
        } else if (key === 'Enter' || key === '=') {
            this.handleAction('equals');
        } else if (key === 'Escape') {
            this.handleAction('clear');
        } else if (key === 'Backspace') {
            this.handleAction('backspace');
        } else if (key === '%') {
            this.handleAction('percent');
        } else if (key === '(' || key === ')') {
            this.handleAction('parenthesis');
        }
    }
    
    inputNumber(num) {
        if (this.waitingForOperand) {
            this.currentInput = num;
            this.waitingForOperand = false;
        } else {
            this.currentInput = this.currentInput === '0' ? num : this.currentInput + num;
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
            'log': () => this.log(),
            'ln': () => this.ln(),
            'sqrt': () => this.sqrt(),
            'power': () => this.power(),
            'powerOf': () => this.powerOf(),
            'factorial': () => this.factorial(),
            'pi': () => this.pi(),
            'e': () => this.e(),
            'inverse': () => this.inverse(),
            'abs': () => this.abs(),
            'parenthesis': () => this.parenthesis()
        };
        
        if (actions[action]) {
            actions[action]();
        }
    }
    
    handleOperator(nextOperator) {
        const inputValue = parseFloat(this.currentInput);
        
        if (this.previousInput === '') {
            this.previousInput = inputValue;
        } else if (this.operator) {
            const currentValue = this.previousInput || 0;
            const newValue = this.performCalculation(currentValue, inputValue, this.operator);
            
            this.currentInput = String(newValue);
            this.previousInput = newValue;
            this.updateDisplay();
        }
        
        this.waitingForOperand = true;
        this.operator = nextOperator;
        this.updateSecondaryDisplay();
    }
    
    calculate() {
        if (this.operator && this.previousInput !== '' && !this.waitingForOperand) {
            const inputValue = parseFloat(this.currentInput);
            const currentValue = this.previousInput || 0;
            const newValue = this.performCalculation(currentValue, inputValue, this.operator);
            
            this.currentInput = String(newValue);
            this.previousInput = '';
            this.operator = null;
            this.waitingForOperand = false;
            this.lastResult = newValue;
            this.updateDisplay();
            this.clearSecondaryDisplay();
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
                return secondOperand !== 0 ? firstOperand / secondOperand : 0;
            case '^':
                return Math.pow(firstOperand, secondOperand);
            default:
                return secondOperand;
        }
    }
    
    inputDecimal() {
        if (this.waitingForOperand) {
            this.currentInput = '0.';
            this.waitingForOperand = false;
        } else if (this.currentInput.indexOf('.') === -1) {
            this.currentInput += '.';
        }
        
        this.updateDisplay();
    }
    
    clear() {
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = null;
        this.waitingForOperand = false;
        this.parenthesesCount = 0;
        this.updateDisplay();
        this.clearSecondaryDisplay();
    }
    
    clearEntry() {
        this.currentInput = '0';
        this.updateDisplay();
    }
    
    backspace() {
        if (this.currentInput.length > 1) {
            this.currentInput = this.currentInput.slice(0, -1);
        } else {
            this.currentInput = '0';
        }
        this.updateDisplay();
    }
    
    negate() {
        if (this.currentInput !== '0') {
            this.currentInput = this.currentInput.startsWith('-') 
                ? this.currentInput.slice(1) 
                : '-' + this.currentInput;
        }
        this.updateDisplay();
    }
    
    percent() {
        const value = parseFloat(this.currentInput);
        this.currentInput = String(value / 100);
        this.updateDisplay();
    }
    
    // Scientific functions
    sin() {
        const value = parseFloat(this.currentInput);
        const result = this.isRadians ? Math.sin(value) : Math.sin(value * Math.PI / 180);
        this.currentInput = String(result);
        this.updateDisplay();
    }
    
    cos() {
        const value = parseFloat(this.currentInput);
        const result = this.isRadians ? Math.cos(value) : Math.cos(value * Math.PI / 180);
        this.currentInput = String(result);
        this.updateDisplay();
    }
    
    tan() {
        const value = parseFloat(this.currentInput);
        const result = this.isRadians ? Math.tan(value) : Math.tan(value * Math.PI / 180);
        this.currentInput = String(result);
        this.updateDisplay();
    }
    
    log() {
        const value = parseFloat(this.currentInput);
        if (value > 0) {
            this.currentInput = String(Math.log10(value));
        } else {
            this.currentInput = 'Error';
        }
        this.updateDisplay();
    }
    
    ln() {
        const value = parseFloat(this.currentInput);
        if (value > 0) {
            this.currentInput = String(Math.log(value));
        } else {
            this.currentInput = 'Error';
        }
        this.updateDisplay();
    }
    
    sqrt() {
        const value = parseFloat(this.currentInput);
        if (value >= 0) {
            this.currentInput = String(Math.sqrt(value));
        } else {
            this.currentInput = 'Error';
        }
        this.updateDisplay();
    }
    
    power() {
        const value = parseFloat(this.currentInput);
        this.currentInput = String(Math.pow(value, 2));
        this.updateDisplay();
    }
    
    powerOf() {
        this.handleOperator('^');
    }
    
    factorial() {
        const value = parseInt(this.currentInput);
        if (value >= 0 && value <= 170) {
            let result = 1;
            for (let i = 2; i <= value; i++) {
                result *= i;
            }
            this.currentInput = String(result);
        } else {
            this.currentInput = 'Error';
        }
        this.updateDisplay();
    }
    
    pi() {
        this.currentInput = String(Math.PI);
        this.updateDisplay();
    }
    
    e() {
        this.currentInput = String(Math.E);
        this.updateDisplay();
    }
    
    inverse() {
        const value = parseFloat(this.currentInput);
        if (value !== 0) {
            this.currentInput = String(1 / value);
        } else {
            this.currentInput = 'Error';
        }
        this.updateDisplay();
    }
    
    abs() {
        const value = parseFloat(this.currentInput);
        this.currentInput = String(Math.abs(value));
        this.updateDisplay();
    }
    
    parenthesis() {
        // Simple parenthesis handling - toggles between ( and )
        if (this.parenthesesCount === 0) {
            this.currentInput = '(';
            this.parenthesesCount++;
        } else {
            this.currentInput = ')';
            this.parenthesesCount--;
        }
        this.updateDisplay();
    }
    
    updateDisplay() {
        // Format the display value
        let displayValue = this.currentInput;
        
        // Handle very long numbers
        if (displayValue.length > 12) {
            const num = parseFloat(displayValue);
            if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-6 && num !== 0)) {
                displayValue = num.toExponential(6);
            } else {
                displayValue = num.toPrecision(12);
            }
        }
        
        this.primaryDisplay.textContent = displayValue;
    }
    
    updateSecondaryDisplay() {
        if (this.operator && this.previousInput !== '') {
            const operatorSymbol = {
                '+': '+',
                '-': '−',
                '*': '×',
                '/': '÷',
                '^': '^'
            };
            
            this.secondaryDisplay.textContent = `${this.previousInput} ${operatorSymbol[this.operator] || this.operator}`;
        }
    }
    
    clearSecondaryDisplay() {
        this.secondaryDisplay.textContent = '';
    }
}

// Initialize the calculator when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ScientificCalculator();
});