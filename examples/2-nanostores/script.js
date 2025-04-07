import { atom, onSet } from 'https://cdn.skypack.dev/nanostores@0.10.3';

const userId = atom('nano_1');
const itemId = atom('n_item_A');
const stateAtoms = { userId, itemId };

function updateDisplay(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

onSet(userId, ({ newValue }) => updateDisplay('user-id', newValue));
onSet(itemId, ({ newValue }) => updateDisplay('item-id', newValue));

function resolveAppVariable(varName) {
    return stateAtoms[varName]?.get();
}

// Make sure to include the htmx library before this script
htmx.config.dynamicUrlResolver = resolveAppVariable;

function changeState() {
    userId.set(`nano_${Math.random().toString(36).substring(2, 7)}`);
    itemId.set(`n_item_${Math.random() < 0.5 ? 'X' : 'Y'}`);
}

document.addEventListener('DOMContentLoaded', () => {
    updateDisplay('user-id', userId.get());
    updateDisplay('item-id', itemId.get());
    document.getElementById('change-state-btn').addEventListener('click', changeState);
});