import { state, saveDB } from '../services/db.js';
import { renderMemoList } from './memo-render.js';

let editId = null;
export function init() {
    render();
    document.getElementById('btn-memo-add').onclick = () => {
        editId = Date.now().toString();
        state.freeMemos.push({ id: editId, title: "新規メモ", body: "", isOpen: true });
        saveDB({}); openEditor();
    };
    document.getElementById('btn-memo-back').onclick = closeEditor;
    document.getElementById('btn-memo-del').onclick = () => {
        if (confirm("削除?")) {
            state.freeMemos = state.freeMemos.filter(m => m.id !== editId);
            saveDB({}); closeEditor();
        }
    };
    const save = () => {
        const m = state.freeMemos.find(m => m.id === editId);
        if (m) {
            m.title = document.getElementById('memo-edit-title').value;
            m.body = document.getElementById('memo-edit-body').value;
            saveDB({});
        }
    };
    document.getElementById('memo-edit-title').onblur = save;
    document.getElementById('memo-edit-body').onblur = save;
}

export function openEditor(id) {
    if (id) editId = id;
    const m = state.freeMemos.find(m => m.id === editId);
    document.getElementById('memo-edit-title').value = m.title;
    document.getElementById('memo-edit-body').value = m.body;
    document.getElementById('memo-list-view').classList.add('hidden');
    document.getElementById('memo-editor').classList.remove('hidden');
}

function closeEditor() {
    document.getElementById('memo-editor').classList.add('hidden');
    document.getElementById('memo-list-view').classList.remove('hidden');
    render();
}

function render() { renderMemoList(state, render, openEditor); }
