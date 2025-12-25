import { saveDB } from '../services/db.js';
import { formatNum } from './kakeibo-utils.js';

export function renderFooter(parent, b, bi, m, redo) {
    let s1 = 0, s2 = 0;
    (b.items || []).forEach(it => { s1 += (it.v1 || 0); s2 += (it.v2 || 0); });
    const tr = document.createElement('tr');
    tr.className = 'total-row';
    tr.innerHTML = `<td></td><td class="total-label">合計</td>
        <td><div class="total-val-box">${formatNum(s1)}</div></td>
        <td><div class="total-val-box">${formatNum(s2)}</div></td><td colspan="2"></td>`;
    parent.appendChild(tr);
    const btn = document.createElement('button');
    btn.className = 'add-row-btn'; btn.innerText = '追加';
    btn.onclick = () => {
        b.items.push({ date: "", name: "", v1: 0, v2: 0 });
        saveDB({}); redo();
    };
    parent.parentElement.parentElement.appendChild(btn);
}
