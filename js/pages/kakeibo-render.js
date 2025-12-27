import { saveDB } from '../services/db.js';
import { formatNum } from './kakeibo-utils.js';
import { renderRow } from './kakeibo-row.js';

/**
 * 収支リスト全体の描画（通帳・財布などのブロック単位）
 */
export function renderList(yd, m, render) {
    const container = document.getElementById('monthly-container');
    container.innerHTML = '';

    (yd.months[m] || []).forEach((block, blockIndex) => {
        const div = document.createElement('div');
        div.className = 'category-block';

        // ヘッダー（タイトル入力欄と－／＋ボタン）
        div.innerHTML = `
            <div class="cat-header">
                <input class="cat-title-input" value="${block.title}" placeholder="内容">
                <button class="btn-toggle">${block.isOpen ? '－' : '＋'}</button>
            </div>`;

        // タイトル変更（5文字幅固定はCSSで対応）
        div.querySelector('.cat-title-input').onchange = (e) => {
            block.title = e.target.value;
            saveDB({});
        };

        // 「－」ボタンを右端固定し、開閉を行う
        const toggleBtn = div.querySelector('.btn-toggle');
        toggleBtn.onclick = () => {
            block.isOpen = !block.isOpen;
            saveDB({}); render();
        };

        if (block.isOpen) {
            drawBlockContent(div, block, render);
        }
        container.appendChild(div);
    });
}

/**
 * ブロックの中身（集計・テーブル）を描画
 */
function drawBlockContent(parent, block, render) {
    // 集計エリア
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

    // テーブル（ヘッダーを「日付」に変更）
    const table = document.createElement('table');
    const isStandard = block.type === 'standard';
    const h = isStandard ?
        `<tr><th class="col-date">日付</th><th class="col-text">内容</th><th class="col-money">予定</th><th class="col-money">確定</th><th class="col-btns"></th></tr>` :
        `<tr><th class="col-date">日付</th><th class="col-text">重賞名</th><th class="col-money">入金</th><th class="col-money">払戻</th><th class="col-btns"></th></tr>`;
    table.innerHTML = `<thead>${h}</thead>`;

    const tbody = document.createElement('tbody');
    let s1 = 0, s2 = 0;
    (block.items || []).forEach((item, ii) => {
        s1 += item.v1 ?? 0; s2 += item.v2 ?? 0;
        renderRow(tbody, block, item, ii, render);
    });

    const ttr = document.createElement('tr');
    ttr.className = 'total-row';
    ttr.innerHTML = `<td></td><td class="total-label">合計</td><td><div class="total-val">${formatNum(s1)}</div></td><td><div class="total-val">${formatNum(s2)}</div></td><td></td>`;

    tbody.appendChild(ttr);
    table.appendChild(tbody);
    parent.appendChild(table);

    const addBtn = document.createElement('button');
    addBtn.className = 'big-btn btn-green add-row-btn';
    addBtn.innerText = '＋ 行を追加';
    addBtn.onclick = () => { block.items.push({ date: "", name: "", v1: 0, v2: 0 }); saveDB({}); render(); };
    parent.appendChild(addBtn);
}
