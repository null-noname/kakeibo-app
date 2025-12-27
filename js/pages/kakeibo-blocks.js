import { renderItems } from './kakeibo-items.js';
import { attachBlockEvents } from './kakeibo-block-events.js';
import { renderSummary } from './kakeibo-block-summary.js';

export function renderBlocks(yd, m, redo) {
    const c = document.getElementById('monthly-container');
    c.innerHTML = '';
    (yd.months[m] || []).forEach((b, bi) => {
        const div = document.createElement('div');
        div.className = 'category-block';
        if (['通帳', '財布', '競馬'].includes(b.title)) div.classList.add('no-border-block');
        div.innerHTML = `<div class="cat-header">
            <input class="cat-title-input" value="${b.title}">
            <button class="btn-toggle">${b.isOpen ? '－' : '＋'}</button>
        </div>`;
        attachBlockEvents(div, b, redo);
        if (b.isOpen) {
            if (b.type === 'standard') renderSummary(div, b, redo);
            renderItems(div, b, bi, m, redo);
        }
        c.appendChild(div);
    });
}
