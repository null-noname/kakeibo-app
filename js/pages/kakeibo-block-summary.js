import { saveDB } from '../services/db.js';

export function renderSummary(div, b, redo) {
    const s = document.createElement('div');
    s.className = 'summary-area';
    s.innerHTML = `<div class="summary-item"><span class="summary-label">残高</span><input class="summary-input" type="tel"></div>
        <div class="summary-item"><span class="summary-label">入金</span><input class="summary-input" type="tel"></div>`;
    const is = s.querySelectorAll('input');
    const setS = (el, k) => {
        el.value = (b[k] || 0).toLocaleString();
        el.onfocus = (e) => e.target.value = b[k] || "";
        el.onblur = (e) => {
            b[k] = parseInt(e.target.value.replace(/[^0-9\-]/g, '')) || 0;
            saveDB({}); redo();
        };
    };
    setS(is[0], 'balance'); setS(is[1], 'deposit');
    div.appendChild(s);
}
