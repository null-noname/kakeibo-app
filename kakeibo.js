/**
 * 家計簿メイン機能モジュール (kakeibo.js)
 */

import { formatNum, formatDateAnnual } from './utils.js';

/**
 * メインの描画関数
 */
export function renderKakeibo() {
    const data = window.data;
    if (!data) return;

    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
        yearSelect.innerHTML = '';
        Object.keys(data.years).sort().forEach(y => {
            const op = document.createElement('option');
            op.value = y;
            op.innerText = y + "年";
            if (y === data.currentYear) op.selected = true;
            yearSelect.appendChild(op);
        });
    }

    const yd = data.years[data.currentYear];
    const activeMonth = yd.activeMonth || 1;

    // 固定費セクションのボタン・表示切り替え
    const btnAnnYear = document.getElementById('btn-annual-year');
    const contentAnnYear = document.getElementById('content-annual-year');
    if (btnAnnYear) btnAnnYear.innerText = yd.isAnnualYearOpen ? '－' : '＋';
    if (contentAnnYear) contentAnnYear.className = yd.isAnnualYearOpen ? '' : 'hidden';

    const btnAnnMonth = document.getElementById('btn-annual-month');
    const contentAnnMonth = document.getElementById('content-annual-month');
    if (btnAnnMonth) btnAnnMonth.innerText = yd.isAnnualMonthOpen ? '－' : '＋';
    if (contentAnnMonth) contentAnnMonth.className = yd.isAnnualMonthOpen ? '' : 'hidden';

    // テーブル描画
    renderAnnualTable('annual-table-year', yd.annualYear, 'annualYear');
    renderAnnualTable('annual-table-month', yd.annualMonth, 'annualMonth');

    // 月選択タブ
    const tabs = document.getElementById('month-tabs');
    if (tabs) {
        tabs.innerHTML = '';
        for (let i = 1; i <= 12; i++) {
            const d = document.createElement('div');
            d.className = `month-btn ${activeMonth === i ? 'active' : ''}`;
            d.innerText = i + "月";
            d.onclick = () => {
                yd.activeMonth = i;
                if (typeof window.saveData === 'function') window.saveData();
                renderKakeibo();
            };
            tabs.appendChild(d);
        }
    }

    const monthlyTitle = document.getElementById('monthly-header-title');
    if (monthlyTitle) monthlyTitle.innerText = `${activeMonth}月の収支`;

    renderMonthlyBlocks(yd, activeMonth);
}

/**
 * 固定費（年間・月間）テーブルの描画
 */
export function renderAnnualTable(cid, list, key) {
    const data = window.data;
    const c = document.getElementById(cid);
    if (!c) return;

    c.innerHTML = '';
    const t = document.createElement('table');
    t.innerHTML = `<thead>
        <tr>
            <th class="col-date">日付</th>
            <th>内容</th>
            <th class="col-money">金額</th>
            <th class="col-btn"></th>
            <th class="col-btn"></th>
        </tr>
    </thead>`;

    const tb = document.createElement('tbody');
    (list || []).forEach((item, idx) => {
        const tr = document.createElement('tr');

        const tdD = document.createElement('td');
        tdD.appendChild(createInp(item.date, v => {
            data.years[data.currentYear][key][idx].date = v;
            if (typeof window.saveData === 'function') window.saveData(true);
        }, key === 'annualYear' ? 'date' : 'day'));

        const tdT = document.createElement('td');
        tdT.appendChild(createTxt(item.text, v => {
            data.years[data.currentYear][key][idx].text = v;
            if (typeof window.saveData === 'function') window.saveData(true);
        }));

        const tdC = document.createElement('td');
        tdC.appendChild(createMon(item.cost, v => {
            data.years[data.currentYear][key][idx].cost = v;
            if (typeof window.saveData === 'function') window.saveData(true);
        }));

        const tdU = document.createElement('td');
        tdU.innerHTML = idx > 0 ? `<button class="mini-btn btn-up" onclick="moveAnn('${key}',${idx})">▲</button>` : '';

        const tdDk = document.createElement('td');
        tdDk.innerHTML = `<button class="mini-btn btn-del" onclick="delAnn('${key}',${idx})">×</button>`;

        tr.append(tdD, tdT, tdC, tdU, tdDk);
        tb.appendChild(tr);
    });
    t.appendChild(tb);
    c.appendChild(t);
}

/**
 * 月間収支ブロックの描画
 */
export function renderMonthlyBlocks(yd, m) {
    const data = window.data;
    const c = document.getElementById('monthly-container');
    if (!c) return;
    c.innerHTML = '';

    (yd.months[m] || []).forEach((b, bi) => {
        const d = document.createElement('div');
        d.className = 'category-block';
        d.innerHTML = `
            <div class="cat-header">
                <input type="text" class="cat-title-input" value="${b.title}"
                    onchange="data.years[data.currentYear].months[${m}][${bi}].title=this.value;if(typeof window.saveData==='function')window.saveData()">
                <div style="display:flex;gap:5px;">
                    <button class="btn-red" onclick="delBk(${bi},${m})">削除</button>
                    <button class="btn-toggle" onclick="togBk(${bi},${m})">${b.isOpen ? '－' : '＋'}</button>
                </div>
            </div>`;

        if (b.isOpen) {
            const inner = document.createElement('div');
            if (b.type === 'standard') {
                inner.innerHTML = `
                <div class="summary-area">
                    <div class="summary-item"><span class="summary-label">残高</span>
                        <div id="bal-${bi}"></div>
                    </div>
                    <div class="summary-item"><span class="summary-label">入れる額</span>
                        <div id="dep-${bi}"></div>
                    </div>
                </div>`;
                const balBox = inner.querySelector(`#bal-${bi}`);
                const depBox = inner.querySelector(`#dep-${bi}`);
                balBox.appendChild(createMon(b.balance, v => {
                    data.years[data.currentYear].months[m][bi].balance = v;
                    if (typeof window.saveData === 'function') window.saveData();
                }, null, true));
                depBox.appendChild(createMon(b.deposit, v => {
                    data.years[data.currentYear].months[m][bi].deposit = v;
                    if (typeof window.saveData === 'function') window.saveData();
                }, null, true));
            }

            const t = document.createElement('table');
            const theadStr = b.type === 'standard'
                ? `<thead><tr><th class="col-date">日</th><th>内容</th><th class="col-money">予定</th><th class="col-money">確定</th><th class="col-btn"></th><th class="col-btn"></th></tr></thead>`
                : `<thead><tr><th class="col-date">日</th><th>重賞名</th><th class="col-money">入金</th><th class="col-money">払戻</th><th class="col-btn"></th><th class="col-btn"></th></tr></thead>`;
            t.innerHTML = theadStr;

            const tb = document.createElement('tbody');
            (b.items || []).forEach((it, ii) => {
                const tr = document.createElement('tr');
                const tdD = document.createElement('td');
                tdD.appendChild(createInp(it.date, v => {
                    data.years[data.currentYear].months[m][bi].items[ii].date = v;
                    if (typeof window.saveData === 'function') window.saveData();
                }, 'day'));

                const tdN = document.createElement('td');
                tdN.appendChild(createTxt(it.name, v => {
                    data.years[data.currentYear].months[m][bi].items[ii].name = v;
                    if (typeof window.saveData === 'function') window.saveData();
                }));

                tr.append(tdD, tdN);

                if (b.type === 'standard') {
                    tr.appendChild(createMonTd(it.plan, v => {
                        data.years[data.currentYear].months[m][bi].items[ii].plan = v;
                        if (typeof window.saveData === 'function') window.saveData();
                    }, bi, m));
                    tr.appendChild(createMonTd(it.act, v => {
                        data.years[data.currentYear].months[m][bi].items[ii].act = v;
                        if (typeof window.saveData === 'function') window.saveData();
                    }, bi, m));
                } else {
                    tr.appendChild(createMonTd(it.out, v => {
                        data.years[data.currentYear].months[m][bi].items[ii].out = v;
                        if (typeof window.saveData === 'function') window.saveData();
                    }, bi, m));
                    tr.appendChild(createMonTd(it.in, v => {
                        data.years[data.currentYear].months[m][bi].items[ii].in = v;
                        if (typeof window.saveData === 'function') window.saveData();
                    }, bi, m));
                }

                const tdU = document.createElement('td');
                tdU.innerHTML = ii > 0 ? `<button class="mini-btn btn-up" onclick="moveIt(${bi},${ii},${m},'up')">▲</button>` : '';
                const tdDk = document.createElement('td');
                tdDk.innerHTML = `<button class="mini-btn btn-del" onclick="delIt(${bi},${ii},${m})">×</button>`;

                tr.append(tdU, tdDk);
                tb.appendChild(tr);
            });

            // 合計行
            const totalTr = document.createElement('tr');
            totalTr.className = 'total-row';
            totalTr.innerHTML = `<td></td><td class="total-label">合計</td><td><div class="total-val-box" id="t1-${bi}">0</div></td><td><div class="total-val-box" id="t2-${bi}">0</div></td><td colspan="2"></td>`;
            tb.appendChild(totalTr);

            t.appendChild(tb);
            inner.appendChild(t);
            inner.appendChild(createAddRowBtn(() => addIt(bi, m)));
            d.appendChild(inner);

            setTimeout(() => updateTotalDisplay(bi, m), 0);
        }
        c.appendChild(d);
    });
}

// --- パーツ生成ヘルパー群 ---
export function createMonTd(v, cb, bi, m) {
    const td = document.createElement('td');
    td.appendChild(createMon(v, cb, () => updateTotalDisplay(bi, m)));
    return td;
}

export function updateTotalDisplay(bi, m) {
    const data = window.data;
    const b = data.years[data.currentYear].months[m][bi];
    let s1 = 0, s2 = 0;
    (b.items || []).forEach(it => {
        if (b.type === 'standard') {
            s1 += Number(it.plan || 0); s2 += Number(it.act || 0);
        } else {
            s1 += Number(it.out || 0); s2 += Number(it.in || 0);
        }
    });
    const e1 = document.getElementById(`t1-${bi}`), e2 = document.getElementById(`t2-${bi}`);
    if (e1) e1.innerText = formatNum(s1);
    if (e2) e2.innerText = formatNum(s2);
}

export function createInp(v, cb, type) {
    const i = document.createElement('input');
    i.value = v || "";
    if (type === 'date') {
        i.className = "date-input";
        i.onblur = function () {
            this.value = formatDateAnnual(this.value);
            cb(this.value);
        };
    } else {
        i.type = "tel";
        i.className = "day-input";
        i.oninput = function () {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 2);
        };
        i.onblur = function () { cb(this.value); };
    }
    return i;
}

export function createTxt(v, cb) {
    const t = document.createElement('textarea');
    t.className = "kakeibo-text";
    t.value = v || "";
    t.rows = 1;
    t.oninput = function () {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    };
    t.onblur = function () { cb(this.value); };
    setTimeout(() => t.oninput(), 0);
    return t;
}

export function createMon(v, cb, bCb, isBig) {
    const i = document.createElement('input');
    i.type = "tel";
    i.className = isBig ? "summary-input" : "money-input";
    i.value = (v === 0 || v === "0") ? "" : Number(v).toLocaleString();
    i.onfocus = function () { this.value = this.value.replace(/,/g, ''); this.select(); };
    i.onblur = function () {
        let n = parseInt(this.value.replace(/[^0-9\-]/g, '')) || 0;
        // Clamp value between -999,999 and 999,999
        if (n > 999999) n = 999999;
        if (n < -999999) n = -999999;
        cb(n);
        this.value = n ? n.toLocaleString() : "";
        if (bCb) bCb();
    };
    return i;
}

export function createAddRowBtn(fn) {
    const b = document.createElement('button');
    b.className = 'add-row-btn';
    b.innerText = '追加';
    b.onclick = fn;
    return b;
}

// --- 操作関数 ---
export function addAnnualItem(k) {
    const data = window.data;
    const key = k === 'year' ? 'annualYear' : 'annualMonth';
    data.years[data.currentYear][key].push({ date: "", text: "", cost: 0 });
    if (typeof window.saveData === 'function') window.saveData(true);
    renderKakeibo();
}

export function moveAnn(k, idx) {
    const data = window.data;
    const l = data.years[data.currentYear][k];
    if (idx > 0) [l[idx], l[idx - 1]] = [l[idx - 1], l[idx]];
    if (typeof window.saveData === 'function') window.saveData(true);
    renderKakeibo();
}

export function delAnn(k, idx) {
    const data = window.data;
    if (confirm("本当に削除しますか？")) {
        data.years[data.currentYear][k].splice(idx, 1);
        if (typeof window.saveData === 'function') window.saveData(true);
        renderKakeibo();
    }
}

export function toggleAnnualSub(t) {
    const data = window.data;
    if (t === 'year') {
        data.years[data.currentYear].isAnnualYearOpen = !data.years[data.currentYear].isAnnualYearOpen;
    } else {
        data.years[data.currentYear].isAnnualMonthOpen = !data.years[data.currentYear].isAnnualMonthOpen;
    }
    if (typeof window.saveData === 'function') window.saveData();
    renderKakeibo();
}

export function togBk(bi, m) {
    const data = window.data;
    data.years[data.currentYear].months[m][bi].isOpen = !data.years[data.currentYear].months[m][bi].isOpen;
    if (typeof window.saveData === 'function') window.saveData();
    renderKakeibo();
}

export function addCategoryBlock(t) {
    const data = window.data;
    const yd = data.years[data.currentYear];
    const m = yd.activeMonth || 1;
    if (!yd.months[m]) yd.months[m] = [];
    yd.months[m].push({
        type: t, title: t === 'standard' ? 'リスト1' : 'リスト2', isOpen: true, items: [], balance: 0, deposit: 0
    });
    if (typeof window.saveData === 'function') window.saveData();
    renderKakeibo();
}

export function delBk(bi, m) {
    const data = window.data;
    if (confirm("本当に削除しますか？")) {
        data.years[data.currentYear].months[m].splice(bi, 1);
        if (typeof window.saveData === 'function') window.saveData();
        renderKakeibo();
    }
}

export function addIt(bi, m) {
    const data = window.data;
    const targetMonth = m || (data.years[data.currentYear] ? data.years[data.currentYear].activeMonth : 1);
    const months = data.years[data.currentYear].months;
    const b = months[targetMonth][bi];
    if (b) {
        if (!b.items) b.items = [];
        b.items.push(b.type === 'standard' ? { date: "", name: "", plan: 0, act: 0 } : { date: "", name: "", out: 0, in: 0 });
        if (typeof window.saveData === 'function') window.saveData();
    }
    renderKakeibo();
}

export function moveIt(bi, ii, m, dir) {
    const data = window.data;
    const targetMonth = m || data.years[data.currentYear].activeMonth || 1;
    const l = data.years[data.currentYear].months[targetMonth][bi].items;
    if (dir === 'up' && ii > 0) [l[ii], l[ii - 1]] = [l[ii - 1], l[ii]];
    if (typeof window.saveData === 'function') window.saveData();
    renderKakeibo();
}

export function delIt(bi, ii, m) {
    const data = window.data;
    if (confirm("本当に削除しますか？")) {
        const targetMonth = m || data.years[data.currentYear].activeMonth || 1;
        data.years[data.currentYear].months[targetMonth][bi].items.splice(ii, 1);
        if (typeof window.saveData === 'function') window.saveData();
        renderKakeibo();
    }
}

export function changeYear() {
    const data = window.data;
    data.currentYear = document.getElementById('year-select').value;
    renderKakeibo();
}

export function addNewYear() {
    const data = window.data;
    let n = prompt("西暦を入力");
    if (n && !data.years[n]) {
        if (typeof window.createNewYearData === 'function') {
            data.years[n] = window.createNewYearData();
            data.currentYear = n;
            if (typeof window.saveData === 'function') window.saveData();
            renderKakeibo();
        }
    }
}

export function deleteYear() {
    const data = window.data;
    if (Object.keys(data.years).length > 1 && confirm("本当に削除しますか？")) {
        delete data.years[data.currentYear];
        data.currentYear = Object.keys(data.years)[0];
        if (typeof window.saveData === 'function') window.saveData();
        renderKakeibo();
    }
}

// データ管理（バックアップ）
export async function shareDataText() {
    const s = JSON.stringify(window.data);
    if (navigator.share) await navigator.share({ title: '家計簿', text: s });
    else alert(s);
}

export function exportDataToClipboard() {
    navigator.clipboard.writeText(JSON.stringify(window.data));
    alert("コピー完了");
}

export function importDataFromText() {
    try {
        const s = document.getElementById('backup-box').value;
        if (s) {
            window.data = JSON.parse(s);
            if (typeof window.saveData === 'function') window.saveData();
            location.reload();
        }
    } catch (e) { alert("エラー"); }
}

// グローバル登録
window.renderKakeibo = renderKakeibo;
window.addAnnualItem = addAnnualItem;
window.moveAnn = moveAnn;
window.delAnn = delAnn;
window.toggleAnnualSub = toggleAnnualSub;
window.togBk = togBk;
window.addCategoryBlock = addCategoryBlock;
window.delBk = delBk;
window.addIt = addIt;
window.moveIt = moveIt;
window.delIt = delIt;
window.changeYear = changeYear;
window.addNewYear = addNewYear;
window.deleteYear = deleteYear;
window.shareDataText = shareDataText;
window.exportDataToClipboard = exportDataToClipboard;
window.importDataFromText = importDataFromText;
