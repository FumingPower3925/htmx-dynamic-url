import { atom, createStore } from 'https://cdn.skypack.dev/jotai@2.8.3/vanilla?min';

const appStore = createStore();
const userIdAtom = atom('jotai_1');
const itemIdAtom = atom('j_item_A');
const stateAtoms = { userId: userIdAtom, itemId: itemIdAtom };

function updateDisplay(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

appStore.sub(userIdAtom, () => updateDisplay('user-id', appStore.get(userIdAtom)));
appStore.sub(itemIdAtom, () => updateDisplay('item-id', appStore.get(itemIdAtom)));

function resolveAppVariable(varName) {
    const atomToGet = stateAtoms[varName];
    return atomToGet ? appStore.get(atomToGet) : undefined;
}

// Make sure to include the htmx library before this script
htmx.config.dynamicUrlResolver = resolveAppVariable;

function changeState() {
    appStore.set(userIdAtom, `jotai_${Math.random().toString(36).substring(2, 7)}`);
    appStore.set(itemIdAtom, `j_item_${Math.random() < 0.5 ? 'X' : 'Y'}`);
}

document.addEventListener('DOMContentLoaded', () => {
    updateDisplay('user-id', appStore.get(userIdAtom));
    updateDisplay('item-id', appStore.get(itemIdAtom));
    document.getElementById('change-state-btn').addEventListener('click', changeState);
});