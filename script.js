/**
 * Advanced Scientific Calculator
 * Features: Multi-mode calculator, equation solver, statistics, unit conversions
 */

class AdvancedCalculator {
    constructor() {
        // Calculator state
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = null;
        this.waitingForOperand = false;
        this.secondOperand = false; // For two-argument functions
        this.pendingFunction = null;
        this.isRadians = true;
        this.history = [];
        this.maxHistory = 30;

        // DOM Elements
        this.expressionDisplay = document.getElementById('expression');
        this.resultDisplay = document.getElementById('result');
        this.historyPanel = document.getElementById('historyPanel');
        this.historyList = document.getElementById('historyList');

        this.init();
    }

    init() {
        this.loadTheme();
        this.loadHistory();
        this.setupEventListeners();
        this.setupModeNavigation();
        this.setupEquationSolver();
        this.setupStatistics();
        this.setupConverters();
        this.updateDisplay();
    }

    // ==================== Event Listeners ====================
    setupEventListeners() {
        // Calculator buttons
        document.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('keydown', this.handleKeydown.bind(this));

        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => this.toggleTheme());

        // History toggle
        document.getElementById('historyToggle')?.addEventListener('click', () => this.toggleHistory());
        document.getElementById('clearHistory')?.addEventListener('click', () => this.clearHistory());

        // Angle mode toggle
        document.getElementById('angleToggle')?.addEventListener('click', () => this.toggleAngleMode());

        // Layer tabs
        document.querySelectorAll('.layer-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchLayer(tab.dataset.layer));
        });
    }

    setupModeNavigation() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`mode-${btn.dataset.mode}`)?.classList.add('active');
            });
        });
    }

    // ==================== Theme ====================
    loadTheme() {
        const theme = localStorage.getItem('calc-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('calc-theme', next);
    }

    // ==================== Angle Mode ====================
    toggleAngleMode() {
        this.isRadians = !this.isRadians;
        const toggle = document.getElementById('angleToggle');
        toggle.querySelector('.mode-label').textContent = this.isRadians ? 'RAD' : 'DEG';
        toggle.classList.toggle('active', !this.isRadians);
    }

    // ==================== Layer Switching ====================
    switchLayer(layer) {
        document.querySelectorAll('.layer-tab').forEach(t => t.classList.toggle('active', t.dataset.layer === layer));
        document.querySelectorAll('.layer-content').forEach(c => c.classList.toggle('active', c.id === `layer-${layer}`));
    }

    // ==================== History ====================
    toggleHistory() {
        this.historyPanel?.classList.toggle('open');
    }

    loadHistory() {
        try {
            this.history = JSON.parse(localStorage.getItem('calc-history') || '[]');
            this.renderHistory();
        } catch { this.history = []; }
    }

    saveHistory() {
        localStorage.setItem('calc-history', JSON.stringify(this.history));
    }

    addToHistory(expr, result) {
        this.history.unshift({ expr, result, time: Date.now() });
        if (this.history.length > this.maxHistory) this.history.pop();
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
        this.historyList.innerHTML = this.history.map((item, i) => `
            <div class="history-item" data-index="${i}">
                <div class="history-expression">${this.escapeHtml(item.expr)}</div>
                <div class="history-result">= ${this.escapeHtml(item.result)}</div>
            </div>
        `).join('');

        this.historyList.querySelectorAll('.history-item').forEach(el => {
            el.addEventListener('click', () => {
                const item = this.history[parseInt(el.dataset.index)];
                if (item) {
                    this.currentInput = item.result.replace(/,/g, '');
                    this.updateDisplay();
                    this.toggleHistory();
                }
            });
        });
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ==================== Input Handling ====================
    handleClick(e) {
        const btn = e.target.closest('.btn');
        if (!btn) return;

        const action = btn.dataset.action;
        const number = btn.dataset.number;

        if (number !== undefined) this.inputNumber(number);
        else if (action) this.handleAction(action);
    }

    handleKeydown(e) {
        const key = e.key;
        if (/^[0-9]$/.test(key)) { e.preventDefault(); this.inputNumber(key); }
        else if (key === '.') { e.preventDefault(); this.handleAction('decimal'); }
        else if (key === '+') { e.preventDefault(); this.handleAction('add'); }
        else if (key === '-') { e.preventDefault(); this.handleAction('subtract'); }
        else if (key === '*') { e.preventDefault(); this.handleAction('multiply'); }
        else if (key === '/') { e.preventDefault(); this.handleAction('divide'); }
        else if (key === 'Enter' || key === '=') { e.preventDefault(); this.handleAction('equals'); }
        else if (key === 'Escape') { e.preventDefault(); this.handleAction('clear'); }
        else if (key === 'Backspace') { e.preventDefault(); this.handleAction('backspace'); }
        else if (key === '%') { e.preventDefault(); this.handleAction('percent'); }
        else if (key === '^') { e.preventDefault(); this.handleAction('powerOf'); }
    }

    inputNumber(num) {
        if (this.waitingForOperand) {
            this.currentInput = num;
            this.waitingForOperand = false;
        } else {
            this.currentInput = this.currentInput === '0' ? num : this.currentInput + num;
        }
        if (this.currentInput.length > 16) this.currentInput = this.currentInput.slice(0, 16);
        this.updateDisplay();
    }

    handleAction(action) {
        const actions = {
            // Basic operators
            add: () => this.handleOperator('+'),
            subtract: () => this.handleOperator('-'),
            multiply: () => this.handleOperator('*'),
            divide: () => this.handleOperator('/'),
            equals: () => this.calculate(),
            decimal: () => this.inputDecimal(),
            clear: () => this.clear(),
            clearEntry: () => this.clearEntry(),
            backspace: () => this.backspace(),
            negate: () => this.negate(),
            percent: () => this.applyFunction(x => x / 100, '%'),

            // Basic functions
            sqrt: () => this.applyFunction(Math.sqrt, '√'),
            cbrt: () => this.applyFunction(Math.cbrt, '³√'),
            power: () => this.applyFunction(x => x * x, 'sqr'),
            cube: () => this.applyFunction(x => x * x * x, 'cube'),
            powerOf: () => this.handleOperator('^'),
            nthroot: () => this.handleOperator('nthroot'),
            exp10: () => this.applyFunction(x => Math.pow(10, x), '10^'),
            inverse: () => this.applyFunction(x => x !== 0 ? 1 / x : NaN, '1/'),
            abs: () => this.applyFunction(Math.abs, 'abs'),

            // Trigonometry
            sin: () => this.applyTrig(Math.sin, 'sin'),
            cos: () => this.applyTrig(Math.cos, 'cos'),
            tan: () => this.applyTrig(Math.tan, 'tan'),
            csc: () => this.applyTrig(x => 1 / Math.sin(x), 'csc'),
            sec: () => this.applyTrig(x => 1 / Math.cos(x), 'sec'),
            cot: () => this.applyTrig(x => 1 / Math.tan(x), 'cot'),
            asin: () => this.applyInverseTrig(Math.asin, 'asin'),
            acos: () => this.applyInverseTrig(Math.acos, 'acos'),
            atan: () => this.applyInverseTrig(Math.atan, 'atan'),
            atan2: () => this.handleOperator('atan2'),

            // Hyperbolic
            sinh: () => this.applyFunction(Math.sinh, 'sinh'),
            cosh: () => this.applyFunction(Math.cosh, 'cosh'),
            tanh: () => this.applyFunction(Math.tanh, 'tanh'),
            csch: () => this.applyFunction(x => 1 / Math.sinh(x), 'csch'),
            sech: () => this.applyFunction(x => 1 / Math.cosh(x), 'sech'),
            coth: () => this.applyFunction(x => 1 / Math.tanh(x), 'coth'),
            asinh: () => this.applyFunction(Math.asinh, 'asinh'),
            acosh: () => this.applyFunction(Math.acosh, 'acosh'),
            atanh: () => this.applyFunction(Math.atanh, 'atanh'),
            exp: () => this.applyFunction(Math.exp, 'e^'),

            // Logarithms
            log: () => this.applyFunction(Math.log10, 'log'),
            ln: () => this.applyFunction(Math.log, 'ln'),
            log2: () => this.applyFunction(Math.log2, 'log₂'),
            logbase: () => this.handleOperator('logbase'),

            // Combinatorics
            factorial: () => this.applyFunction(this.factorial.bind(this), 'fact'),
            nPr: () => this.handleOperator('nPr'),
            nCr: () => this.handleOperator('nCr'),
            gcd: () => this.handleOperator('gcd'),
            lcm: () => this.handleOperator('lcm'),
            mod: () => this.handleOperator('mod'),

            // Constants
            pi: () => { this.currentInput = String(Math.PI); this.updateDisplay(); },
            e: () => { this.currentInput = String(Math.E); this.updateDisplay(); },
            phi: () => { this.currentInput = String((1 + Math.sqrt(5)) / 2); this.updateDisplay(); },
            sqrt2: () => { this.currentInput = String(Math.SQRT2); this.updateDisplay(); },
            sqrt3: () => { this.currentInput = String(Math.sqrt(3)); this.updateDisplay(); },
            ln2: () => { this.currentInput = String(Math.LN2); this.updateDisplay(); },
            ln10: () => { this.currentInput = String(Math.LN10); this.updateDisplay(); },
            c: () => { this.currentInput = '299792458'; this.updateDisplay(); }, // Speed of light
            g: () => { this.currentInput = '9.80665'; this.updateDisplay(); }, // Gravity
            rand: () => { this.currentInput = String(Math.random()); this.updateDisplay(); },
        };

        if (actions[action]) actions[action]();
    }

    // ==================== Operations ====================
    handleOperator(op) {
        const value = parseFloat(this.currentInput);

        if (this.previousInput === '') {
            this.previousInput = value;
        } else if (this.operator && !this.waitingForOperand) {
            const result = this.performCalculation(this.previousInput, value, this.operator);
            if (!isFinite(result)) {
                this.currentInput = 'Error';
                this.previousInput = '';
                this.operator = null;
                this.updateDisplay();
                return;
            }
            this.currentInput = this.formatNumber(result);
            this.previousInput = result;
        }

        this.waitingForOperand = true;
        this.operator = op;
        this.updateExpressionDisplay();
        this.highlightOperator(op);
    }

    calculate() {
        if (!this.operator || this.previousInput === '' || this.waitingForOperand) return;

        const value = parseFloat(this.currentInput);
        const result = this.performCalculation(this.previousInput, value, this.operator);

        const opSymbols = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^',
            mod: 'mod', gcd: 'gcd', lcm: 'lcm', nPr: 'P', nCr: 'C',
            nthroot: '√', logbase: 'log', atan2: 'atan2' };
        const expr = `${this.formatNumber(this.previousInput)} ${opSymbols[this.operator] || this.operator} ${this.formatNumber(value)}`;

        if (!isFinite(result)) {
            this.currentInput = 'Error';
        } else {
            this.currentInput = this.formatNumber(result);
            this.addToHistory(expr, this.currentInput);
        }

        this.previousInput = '';
        this.operator = null;
        this.waitingForOperand = false;
        this.updateDisplay();
        this.clearExpressionDisplay();
        document.querySelectorAll('.btn.op').forEach(b => b.classList.remove('active'));
    }

    performCalculation(a, b, op) {
        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return b !== 0 ? a / b : NaN;
            case '^': return Math.pow(a, b);
            case 'mod': return a % b;
            case 'gcd': return this.gcd(Math.abs(Math.round(a)), Math.abs(Math.round(b)));
            case 'lcm': return this.lcm(Math.abs(Math.round(a)), Math.abs(Math.round(b)));
            case 'nPr': return this.permutation(Math.round(a), Math.round(b));
            case 'nCr': return this.combination(Math.round(a), Math.round(b));
            case 'nthroot': return Math.pow(a, 1 / b);
            case 'logbase': return Math.log(a) / Math.log(b);
            case 'atan2': return this.isRadians ? Math.atan2(a, b) : this.toDegrees(Math.atan2(a, b));
            default: return b;
        }
    }

    highlightOperator(op) {
        document.querySelectorAll('.btn.op').forEach(b => b.classList.remove('active'));
        const opMap = { '+': 'add', '-': 'subtract', '*': 'multiply', '/': 'divide' };
        if (opMap[op]) {
            document.querySelector(`[data-action="${opMap[op]}"]`)?.classList.add('active');
        }
    }

    // ==================== Basic Functions ====================
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
        this.updateDisplay();
        this.clearExpressionDisplay();
        document.querySelectorAll('.btn.op').forEach(b => b.classList.remove('active'));
    }

    clearEntry() {
        this.currentInput = '0';
        this.updateDisplay();
    }

    backspace() {
        if (this.currentInput === 'Error') this.currentInput = '0';
        else if (this.currentInput.length > 1) this.currentInput = this.currentInput.slice(0, -1);
        else this.currentInput = '0';
        this.updateDisplay();
    }

    negate() {
        if (this.currentInput !== '0' && this.currentInput !== 'Error') {
            this.currentInput = this.currentInput.startsWith('-')
                ? this.currentInput.slice(1)
                : '-' + this.currentInput;
        }
        this.updateDisplay();
    }

    // ==================== Scientific Functions ====================
    applyFunction(fn, name) {
        const value = parseFloat(this.currentInput);
        const result = fn(value);
        if (!isFinite(result)) {
            this.currentInput = 'Error';
        } else {
            this.currentInput = this.formatNumber(result);
            this.addToHistory(`${name}(${this.formatNumber(value)})`, this.currentInput);
        }
        this.updateDisplay();
    }

    applyTrig(fn, name) {
        const value = parseFloat(this.currentInput);
        const angle = this.isRadians ? value : this.toRadians(value);
        const result = fn(angle);
        if (!isFinite(result)) {
            this.currentInput = 'Error';
        } else {
            this.currentInput = this.formatNumber(result);
            this.addToHistory(`${name}(${this.formatNumber(value)})`, this.currentInput);
        }
        this.updateDisplay();
    }

    applyInverseTrig(fn, name) {
        const value = parseFloat(this.currentInput);
        let result = fn(value);
        if (!isFinite(result)) {
            this.currentInput = 'Error';
        } else {
            if (!this.isRadians) result = this.toDegrees(result);
            this.currentInput = this.formatNumber(result);
            this.addToHistory(`${name}(${this.formatNumber(value)})`, this.currentInput);
        }
        this.updateDisplay();
    }

    toRadians(deg) { return deg * Math.PI / 180; }
    toDegrees(rad) { return rad * 180 / Math.PI; }

    factorial(n) {
        n = Math.round(n);
        if (n < 0 || n > 170) return NaN;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
    }

    gcd(a, b) { return b === 0 ? a : this.gcd(b, a % b); }
    lcm(a, b) { return (a * b) / this.gcd(a, b); }

    permutation(n, r) {
        if (r > n || n < 0 || r < 0) return NaN;
        return this.factorial(n) / this.factorial(n - r);
    }

    combination(n, r) {
        if (r > n || n < 0 || r < 0) return NaN;
        return this.factorial(n) / (this.factorial(r) * this.factorial(n - r));
    }

    // ==================== Display ====================
    formatNumber(num) {
        if (typeof num === 'string') return num;
        if (!isFinite(num)) return 'Error';
        if (Math.abs(num) < 1e-10 && num !== 0) return num.toExponential(6);
        if (Math.abs(num) >= 1e12) return num.toExponential(6);

        const rounded = Math.round(num * 1e10) / 1e10;
        let str = rounded.toString();

        if (str.length > 14 && !str.includes('e')) {
            str = rounded.toPrecision(10);
        }
        return str;
    }

    updateDisplay() {
        if (!this.resultDisplay) return;
        let display = this.currentInput;
        if (!display.includes('e') && display !== 'Error') {
            const [int, dec] = display.split('.');
            display = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (dec !== undefined ? '.' + dec : '');
        }
        this.resultDisplay.textContent = display;
        this.resultDisplay.classList.toggle('small', display.length > 12);
    }

    updateExpressionDisplay() {
        if (!this.expressionDisplay || !this.operator) return;
        const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^',
            mod: 'mod', gcd: 'gcd', lcm: 'lcm', nPr: 'P', nCr: 'C',
            nthroot: '√', logbase: 'log', atan2: 'atan2' };
        this.expressionDisplay.textContent = `${this.formatNumber(this.previousInput)} ${symbols[this.operator] || this.operator}`;
    }

    clearExpressionDisplay() {
        if (this.expressionDisplay) this.expressionDisplay.textContent = '';
    }

    // ==================== Equation Solver ====================
    setupEquationSolver() {
        // Tab switching
        document.querySelectorAll('.eq-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.eq-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.equation-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`eq-${tab.dataset.eq}`)?.classList.add('active');
            });
        });

        // Solve buttons
        document.getElementById('solve-linear')?.addEventListener('click', () => this.solveLinear());
        document.getElementById('solve-quadratic')?.addEventListener('click', () => this.solveQuadratic());
        document.getElementById('solve-cubic')?.addEventListener('click', () => this.solveCubic());
        document.getElementById('solve-system2')?.addEventListener('click', () => this.solveSystem2());
    }

    solveLinear() {
        const a = parseFloat(document.getElementById('lin-a')?.value) || 0;
        const b = parseFloat(document.getElementById('lin-b')?.value) || 0;
        const result = document.getElementById('result-linear');

        if (a === 0) {
            result.innerHTML = b === 0
                ? '<span class="solution">Infinite solutions (0 = 0)</span>'
                : '<span class="error">No solution (contradiction)</span>';
        } else {
            const x = -b / a;
            result.innerHTML = `<span class="solution">x = ${this.formatNumber(x)}</span>`;
        }
    }

    solveQuadratic() {
        const a = parseFloat(document.getElementById('quad-a')?.value) || 0;
        const b = parseFloat(document.getElementById('quad-b')?.value) || 0;
        const c = parseFloat(document.getElementById('quad-c')?.value) || 0;
        const result = document.getElementById('result-quadratic');

        if (a === 0) {
            if (b === 0) {
                result.innerHTML = c === 0
                    ? '<span class="solution">Infinite solutions</span>'
                    : '<span class="error">No solution</span>';
            } else {
                result.innerHTML = `<span class="solution">x = ${this.formatNumber(-c / b)}</span>`;
            }
            return;
        }

        const discriminant = b * b - 4 * a * c;

        if (discriminant > 0) {
            const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
            const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
            result.innerHTML = `
                <span class="solution">x₁ = ${this.formatNumber(x1)}</span>
                <span class="solution">x₂ = ${this.formatNumber(x2)}</span>
                <span style="color: var(--text-muted)">Δ = ${this.formatNumber(discriminant)}</span>
            `;
        } else if (discriminant === 0) {
            const x = -b / (2 * a);
            result.innerHTML = `
                <span class="solution">x = ${this.formatNumber(x)} (double root)</span>
                <span style="color: var(--text-muted)">Δ = 0</span>
            `;
        } else {
            const real = -b / (2 * a);
            const imag = Math.sqrt(-discriminant) / (2 * a);
            result.innerHTML = `
                <span class="complex">x₁ = ${this.formatNumber(real)} + ${this.formatNumber(imag)}i</span>
                <span class="complex">x₂ = ${this.formatNumber(real)} - ${this.formatNumber(imag)}i</span>
                <span style="color: var(--text-muted)">Δ = ${this.formatNumber(discriminant)} (complex roots)</span>
            `;
        }
    }

    solveCubic() {
        let a = parseFloat(document.getElementById('cub-a')?.value) || 0;
        let b = parseFloat(document.getElementById('cub-b')?.value) || 0;
        let c = parseFloat(document.getElementById('cub-c')?.value) || 0;
        let d = parseFloat(document.getElementById('cub-d')?.value) || 0;
        const result = document.getElementById('result-cubic');

        if (a === 0) {
            result.innerHTML = '<span class="error">Not a cubic equation (a = 0)</span>';
            return;
        }

        // Normalize: x³ + px² + qx + r = 0
        b /= a; c /= a; d /= a;

        const p = (3 * c - b * b) / 3;
        const q = (2 * b * b * b - 9 * b * c + 27 * d) / 27;
        const discriminant = (q * q / 4) + (p * p * p / 27);

        const roots = [];

        if (discriminant > 0) {
            // One real root
            const sqrtD = Math.sqrt(discriminant);
            const u = Math.cbrt(-q / 2 + sqrtD);
            const v = Math.cbrt(-q / 2 - sqrtD);
            roots.push(u + v - b / 3);

            const realPart = -(u + v) / 2 - b / 3;
            const imagPart = Math.sqrt(3) * (u - v) / 2;
            result.innerHTML = `
                <span class="solution">x₁ = ${this.formatNumber(roots[0])}</span>
                <span class="complex">x₂ = ${this.formatNumber(realPart)} + ${this.formatNumber(Math.abs(imagPart))}i</span>
                <span class="complex">x₃ = ${this.formatNumber(realPart)} - ${this.formatNumber(Math.abs(imagPart))}i</span>
            `;
        } else if (discriminant === 0) {
            // Multiple roots
            const u = Math.cbrt(-q / 2);
            roots.push(2 * u - b / 3);
            roots.push(-u - b / 3);
            result.innerHTML = `
                <span class="solution">x₁ = ${this.formatNumber(roots[0])}</span>
                <span class="solution">x₂ = x₃ = ${this.formatNumber(roots[1])} (double root)</span>
            `;
        } else {
            // Three real roots (trigonometric method)
            const r = Math.sqrt(-p * p * p / 27);
            const phi = Math.acos(-q / (2 * r));
            const t = 2 * Math.cbrt(r);

            roots.push(t * Math.cos(phi / 3) - b / 3);
            roots.push(t * Math.cos((phi + 2 * Math.PI) / 3) - b / 3);
            roots.push(t * Math.cos((phi + 4 * Math.PI) / 3) - b / 3);

            result.innerHTML = roots.map((r, i) =>
                `<span class="solution">x${i + 1} = ${this.formatNumber(r)}</span>`
            ).join('');
        }
    }

    solveSystem2() {
        const a1 = parseFloat(document.getElementById('sys-a1')?.value) || 0;
        const b1 = parseFloat(document.getElementById('sys-b1')?.value) || 0;
        const c1 = parseFloat(document.getElementById('sys-c1')?.value) || 0;
        const a2 = parseFloat(document.getElementById('sys-a2')?.value) || 0;
        const b2 = parseFloat(document.getElementById('sys-b2')?.value) || 0;
        const c2 = parseFloat(document.getElementById('sys-c2')?.value) || 0;
        const result = document.getElementById('result-system2');

        const det = a1 * b2 - a2 * b1;

        if (det === 0) {
            const ratio1 = a1 !== 0 ? c1 / a1 : (b1 !== 0 ? c1 / b1 : 0);
            const ratio2 = a2 !== 0 ? c2 / a2 : (b2 !== 0 ? c2 / b2 : 0);

            if (Math.abs(ratio1 - ratio2) < 1e-10) {
                result.innerHTML = '<span class="solution">Infinite solutions (dependent equations)</span>';
            } else {
                result.innerHTML = '<span class="error">No solution (parallel lines)</span>';
            }
        } else {
            const x = (c1 * b2 - c2 * b1) / det;
            const y = (a1 * c2 - a2 * c1) / det;
            result.innerHTML = `
                <span class="solution">x = ${this.formatNumber(x)}</span>
                <span class="solution">y = ${this.formatNumber(y)}</span>
            `;
        }
    }

    // ==================== Statistics ====================
    setupStatistics() {
        document.getElementById('calc-stats')?.addEventListener('click', () => this.calculateStatistics());
    }

    calculateStatistics() {
        const input = document.getElementById('stats-data')?.value || '';
        const numbers = input.split(/[,\s]+/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n));

        if (numbers.length === 0) {
            this.setStatValue('stat-n', '-');
            return;
        }

        const n = numbers.length;
        const sum = numbers.reduce((a, b) => a + b, 0);
        const mean = sum / n;
        const sorted = [...numbers].sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[n - 1];
        const range = max - min;

        // Median
        const median = n % 2 === 0
            ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
            : sorted[Math.floor(n / 2)];

        // Mode
        const freq = {};
        numbers.forEach(x => freq[x] = (freq[x] || 0) + 1);
        const maxFreq = Math.max(...Object.values(freq));
        const modes = Object.keys(freq).filter(k => freq[k] === maxFreq);
        const mode = maxFreq === 1 ? 'None' : modes.join(', ');

        // Variance & Std Dev
        const variance = numbers.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0) / n;
        const stddev = Math.sqrt(variance);
        const sampleVar = n > 1 ? numbers.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0) / (n - 1) : 0;
        const sampleStd = Math.sqrt(sampleVar);

        this.setStatValue('stat-n', n);
        this.setStatValue('stat-sum', this.formatNumber(sum));
        this.setStatValue('stat-mean', this.formatNumber(mean));
        this.setStatValue('stat-median', this.formatNumber(median));
        this.setStatValue('stat-mode', mode);
        this.setStatValue('stat-range', this.formatNumber(range));
        this.setStatValue('stat-min', this.formatNumber(min));
        this.setStatValue('stat-max', this.formatNumber(max));
        this.setStatValue('stat-variance', this.formatNumber(variance));
        this.setStatValue('stat-stddev', this.formatNumber(stddev));
        this.setStatValue('stat-samplevar', n > 1 ? this.formatNumber(sampleVar) : '-');
        this.setStatValue('stat-samplestd', n > 1 ? this.formatNumber(sampleStd) : '-');
    }

    setStatValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    // ==================== Converters ====================
    setupConverters() {
        // Tab switching
        document.querySelectorAll('.conv-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.conv-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.convert-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`conv-${tab.dataset.conv}`)?.classList.add('active');
            });
        });

        this.setupBaseConverter();
        this.setupUnitConverters();
    }

    setupBaseConverter() {
        const dec = document.getElementById('base-dec');
        const bin = document.getElementById('base-bin');
        const oct = document.getElementById('base-oct');
        const hex = document.getElementById('base-hex');

        const updateFromDec = (val) => {
            const num = parseInt(val) || 0;
            if (bin) bin.value = num.toString(2);
            if (oct) oct.value = num.toString(8);
            if (hex) hex.value = num.toString(16).toUpperCase();
        };

        dec?.addEventListener('input', () => updateFromDec(dec.value));
        bin?.addEventListener('input', () => {
            const num = parseInt(bin.value, 2) || 0;
            if (dec) dec.value = num;
            if (oct) oct.value = num.toString(8);
            if (hex) hex.value = num.toString(16).toUpperCase();
        });
        oct?.addEventListener('input', () => {
            const num = parseInt(oct.value, 8) || 0;
            if (dec) dec.value = num;
            if (bin) bin.value = num.toString(2);
            if (hex) hex.value = num.toString(16).toUpperCase();
        });
        hex?.addEventListener('input', () => {
            const num = parseInt(hex.value, 16) || 0;
            if (dec) dec.value = num;
            if (bin) bin.value = num.toString(2);
            if (oct) oct.value = num.toString(8);
        });
    }

    setupUnitConverters() {
        // Length
        const lengthFactors = { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 };
        this.setupConverter('length', lengthFactors);

        // Mass
        const massFactors = { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495, t: 1000 };
        this.setupConverter('mass', massFactors);

        // Area
        const areaFactors = { m2: 1, km2: 1000000, cm2: 0.0001, ha: 10000, ac: 4046.86, ft2: 0.092903, mi2: 2590000 };
        this.setupConverter('area', areaFactors);

        // Temperature (special handling)
        this.setupTempConverter();
    }

    setupConverter(type, factors) {
        const val = document.getElementById(`${type}-val`);
        const from = document.getElementById(`${type}-from`);
        const to = document.getElementById(`${type}-to`);
        const result = document.getElementById(`${type}-result`);

        const convert = () => {
            if (!val || !from || !to || !result) return;
            const value = parseFloat(val.value) || 0;
            const inMeters = value * factors[from.value];
            const converted = inMeters / factors[to.value];
            result.value = this.formatNumber(converted);
        };

        val?.addEventListener('input', convert);
        from?.addEventListener('change', convert);
        to?.addEventListener('change', convert);
    }

    setupTempConverter() {
        const val = document.getElementById('temp-val');
        const from = document.getElementById('temp-from');
        const to = document.getElementById('temp-to');
        const result = document.getElementById('temp-result');

        const convert = () => {
            if (!val || !from || !to || !result) return;
            const value = parseFloat(val.value) || 0;

            // Convert to Celsius first
            let celsius;
            switch (from.value) {
                case 'c': celsius = value; break;
                case 'f': celsius = (value - 32) * 5 / 9; break;
                case 'k': celsius = value - 273.15; break;
            }

            // Convert from Celsius to target
            let converted;
            switch (to.value) {
                case 'c': converted = celsius; break;
                case 'f': converted = celsius * 9 / 5 + 32; break;
                case 'k': converted = celsius + 273.15; break;
            }

            result.value = this.formatNumber(converted);
        };

        val?.addEventListener('input', convert);
        from?.addEventListener('change', convert);
        to?.addEventListener('change', convert);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.calculator = new AdvancedCalculator();
});
