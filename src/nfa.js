import { toParseTree } from './parser.js';

function createState(isEnd) {
    return {
        isEnd,
        transition: {},
        epsilonTransitions: []
    };
}

function addEpsilon(from, to) {
    from.epsilonTransitions.push(to);
}


function addTransition(from, to, symbol) {
    from.transition[symbol] = to;
}


function fromEpsilon() {
    const start = createState(false);
    const end = createState(true);
    addEpsilon(start, end);

    return { start, end };
}


function fromSymbol(symbol) {
    const start = createState(false);
    const end = createState(true);
    addTransition(start, end, symbol);

    return { start, end };
}

function concat(first, second) {
    addEpsilon(first.end, second.start);
    first.end.isEnd = false;

    return { start: first.start, end: second.end };
}


function union(first, second) {
    const start = createState(false);
    addEpsilon(start, first.start);
    addEpsilon(start, second.start);

    const end = createState(true);

    addEpsilon(first.end, end);
    first.end.isEnd = false;
    addEpsilon(second.end, end);
    second.end.isEnd = false;

    return { start, end };
}



function closure(nfa) {
    const start = createState(false);
    const end = createState(true);

    addEpsilon(start, end);
    addEpsilon(start, nfa.start);

    addEpsilon(nfa.end, end);
    addEpsilon(nfa.end, nfa.start);
    nfa.end.isEnd = false;

    return { start, end };
}


function zeroOrOne(nfa) {
    const start = createState(false);
    const end = createState(true);

    addEpsilon(start, end);
    addEpsilon(start, nfa.start);

    addEpsilon(nfa.end, end);
    nfa.end.isEnd = false;

    return { start, end };
}

function oneOrMore(nfa) {
    const start = createState(false);
    const end = createState(true);

    addEpsilon(start, nfa.start);
    addEpsilon(nfa.end, end);
    addEpsilon(nfa.end, nfa.start);
    nfa.end.isEnd = false;

    return { start, end };
}


export function toNFA(postfixExp) {
    if (postfixExp === '') {
        return fromEpsilon();
    }

    const stack = [];

    for (const token of postfixExp) {
        if (token === '*') {
            stack.push(closure(stack.pop()));
        } else if (token === "?") {
            stack.push(zeroOrOne(stack.pop()));
        } else if (token === "+") {
            stack.push(oneOrMore(stack.pop()));
        } else if (token === '|') {
            const right = stack.pop();
            const left = stack.pop();
            stack.push(union(left, right));
        } else if (token === '.') {
            const right = stack.pop();
            const left = stack.pop();
            stack.push(concat(left, right));
        } else {
            stack.push(fromSymbol(token));
        }
    }

    return stack.pop();
}


function toNFAfromTree(root) {
    if (root.label === 'Expr') {
        const term = toNFAfromTree(root.children[0]);
        if (root.children.length === 3) 
            return union(term, toNFAfromTree(root.children[2]));

        return term; 
    }

    if (root.label === 'Term') {
        const factor = toNFAfromTree(root.children[0]);
        if (root.children.length === 2) 
            return concat(factor, toNFAfromTree(root.children[1]));

        return factor; 
    }

    if (root.label === 'Factor') {
        const atom = toNFAfromTree(root.children[0]);
        if (root.children.length === 2) { 
            const meta = root.children[1].label;
            if (meta === '*')
                return closure(atom);
            if (meta === '+')
                return oneOrMore(atom);
            if (meta === '?')
                return zeroOrOne(atom);
        }

        return atom; 
    }

    if (root.label === 'Atom') {
        if (root.children.length === 3) 
            return toNFAfromTree(root.children[1]);

        return toNFAfromTree(root.children[0]); 
    }

    if (root.label === 'Char') {
        if (root.children.length === 2) 
            return fromSymbol(root.children[1].label);

        return fromSymbol(root.children[0].label); 
    }

    throw new Error('Nodo no reconocido: ' + root.label);
}

export function toNFAFromInfixExp(infixExp) {
    if (infixExp === '')
        return fromEpsilon();

    return toNFAfromTree(toParseTree(infixExp));
}


function recursiveBacktrackingSearch(state, visited, input, position) {
    if (visited.includes(state)) {
        return false;
    }

    visited.push(state);

    if (position === input.length) {
        if (state.isEnd) {
            return true;
        }

        if (state.epsilonTransitions.some(s => recursiveBacktrackingSearch(s, visited, input, position))) {
            return true;
        }
    } else {
        const nextState = state.transition[input[position]];

        if (nextState) {
            if (recursiveBacktrackingSearch(nextState, [], input, position + 1)) {
                return true;
            }
        } else {
            if (state.epsilonTransitions.some(s => recursiveBacktrackingSearch(s, visited, input, position))) {
                return true;
            }
        }

        return false;
    }
}

function addNextState(state, nextStates, visited) {
    if (state.epsilonTransitions.length) {
        for (const st of state.epsilonTransitions) {
            if (!visited.find(vs => vs === st)) {
                visited.push(st);
                addNextState(st, nextStates, visited);
            }
        }
    } else {
        nextStates.push(state);
    }
}

function search(nfa, word) {
    let currentStates = [];
    addNextState(nfa.start, currentStates, []);

    for (const symbol of word) {
        const nextStates = [];

        for (const state of currentStates) {
            const nextState = state.transition[symbol];
            if (nextState) {
                addNextState(nextState, nextStates, []);
            }
        }

        currentStates = nextStates;
    }

    return currentStates.find(s => s.isEnd) ? true : false;
}

export function recognize(nfa, word) {
    return search(nfa, word);
}
