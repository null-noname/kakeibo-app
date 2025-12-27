import { state, saveDB } from '../services/db.js';
import { renderBlock } from './kakeibo-render.js';

/**
 * 収支画面のメイン制御（イベント設定、年・月選択、全体描画）
 */
export function init() {
    render();
    const getEl = id => document.getElementById(id);

    // 年の切り替え
    getEl('year-select').onchange = (e) => {
        state.currentYear = e.target.value;
        render();
    };

    // 年の追加
    getEl('btn-year-add').onclick = () => {
        const n = prompt("西暦を入力");
        if (n && !state.years[n]) {
            state.years[n] = { months: {} };
            state.currentYear = n;
            saveDB({}); render();
        }
    };

    // 年の削除
    getEl('btn-year-del').onclick = () => {
        if (Object.keys(state.years).length > 1 && confirm("削除しますか?")) {
            delete state.years[state.currentYear];
            state.currentYear = Object.keys(state.years)[0];
            saveDB({}); render();
        }
    };

    // カテゴリの追加
    getEl('btn-add-cat1').onclick = () => addBlock('standard');
    getEl('btn-add-cat2').onclick = () => addBlock('detail');
}

function render() {
    const data = state;
    const sel = document.getElementById('year-select');
    const yd = data.years[data.currentYear] || { activeMonth: 1, months: {} };
    if (!yd.months) yd.months = {};
    const m = yd.activeMonth || 1;

    // 年選択の更新
    sel.innerHTML = Object.keys(data.years).sort().map(y =>
        `<option value="${y}" ${y == data.currentYear ? 'selected' : ''}>${y}年</option>`
    ).join('');

    // 月タブの更新
    const tabs = document.getElementById('month-tabs');
    tabs.innerHTML = [...Array(12)].map((_, i) =>
        `<div class="month-btn ${m == i + 1 ? 'active' : ''}">${i + 1}月</div>`
    ).join('');

    [...tabs.children].forEach((b, i) => {
        b.onclick = () => { yd.activeMonth = i + 1; saveDB({}); render(); };
    });

    document.getElementById('monthly-header-title').innerText = `${m}月の収支`;

    // 各ブロック（通帳・財布など）の描画
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

        div.querySelector('.cat-title-input').onchange = (e) => {
            b.title = e.target.value;
            saveDB({});
        };

        div.querySelector('.btn-toggle').onclick = () => {
            b.isOpen = !b.isOpen;
            saveDB({}); render();
        };

        if (b.isOpen) {
            renderBlock(div, b, bi, m, render);
        }
        container.appendChild(div);
    });
}

function addBlock(type) {
    const yd = state.years[state.currentYear];
    const m = yd.activeMonth || 1;
    yd.months[m] = yd.months[m] || [];
    const title = type === 'standard' ? '新しいリスト' : '競馬リスト';
    yd.months[m].push({ type, title, isOpen: true, items: [] });
    saveDB({}); render();
}
