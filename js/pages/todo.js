import { state, saveDB } from '../services/db.js';
import { renderTodoList } from './todo-render.js';

let editId = null;
export function init() {
    render();
    document.getElementById('btn-todo-add').onclick = () => {
        editId = Date.now().toString();
        state.todos.push({ id: editId, title: "新規タスク", body: "", done: false });
        saveDB({}); openEditor();
    };
    document.getElementById('btn-todo-back').onclick = closeEditor;
    document.getElementById('btn-todo-del').onclick = () => {
        if (confirm("削除?")) {
            state.todos = state.todos.filter(t => t.id !== editId);
            saveDB({}); closeEditor();
        }
    };
    const save = () => {
        const t = state.todos.find(t => t.id === editId);
        if (t) {
            t.title = document.getElementById('todo-edit-title').value;
            t.body = document.getElementById('todo-edit-body').value;
            t.done = document.getElementById('todo-edit-done').checked;
            saveDB({});
        }
    };
    document.querySelector('#todo-editor').onblur = save; // 簡易保存
}

export function openEditor(id) {
    if (id) editId = id;
    const t = state.todos.find(t => t.id === editId);
    document.getElementById('todo-edit-title').value = t.title;
    document.getElementById('todo-edit-body').value = t.body;
    document.getElementById('todo-edit-done').checked = t.done;
    document.getElementById('todo-list-view').classList.add('hidden');
    document.getElementById('todo-editor').classList.remove('hidden');
}

function closeEditor() {
    document.getElementById('todo-editor').classList.add('hidden');
    document.getElementById('todo-list-view').classList.remove('hidden');
    render();
}

function render() { renderTodoList(state, render, openEditor); }
