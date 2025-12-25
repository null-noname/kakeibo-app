import { saveDB } from '../services/db.js';
import { renderBlocks } from './kakeibo-blocks.js';

export function renderKakeibo(data, redo) {
    const sel = document.getElementById('year-select');
    const yd = data.years[data.currentYear] || { activeMonth: 1, months: {} };
    const m = yd.activeMonth || 1;
    sel.innerHTML = Object.keys(data.years).sort().map(y => `<option value="${y}" ${y == data.currentYear ? 'selected' : ''}>${y}年</option>`).join('');
    const tabs = document.getElementById('month-tabs');
    tabs.innerHTML = [...Array(12)].map((_, i) => `<div class="month-btn ${m == i + 1 ? 'active' : ''}" onclick="">${i + 1}月</div>`).join('');
    [...tabs.children].forEach((b, i) => { b.onclick = () => { yd.activeMonth = i + 1; saveDB({}); redo(); } });
    document.getElementById('monthly-header-title').innerText = `${m}月の収支`;
    renderBlocks(yd, m, redo);
}
