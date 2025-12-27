import { saveDB } from '../services/db.js';
import { formatNum } from './kakeibo-utils.js';
import { renderRow } from './kakeibo-row.js';

/**
 * カテゴリーブロック全体の描画（集計エリア・テーブル・追加ボタン）
 */
export function renderBlock(parent, block, blockIndex, activeMonth, render) {
    // 1. 集計エリア（通帳などの残高・入金）
    if (block.type === 'standard') {
        const s = document.createElement('div');
        s.className = 'summary-area';
        s.innerHTML = `
            <div class="summary-item"><span class="summary-label">残高</span><input class="summary-input" type="tel"></div>
            <div class="summary-item"><span class="summary-label">入金</span><input class="summary-input" type="tel"></div>`;
        const ins = s.querySelectorAll('input');
        const setup = (el, key) => {
            el.value = (block[key] || 0).toLocaleString();
            el.onfocus = (e) => e.target.value = block[key] || "";
            el.onblur = (e) => { block[key] = parseInt(e.target.value.replace(/[^0-9\-]/g, '')) || 0; saveDB({}); render(); };
        };
        setup(ins[0], 'balance');
        setup(ins[1], 'deposit');
        parent.appendChild(s);
    }

    // 2. テーブル（「日」→「日付」に変更）
    const table = document.createElement('table');
    const isStandard = block.type === 'standard';
    const headerHtml = isStandard ?
        `<tr><th class="col-date">日付</th><th class="col-text">内容</th><th class="col-money">予定</th><th class="col-money">確定</th><th class="col-btns"></th></tr>` :
        `<tr><th class="col-date">日付</th><th class="col-text">重賞名</th><th class="col-money">入金</th><th class="col-money">払戻</th><th class="col-btns"></th></tr>`;

    table.innerHTML = `<thead>${headerHtml}</thead>`;
    const tbody = document.createElement('tbody');
    let sum1 = 0, sum2 = 0;

    (block.items || []).forEach((item, itemIndex) => {
        const v1 = item.v1 ?? (item.plan || item.out || 0);
        const v2 = item.v2 ?? (item.act || item.in || 0);
        sum1 += v1; sum2 += v2;
        renderRow(tbody, block, item, itemIndex, render);
    });

    // 合計行
    const ttr = document.createElement('tr');
    ttr.className = 'total-row';
    ttr.innerHTML = `<td></td><td class="total-label">合計</td>
        <td><div class="total-val-box">${formatNum(sum1)}</div></td>
        <td><div class="total-val-box">${formatNum(sum2)}</div></td><td></td>`;
    tbody.appendChild(ttr);
    table.appendChild(tbody);
    parent.appendChild(table);

    // 3. 行追加ボタン
    const addBtn = document.createElement('button');
    addBtn.className = 'big-btn btn-green add-row-btn';
    addBtn.innerText = '＋ 行を追加';
    addBtn.onclick = () => {
        block.items.push({ date: "", name: "", v1: 0, v2: 0 });
        saveDB({}); render();
    };
    parent.appendChild(addBtn);
}
