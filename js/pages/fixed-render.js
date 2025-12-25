import { saveDB } from '../services/db.js';
import { parseNum, fixDate, autoHeight } from './kakeibo-utils.js';

export function renderFixed(st, redo) {
    const yd = st.years[st.currentYear];
    document.getElementById('btn-annual-year').innerText = yd.isAnnualYearOpen ? '－' : '＋';
    document.getElementById('content-annual-year').className = yd.isAnnualYearOpen ? '' : 'hidden';
    document.getElementById('btn-annual-month').innerText = yd.isAnnualMonthOpen ? '－' : '＋';
    document.getElementById('content-annual-month').className = yd.isAnnualMonthOpen ? '' : 'hidden';

    const draw = (id, list, k) => {
        const c = document.getElementById(id); c.innerHTML = '';
        const t = document.createElement('table');
        t.innerHTML = `<thead><tr><th class="col-date">日付</th><th>内容</th><th class="col-money">金額</th><th class="col-btn"></th><th class="col-btn"></th></tr></thead>`;
        const tb = document.createElement('tbody');
        (list || []).forEach((it, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td><input class="date-input" value="${it.date || ''}"></td>
                <td><textarea class="kakeibo-text">${it.text || ''}</textarea></td>
                <td><input class="money-input" value="${(it.cost || 0).toLocaleString()}" type="tel"></td>
                <td><button class="mini-btn btn-up">↑</button></td>
                <td><button class="mini-btn btn-del">×</button></td>`;
            const ins = tr.querySelectorAll('input, textarea');
            ins[0].onblur = (e) => { it.date = fixDate(e.target.value); saveDB({}); redo(); };
            ins[1].oninput = (e) => autoHeight(e.target);
            ins[1].onblur = (e) => { it.text = e.target.value; saveDB({}); };
            ins[2].onfocus = (e) => e.target.value = it.cost || "";
            ins[2].onblur = (e) => { it.cost = parseNum(e.target.value); saveDB({}); redo(); };
            const bts = tr.querySelectorAll('button');
            bts[0].onclick = () => { if (idx > 0) { [list[idx], list[idx - 1]] = [list[idx - 1], list[idx]]; saveDB({}); redo(); } };
            bts[1].onclick = () => { if (confirm("削除?")) { list.splice(idx, 1); saveDB({}); redo(); } };
            tb.appendChild(tr); setTimeout(() => autoHeight(ins[1]), 0);
        });
        t.appendChild(tb); c.appendChild(t);
    };
    draw('annual-table-year', yd.annualYear, 'Year');
    draw('annual-table-month', yd.annualMonth, 'Month');
}
