import { proxy, subscribe } from 'https://cdn.skypack.dev/valtio@1.13.2/vanilla?min';

const appState = proxy({ userId: 'valtio_1', itemId: 'v_item_A' });

function updateDisplay() {
    document.getElementById('user-id').textContent = appState.userId;
    document.getElementById('item-id').textContent = appState.itemId;
}

subscribe(appState, updateDisplay);

function resolveAppVariable(varName) {
    return appState[varName];
}

// Make sure to include the htmx library before this script
htmx.config.dynamicUrlResolver = resolveAppVariable;

function changeState() {
    appState.userId = `valtio_${Math.random().toString(36).substring(2, 7)}`;
    appState.itemId = `v_item_${Math.random() < 0.5 ? 'X' : 'Y'}`;
}

document.addEventListener('DOMContentLoaded', () => {
    updateDisplay();
    document.getElementById('change-state-btn').addEventListener('click', changeState);
});