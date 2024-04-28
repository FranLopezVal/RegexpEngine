import { toNFAFromInfixExp, recognize } from './nfa.js';

export function loadExpression(exp) {
    const nfa = toNFAFromInfixExp(exp);

    return word => recognize(nfa, word);
}
