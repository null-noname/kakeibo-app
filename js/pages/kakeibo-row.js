import { saveDB } from '../services/db.js';
import { formatNum, parseNum, autoHeight } from './kakeibo-utils.js';

/**
 * 収支リストの「1行分」の作成とイベント設定を行う
 * @param {HTMLElement} tbody - 行を追加するテーブルボディ
 * @param {Object} block - 所属するカテゴリデータ
 * @param {Object} item - 行のデータ
 * @param {number} index - 行のインデックス
 * @param {Function} render - 再描画用関数
 */
export function renderRow(tbody, block, item, index, render) {
    const tr = document.createElement('tr');
    const v1 = item.v1 ?? 0;
    const v2 = item.v2 ?? 0;

    // 行のHTML構造 (「日」の文字を削除、ボタンをグループ化)
    tr.innerHTML = `
        <td class="col-date">
            <input class="day-input" value="${item.date || ''}" type="tel" maxlength="2">
        </td>
        <td class="col-text">
            <textarea class="kakeibo-text" rows="1">${item.name || ''}</textarea>
        </td>
        <td class="col-money">
            <input class="money-input" value="${formatNum(v1)}" type="tel">
        </td>
        <td class="col-money">
            <input class="money-input" value="${formatNum(v2)}" type="tel">
        </td>
        <td class="col-btns">
            <div class="row-btn-group">
                <button class="mini-btn btn-up">▲</button>
                <button class="mini-btn btn-del">×</button>
            </div>
        </td>`;

    const ins = tr.querySelectorAll('input, textarea');

    // 日付入力の保存
    ins[0].onblur = (e) => { item.date = e.target.value; saveDB({}); };

    // 内容入力 (自動改行)
    ins[1].oninput = (e) => autoHeight(e.target);
    ins[1].onblur = (e) => { item.name = e.target.value; saveDB({}); };

    // 金額入力 (予定・確定)
    const setVal = (idx, key) => {
        ins[idx].onfocus = (e) => { e.target.value = item[key] ?? 0; };
        ins[idx].onblur = (e) => {
            item[key] = parseNum(e.target.value);
            saveDB({}); render();
        };
    };
    setVal(2, 'v1');
    setVal(3, 'v2');

    // ボタン操作 (並び替え・削除)
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

    // 初期表示時の高さ調整
    setTimeout(() => autoHeight(ins[1]), 0);
    tbody.appendChild(tr);
}
