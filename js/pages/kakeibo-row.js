import { saveDB, state } from '../services/db.js';
import { parseNum, fixDate, autoHeight } from './kakeibo-utils.js';

export function renderRow(it, bi, ii, m, redo, type) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input class="day-input" value="${it.date || ''}" type="tel"></td>
        <td><textarea class="kakeibo-text">${it.name || ''}</textarea></td>
        <td><input class="money-input" value="${(it.v1 || 0).toLocaleString()}" type="tel"></td>
        <td><input class="money-input" value="${(it.v2 || 0).toLocaleString()}" type="tel"></td>
        <td><button class="mini-btn">↑</button></td>
        <td><button class="mini-btn">×</button></td>
    `;
    const ins = tr.querySelectorAll('input, textarea');
    ins[0].onblur = (e) => { it.date = e.target.value; saveDB({}); };
    ins[1].oninput = (e) => autoHeight(e.target);
    ins[1].onblur = (e) => { it.name = e.target.value; saveDB({}); };
    const setV = (idx, key) => {
        ins[idx].onfocus = (e) => e.target.value = it[key] || "";
        ins[idx].onblur = (e) => { it[key] = parseNum(e.target.value); saveDB({}); redo(); };
    };
    setV(2, 'v1'); setV(3, 'v2');
    const bts = tr.querySelectorAll('button');
    bts[0].onclick = () => {
        const items = state.years[state.currentYear].months[m][bi].items;
        if (ii > 0) { [items[ii], items[ii - 1]] = [items[ii - 1], items[ii]]; saveDB({}); redo(); }
    };
    bts[1].onclick = () => {
        if (confirm("削除?")) { state.years[state.currentYear].months[m][bi].items.splice(ii, 1); saveDB({}); redo(); }
    };
    setTimeout(() => autoHeight(ins[1]), 0);
    return tr;
}
