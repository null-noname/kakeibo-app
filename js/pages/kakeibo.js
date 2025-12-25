import { state, saveDB } from '../services/db.js';
import { renderKakeibo } from './kakeibo-render.js';

export function init() {
    render();
    const sel = document.getElementById('year-select');
    sel.onchange = (e) => {
        state.currentYear = e.target.value;
        render();
    };
    document.getElementById('btn-year-del').onclick = () => {
        if (Object.keys(state.years).length > 1 && confirm("削除?")) {
            delete state.years[state.currentYear];
            state.currentYear = Object.keys(state.years)[0];
            saveDB({}); render();
        }
    };
    document.getElementById('btn-year-add').onclick = () => {
        const n = prompt("西暦を入力");
        if (n && !state.years[n]) {
            state.years[n] = { months: {} }; // 簡易化
            state.currentYear = n;
            saveDB({}); render();
        }
    };
    const addBk = (t) => {
        const yd = state.years[state.currentYear];
        const m = yd.activeMonth || 1;
        yd.months[m] = yd.months[m] || [];
        yd.months[m].push({ type: t, title: t === 'standard' ? 'リスト1' : 'リスト2', isOpen: true, items: [] });
        saveDB({}); render();
    };
    document.getElementById('btn-add-cat1').onclick = () => addBk('standard');
    document.getElementById('btn-add-cat2').onclick = () => addBk('detail');
}

function render() {
    renderKakeibo(state, render);
}
