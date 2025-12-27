import { state, saveDB } from '../services/db.js';
import { renderNav } from './kakeibo-nav.js';
import { renderList } from './kakeibo-render.js';

/**
 * 収支画面の司令塔
 * 全体の初期化と、データ変更時の再描画を管理する
 */
export function init() {
    render();
}

/**
 * 画面全体の再描画
 */
export function render() {
    const data = state;
    const yd = data.years[data.currentYear] || { activeMonth: 1, months: {} };
    if (!yd.months) yd.months = {};
    const m = yd.activeMonth || 1;

    // 1. ナビゲーション（年・月選択）の描画
    renderNav(data, yd, m, () => {
        saveDB({});
        render();
    });

    // 2. メイン見出しの更新（「○月の収支」という文字）
    const titleEl = document.getElementById('monthly-header-title');
    if (titleEl) {
        titleEl.innerText = `${m}月の収支`;
        // 文字色を白にするためのクラスを付与（後のCSSで対応）
        titleEl.className = 'monthly-title-white';
    }

    // 3. 各収支ブロック（リスト）の描画
    renderList(yd, m, render);
}
