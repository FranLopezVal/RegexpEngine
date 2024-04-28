export function insertExplicitConcatOperator(exp) {
    let output = '';

    for (let i = 0; i < exp.length; i++) {
        const token = exp[i];
        output += token;

        if (token === '(' || token === '|') {
            continue;
        }

        if (i < exp.length - 1) {
            const lookahead = exp[i + 1];

            if (lookahead === '*' || lookahead === '?' || lookahead === '+' || lookahead === '|' || lookahead === ')') {
                continue;
            }

            output += '.';
        }
    }

    return output;
};

function peekStack(stack) {
    return stack.length && stack[stack.length - 1];
}

const operators = {
    '|': 0,
    '.': 1,
    '?': 2,
    '*': 2,
    '+': 2
};

export function toPostfix(exp) {
    let output = '';
    const operatorStack = [];

    for (const token of exp) {
        if (token === '.' || token === '|' || token === '*' || token === '?' || token === '+') {
            while (operatorStack.length && peekStack(operatorStack) !== '('
                && operators[peekStack(operatorStack)] >= operators[token]) {
                output += operatorStack.pop();
            }

            operatorStack.push(token);
        } else if (token === '(' || token === ')') {
            if (token === '(') {
                operatorStack.push(token);
            } else {
                while (peekStack(operatorStack) !== '(') {
                    output += operatorStack.pop();
                }
                operatorStack.pop();
            }
        } else {
            output += token;
        }
    }

    while (operatorStack.length) {
        output += operatorStack.pop();
    }

    return output;
};

function TreeNode(label, children) {
    this.label = label;
    this.children = children || [];
}

let pattern = '';
let pos = 0;

const peek = () => pattern[pos];
const hasMoreChars = () => pos < pattern.length;
const isMetaChar = ch => ch === '*' || ch === '+' || ch === '?';

function match(ch) {
    if (peek() !== ch)
        throw new Error(`Simbolo erroneo: ${ch}`);
    pos++;
}

function next() {
    let ch = peek();
    match(ch);

    return ch;
}

function expr() {
    const trm = term();

    if (hasMoreChars() && peek() === '|') {
        match('|');
        const exp = expr();
        return new TreeNode('Expr', [trm, new TreeNode('|'), exp]);
    }

    return new TreeNode('Expr', [trm]);
}

function term() {
    const factr = factor();

    if (hasMoreChars() && peek() !== ')' && peek() !== '|') {
        const trm = term();
        return new TreeNode('Term', [factr, trm]);
    }

    return new TreeNode('Term', [factr]);
}

function factor() {
    const atm = atom();

    if (hasMoreChars() && isMetaChar(peek())) {
        const meta = next();
        return new TreeNode('Factor', [atm, new TreeNode(meta)]);
    }

    return new TreeNode('Factor', [atm]);
}

function atom() {
    if (peek() === '(') {
        match('(');
        const exp = expr();
        match(')');
        return new TreeNode('Atom', [new TreeNode('('), exp, new TreeNode(')')]);
    }

    const ch = char();
    return new TreeNode('Atom', [ch]);
}

function char() {
    if (isMetaChar(peek()))
        throw new Error(`Caracter erroneo: ${peek()}`);

    if (peek() === '\\') {
        match('\\');
        return new TreeNode('Char', [new TreeNode('\\'), new TreeNode(next())]);
    }

    return new TreeNode('Char', [new TreeNode(next())]);
}

export function toParseTree(regex) {
    pattern = regex;
    pos = 0;

    return expr();
}