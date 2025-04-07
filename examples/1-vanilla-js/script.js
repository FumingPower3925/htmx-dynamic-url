let appState = { userId: 'vanilla_1', itemId: 'v_item_A' };

function updateDisplay() {
    document.getElementById('user-id').textContent = appState.userId;
    document.getElementById('item-id').textContent = appState.itemId;
}

function resolveAppVariable(varName) {
    return appState[varName];
}

// Make sure to include the htmx library before this script
htmx.config.dynamicUrlResolver = resolveAppVariable;

function changeState() {
    appState.userId = `vanilla_${Math.random().toString(36).substring(2, 7)}`;
    appState.itemId = `v_item_${Math.random() < 0.5 ? 'X' : 'Y'}`;
    updateDisplay();
}

document.addEventListener('DOMContentLoaded', updateDisplay);
window.changeState = changeState;