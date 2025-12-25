import { renderItems } from './kakeibo-items.js';
import { saveDB } from '../services/db.js';

export function renderBlocks(yd, m, redo) {
    const c = document.getElementById('monthly-container');
    c.innerHTML = '';
    (yd.months[m] || []).forEach((b, bi) => {
        const div = document.createElement('div');
        div.className = 'category-block';
        div.innerHTML = `
            <div class="cat-header">
                <input class="cat-title-input" value="${b.title}" onchange="">
                <div style="display:flex;gap:5px;">
                    <button class="btn-toggle" id="tog-${bi}">${b.isOpen ? '－' : '＋'}</button>
                </div>
            </div>`;
        const input = div.querySelector('input');
        input.onchange = (e) => { b.title = e.target.value; saveDB({ years: state.years }); };
        const btn = div.querySelector(`#tog-${bi}`);
        btn.onclick = () => { b.isOpen = !b.isOpen; saveDB({ years: state.years }); redo(); };
        if (b.isOpen) renderItems(div, b, bi, m, redo);
        c.appendChild(div);
    });
}
