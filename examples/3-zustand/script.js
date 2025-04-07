import { createStore } from 'https://cdn.skypack.dev/zustand@4.5.2/vanilla';

const useAppStore = createStore((set, get) => ({
  userId: 'z_user_1',
  itemId: 'z_item_A',
  change: () => set({
    userId: `z_user_${Math.random().toString(36).substring(2, 7)}`,
    itemId: `z_item_${Math.random() < 0.5 ? 'X' : 'Y'}`,
  }),
}));

function updateDisplay(state) {
    document.getElementById('user-id').textContent = state.userId;
    document.getElementById('item-id').textContent = state.itemId;
}

useAppStore.subscribe(updateDisplay);

function resolveAppVariable(varName) {
    return useAppStore.getState()[varName];
}

// Make sure to include the htmx library before this script
htmx.config.dynamicUrlResolver = resolveAppVariable;

function changeState() {
    useAppStore.getState().change();
}

document.addEventListener('DOMContentLoaded', () => {
    updateDisplay(useAppStore.getState());
    document.getElementById('change-state-btn').addEventListener('click', changeState);
});