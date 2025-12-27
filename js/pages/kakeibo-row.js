import { saveDB } from '../services/db.js';
import { formatNum, parseNum, autoHeight } from './kakeibo-utils.js';

/**
 * 収支リストの「1行分」の描画とイベント設定
 */
export function renderRow(tbody, block, item, index, render) {
    const tr = document.createElement('tr');

    // 日付を「【12】日」の形式で表示するための装飾用枠をHTMLに含める
    // 入力欄(input)からは「日」やプレースホルダーを完全に削除
    tr.innerHTML = `
        <td class="col-date">
            <div class="day-input-wrapper">
                <span class="day-bracket">【</span>
                <input class="day-input" value="${item.date || ''}" type="tel" maxlength="2">
                <span class="day-suffix">】日</span>
            </div>
        </td>
        <td class="col-text">
            <textarea class="kakeibo-text" rows="1">${item.name || ''}</textarea>
        </td>
        <td class="col-money">
            <input class="money-input" value="${formatNum(item.v1 ?? 0)}" type="tel">
        </td>
        <td class="col-money">
            <input class="money-input" value="${formatNum(item.v2 ?? 0)}" type="tel">
        </td>
        <td class="col-btns">
            <div class="row-btn-group">
                <button class="mini-btn btn-up">▲</button>
                <button class="mini-btn btn-del">×</button>
            </div>
        </td>`;

    const ins = tr.querySelectorAll('input, textarea');

    // 日付保存
    ins[0].onblur = (e) => { item.date = e.target.value; saveDB({}); };

    // 内容入力 (自動高さ調整)
    ins[1].oninput = (e) => autoHeight(e.target);
    ins[1].onblur = (e) => { item.name = e.target.value; saveDB({}); };

    // 金額入力設定
    const setVal = (idx, key) => {
        ins[idx].onfocus = (e) => { e.target.value = item[key] ?? 0; };
        ins[idx].onblur = (e) => {
            item[key] = parseNum(e.target.value);
            saveDB({}); render();
        };
    };
    setVal(2, 'v1');
    setVal(3, 'v2');

    // ボタンイベント
    const bts = tr.querySelectorAll('button');
    bts[0].onclick = () => {
        if (index > 0) {
            [block.items[index], block.items[index - 1]] = [block.items[index - 1], block.items[index]];
            saveDB({}); render();
        }
    };
    bts[1].onclick = () => {
        if (confirm("この行を削除しますか？")) {
            block.items.splice(index, 1);
            saveDB({}); render();
        }
    };

    setTimeout(() => autoHeight(ins[1]), 0);
    tbody.appendChild(tr);
}
