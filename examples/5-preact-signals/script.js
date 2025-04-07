import { signal, effect } from 'https://cdn.skypack.dev/@preact/signals-core@1.6.1';

const userId = signal('sig_1');
const itemId = signal('s_item_A');
const stateSignals = { userId, itemId };

function updateDisplay(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

effect(() => updateDisplay('user-id', userId.value));
effect(() => updateDisplay('item-id', itemId.value));

function resolveAppVariable(varName) {
    return stateSignals[varName]?.value;
}

// Make sure to include the htmx library before this script
htmx.config.dynamicUrlResolver = resolveAppVariable;

function changeState() {
    userId.value = `sig_${Math.random().toString(36).substring(2, 7)}`;
    itemId.value = `s_item_${Math.random() < 0.5 ? 'X' : 'Y'}`;
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('change-state-btn').addEventListener('click', changeState);
});