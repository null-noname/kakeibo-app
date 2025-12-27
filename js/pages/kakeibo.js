import { state, saveDB } from '../services/db.js';

// --- Utils ---
const formatNum = (n) => Number(n).toLocaleString();
const parseNum = (v) => {
    let n = parseInt(String(v).replace(/[^0-9\-]/g, '')) || 0;
    return Math.min(Math.max(n, -999999), 999999);
};
const autoHeight = (el) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
};

// --- Render Functions ---
export function init() {
    render();
    const getEl = id => document.getElementById(id);
    getEl('year-select').onchange = (e) => { state.currentYear = e.target.value; render(); };
    getEl('btn-year-del').onclick = () => {
        if (Object.keys(state.years).length > 1 && confirm("削除?")) {
            delete state.years[state.currentYear];
            state.currentYear = Object.keys(state.years)[0];
            saveDB({}); render();
        }
    };
    getEl('btn-year-add').onclick = () => {
        const n = prompt("西暦を入力");
        if (n && !state.years[n]) {
            state.years[n] = { months: {} };
            state.currentYear = n;
            saveDB({}); render();
        }
    };
    getEl('btn-add-cat1').onclick = () => addBlock('standard');
    getEl('btn-add-cat2').onclick = () => addBlock('detail');
}

function render() {
    const data = state;
    const sel = document.getElementById('year-select');
    const yd = data.years[data.currentYear] || { activeMonth: 1, months: {} };
    if (!yd.months) yd.months = {};
    const m = yd.activeMonth || 1;

    sel.innerHTML = Object.keys(data.years).sort().map(y => `<option value="${y}" ${y == data.currentYear ? 'selected' : ''}>${y}年</option>`).join('');

    const tabs = document.getElementById('month-tabs');
    tabs.innerHTML = [...Array(12)].map((_, i) => `<div class="month-btn ${m == i + 1 ? 'active' : ''}">${i + 1}月</div>`).join('');
    [...tabs.children].forEach((b, i) => {
        b.onclick = () => { yd.activeMonth = i + 1; saveDB({}); render(); };
    });

    document.getElementById('monthly-header-title').innerText = `${m}月の収支`;

    const container = document.getElementById('monthly-container');
    container.innerHTML = '';
    (yd.months[m] || []).forEach((b, bi) => {
        const div = document.createElement('div');
        div.className = 'category-block';
        div.innerHTML = `
            <div class="cat-header">
                <input class="cat-title-input" value="${b.title}">
                <button class="btn-toggle">${b.isOpen ? '－' : '＋'}</button>
            </div>`;

        const headerInput = div.querySelector('.cat-title-input');
        headerInput.onchange = (e) => { b.title = e.target.value; saveDB({}); };

        const toggleBtn = div.querySelector('.btn-toggle');
        toggleBtn.onclick = () => { b.isOpen = !b.isOpen; saveDB({}); render(); };

        if (b.isOpen) {
            if (b.type === 'standard') renderBlockSummary(div, b);
            renderBlockItems(div, b, bi, m);
        }
        container.appendChild(div);
    });
}

function renderBlockSummary(parent, b) {
    const s = document.createElement('div');
    s.className = 'summary-area';
    s.innerHTML = `
        <div class="summary-item"><span class="summary-label">残高</span><input class="summary-input" type="tel"></div>
        <div class="summary-item"><span class="summary-label">入金</span><input class="summary-input" type="tel"></div>`;
    const ins = s.querySelectorAll('input');
    const setup = (el, key) => {
        el.value = (b[key] || 0).toLocaleString();
        el.onfocus = (e) => e.target.value = b[key] || "";
        el.onblur = (e) => { b[key] = parseNum(e.target.value); saveDB({}); render(); };
    };
    setup(ins[0], 'balance');
    setup(ins[1], 'deposit');
    parent.appendChild(s);
}

function renderBlockItems(parent, b, bi, m) {
    const table = document.createElement('table');
    const isStandard = b.type === 'standard';
    const h = isStandard ?
        `<tr><th class="col-date">日</th><th class="col-text">内容</th><th class="col-money">予定</th><th class="col-money">確定</th><th class="col-btns"></th></tr>` :
        `<tr><th class="col-date">日</th><th class="col-text">重賞名</th><th class="col-money">入金</th><th class="col-money">払戻</th><th class="col-btns"></th></tr>`;
    table.innerHTML = `<thead>${h}</thead>`;

    const tbody = document.createElement('tbody');
    let sum1 = 0, sum2 = 0;

    (b.items || []).forEach((it, ii) => {
        const tr = document.createElement('tr');
        const v1 = it.v1 ?? (it.plan || it.out || 0);
        const v2 = it.v2 ?? (it.act || it.in || 0);
        sum1 += v1; sum2 += v2;

        tr.innerHTML = `
            <td class="col-date"><input class="day-input" value="${it.date || ''}" type="tel" maxlength="2" placeholder="日"></td>
            <td class="col-text"><input class="kakeibo-text" value="${it.name || ''}"></td>
            <td class="col-money"><input class="money-input" value="${formatNum(v1)}" type="tel"></td>
            <td class="col-money"><input class="money-input" value="${formatNum(v2)}" type="tel"></td>
            <td class="col-btns"><button class="mini-btn">▲</button><button class="mini-btn btn-del">×</button></td>`;

        const ins = tr.querySelectorAll('input');
        ins[0].onblur = (e) => { it.date = e.target.value; saveDB({}); };
        ins[1].onblur = (e) => { it.name = e.target.value; saveDB({}); };

        const setVal = (idx, k) => {
            ins[idx].onfocus = (e) => e.target.value = it[k] ?? 0;
            ins[idx].onblur = (e) => {
                const val = parseNum(e.target.value);
                it[k] = val;
                delete it.plan; delete it.out; delete it.act; delete it.in;
                saveDB({}); render();
            };
        };
        setVal(2, 'v1'); setVal(3, 'v2');

        const bts = tr.querySelectorAll('button');
        bts[0].onclick = () => {
            if (ii > 0) {
                [b.items[ii], b.items[ii - 1]] = [b.items[ii - 1], b.items[ii]];
                saveDB({}); render();
            }
        };
        bts[1].onclick = () => {
            if (confirm("本当に削除しますか？")) {
                b.items.splice(ii, 1);
                saveDB({}); render();
            }
        };

        tbody.appendChild(tr);
    });

    // フッター (合計行)
    const ttr = document.createElement('tr');
    ttr.className = 'total-row';
    ttr.innerHTML = `<td></td><td style="text-align:right;padding-right:10px;color:#aaa;font-size:0.8em;">合計</td>
        <td><div class="total-val-box">${formatNum(sum1)}</div></td>
        <td><div class="total-val-box">${formatNum(sum2)}</div></td><td></td>`;
    tbody.appendChild(ttr);
    table.appendChild(tbody);
    parent.appendChild(table);

    const addBtn = document.createElement('button');
    addBtn.className = 'big-btn btn-green add-row-btn';
    addBtn.innerText = '＋ 行を追加';
    addBtn.onclick = () => {
        b.items.push({ date: "", name: "", v1: 0, v2: 0 });
        saveDB({}); render();
    };
    parent.appendChild(addBtn);
}

function addBlock(type) {
    const yd = state.years[state.currentYear];
    const m = yd.activeMonth || 1;
    yd.months[m] = yd.months[m] || [];
    const title = type === 'standard' ? '新しいリスト' : '競馬リスト';
    yd.months[m].push({ type, title, isOpen: true, items: [] });
    saveDB({}); render();
}
