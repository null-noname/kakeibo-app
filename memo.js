/**
 * メモ帳機能モジュール (memo.js)
 */

let editingMemoId = null;

/**
 * メモ一覧のレンダリング
 */
export function renderMemoList() {
    const data = window.data;
    const container = document.getElementById('memo-list-container');
    if (!container || !data) return;

    container.innerHTML = '';
    data.freeMemos.forEach((memo) => {
        const div = document.createElement('div');
        div.className = 'memo-card';
        div.innerHTML = `
            <div class="memo-card-header">
                <span class="memo-card-title">${memo.title}</span>
                <div class="memo-ctrl-btns">
                    <button class="btn-edit-mode" onclick="openMemoEditor('${memo.id}')">✐ 編集</button>
                    <button class="btn-up" onclick="moveMemo('${memo.id}','up')">▲</button>
                    <button class="btn-toggle-memo" onclick="toggleMemo('${memo.id}')">${memo.isOpen ? '－' : '＋'}</button>
                </div>
            </div>
            <div class="memo-card-body ${memo.isOpen ? '' : 'collapsed'}">${memo.body}</div>
        `;
        container.appendChild(div);
    });
}

/**
 * 新規メモの追加
 */
export function addNewMemo() {
    const data = window.data;
    if (!data) return;
    const newId = Date.now().toString();
    data.freeMemos.push({ id: newId, title: "新規メモ", body: "", isOpen: true });
    if (typeof window.saveData === 'function') window.saveData();
    openMemoEditor(newId);
}

/**
 * メモの順序移動 (上へ)
 */
export function moveMemo(id, dir) {
    const data = window.data;
    if (!data) return;
    const i = data.freeMemos.findIndex(m => m.id === id);
    if (dir === 'up' && i > 0) {
        [data.freeMemos[i], data.freeMemos[i - 1]] = [data.freeMemos[i - 1], data.freeMemos[i]];
    }
    if (typeof window.saveData === 'function') window.saveData();
    renderMemoList();
}

/**
 * メモの開閉切り替え
 */
export function toggleMemo(id) {
    const data = window.data;
    if (!data) return;
    const m = data.freeMemos.find(m => m.id === id);
    if (m) {
        m.isOpen = !m.isOpen;
        if (typeof window.saveData === 'function') window.saveData();
        renderMemoList();
    }
}

/**
 * メモエディタを開く
 */
export function openMemoEditor(id) {
    const data = window.data;
    if (!data) return;
    editingMemoId = id;
    const m = data.freeMemos.find(m => m.id === id);
    if (!m) return;

    document.getElementById('memo-list-view').style.display = 'none';
    document.getElementById('memo-editor').classList.add('active');
    document.getElementById('memo-edit-title').value = m.title;
    document.getElementById('memo-edit-body').value = m.body;
}

/**
 * メモエディタを閉じる
 */
export function closeMemoEditor() {
    saveCurrentMemo();
    editingMemoId = null;
    document.getElementById('memo-editor').classList.remove('active');
    document.getElementById('memo-list-view').style.display = 'block';
    renderMemoList();
}

/**
 * 現在編集中のメモを保存
 */
export function saveCurrentMemo() {
    const data = window.data;
    if (!data || !editingMemoId) return;
    const m = data.freeMemos.find(m => m.id === editingMemoId);
    if (m) {
        m.title = document.getElementById('memo-edit-title').value;
        m.body = document.getElementById('memo-edit-body').value;
        if (typeof window.saveData === 'function') window.saveData();
    }
}

/**
 * 現在のメモを削除
 */
export function deleteCurrentMemo() {
    const data = window.data;
    if (!data || !editingMemoId) return;
    if (confirm("削除？")) {
        data.freeMemos = data.freeMemos.filter(m => m.id !== editingMemoId);
        if (typeof window.saveData === 'function') window.saveData();
        closeMemoEditor();
    }
}

// グローバル登録
window.renderMemoList = renderMemoList;
window.addNewMemo = addNewMemo;
window.moveMemo = moveMemo;
window.toggleMemo = toggleMemo;
window.openMemoEditor = openMemoEditor;
window.closeMemoEditor = closeMemoEditor;
window.saveCurrentMemo = saveCurrentMemo;
window.deleteCurrentMemo = deleteCurrentMemo;
