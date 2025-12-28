/**
 * UI制御モジュール (ui.js)
 */

/**
 * ビュー（タブ）の切り替え
 * @param {string} viewName - 切り替え先のビュー名
 */
export function switchView(viewName) {
    // メモエディタが開いている場合は閉じる (index.html側の関数に依存する場合、グローバル経由で呼び出し)
    if (viewName !== 'memo') {
        if (typeof window.closeMemoEditor === 'function') {
            window.closeMemoEditor();
        }
    }

    // 全タブ・セクションから active クラスを削除
    ['memo', 'fixed', 'kakeibo', 'save', 'todo'].forEach(v => {
        const tab = document.getElementById(`tab-${v}`);
        const sec = document.getElementById(`view-${v}`);
        if (tab) tab.classList.remove('active');
        if (sec) sec.classList.remove('active');
    });

    // 選択されたタブ・セクションに active クラスを追加
    const activeTab = document.getElementById(`tab-${viewName}`);
    const activeSec = document.getElementById(`view-${viewName}`);
    if (activeTab) activeTab.classList.add('active');
    if (activeSec) activeSec.classList.add('active');

    // 状態の保存 (index.html側の data オブジェクトに依存)
    if (window.data) {
        window.data.lastViewedTab = viewName;
    }

    // 各ビュー固有のレンダリング処理
    if (viewName === 'kakeibo' || viewName === 'fixed') {
        if (typeof window.renderKakeibo === 'function') window.renderKakeibo();
    }
    if (viewName === 'memo') {
        if (typeof window.renderMemoList === 'function') window.renderMemoList();
    }

    // データ保存
    if (typeof window.saveData === 'function') {
        window.saveData();
    }
}

// グローバル登録
window.switchView = switchView;
