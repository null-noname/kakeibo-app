import { autoHeight } from './kakeibo-utils.js';
import { attachRowEvents } from './kakeibo-row-events.js';
import { getRowHtml } from './kakeibo-row-html.js';
import { attachRowActions } from './kakeibo-row-actions.js';

export function renderRow(it, bi, ii, m, redo) {
    const tr = document.createElement('tr');
    tr.innerHTML = getRowHtml(it);
    const ins = tr.querySelectorAll('input, textarea');
    attachRowEvents(ins, it, redo);
    ins[1].oninput = (e) => autoHeight(e.target);
    const bts = tr.querySelectorAll('button');
    attachRowActions(bts, bi, ii, m, redo);
    setTimeout(() => autoHeight(ins[1]), 0);
    return tr;
}
