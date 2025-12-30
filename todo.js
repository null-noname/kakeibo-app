/**
 * ToDo機能モジュール (todo.js)
 */

let editingTodoId = null;

/**
 * ToDo一覧のレンダリング
 */
export function renderTodoList() {
    const data = window.data;
    const container = document.getElementById('todo-list-container');
    if (!container || !data) return;

    if (!data.todos) data.todos = [];

    container.innerHTML = '';
    data.todos.forEach((todo) => {
        const div = document.createElement('div');
        div.className = 'memo-card';
        div.innerHTML = `
            <div class="memo-card-header">
                <span class="memo-card-title">${todo.title}</span>
                <div class="memo-ctrl-btns">
                    <button class="btn-edit-mode" onclick="openTodoEditor('${todo.id}')">✐ 編集</button>
                    <button class="btn-up" onclick="moveTodo('${todo.id}','up')">▲</button>
                    <button class="btn-toggle-memo" onclick="toggleTodo('${todo.id}')">${todo.isOpen ? '－' : '＋'}</button>
                </div>
            </div>
            <div class="memo-card-body ${todo.isOpen ? "" : "collapsed"}">
                ${(todo.items || []).map(it => `<div style="display:flex; align-items:center; gap:5px; margin-bottom:3px;">
                    <span>${it.done ? "✅" : "⬜"}</span>
                    <span style="${it.done ? 'text-decoration:line-through; color:#888;' : ''}">${it.text}</span>
                </div>`).join("")}
            </div>
        `;
        container.appendChild(div);
    });
}

/**
 * 新規ToDoの追加
 */
export function addNewTodo() {
    const data = window.data;
    if (!data) return;
    if (!data.todos) data.todos = [];

    const newId = Date.now().toString();
    data.todos.push({
        id: newId,
        title: "新規ToDo",
        isOpen: true,
        items: [{ text: "", done: false }]
    });

    if (typeof window.saveData === 'function') window.saveData();
    openTodoEditor(newId);
}

/**
 * リスト表示とエディタの表示切り替え
 * @param {boolean} showEditor - エディタを表示するかどうか
 */
function toggleEditorUI(showEditor) {
    const listView = document.getElementById('todo-list-view');
    const editorView = document.getElementById('todo-editor');
    if (listView && editorView) {
        listView.style.display = showEditor ? 'none' : 'block';
        editorView.style.display = showEditor ? 'block' : 'none';
    }
}

/**
 * 編集画面を開く
 */
export function openTodoEditor(id) {
    const data = window.data;
    if (!data || !data.todos) return;

    editingTodoId = id;
    const todo = data.todos.find(t => t.id === id);
    if (!todo) return;

    toggleEditorUI(true);
    document.getElementById('todo-edit-title').value = todo.title;
    renderTodoItems();
}

/**
 * エディタ内の項目リストをレンダリング
 */
export function renderTodoItems() {
    const data = window.data;
    const listContainer = document.getElementById('todo-items-list');
    if (!data || !editingTodoId || !listContainer) return;

    const todo = data.todos.find(t => t.id === editingTodoId);
    if (!todo) return;

    listContainer.innerHTML = '';
    (todo.items || []).forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'todo-item-row';

        itemDiv.innerHTML = `
            <input type="checkbox" class="todo-check" ${item.done ? 'checked' : ''} onchange="updateItemDone(${index}, this.checked)">
            <textarea class="todo-item-input ${item.done ? 'done' : ''}" 
                      onblur="updateItemText(${index}, this.value)" 
                      oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'"
                      placeholder="内容を入力..." rows="1">${item.text}</textarea>
            <button class="btn-red" style="padding:5px 10px; flex-shrink:0;" onclick="deleteTodoItem(${index})">×</button>
        `;
        listContainer.appendChild(itemDiv);

        // 初期高さ調整
        const ta = itemDiv.querySelector('textarea');
        setTimeout(() => {
            ta.style.height = 'auto';
            ta.style.height = ta.scrollHeight + 'px';
        }, 0);
    });
}

/**
 * 項目の完了状態を更新
 */
window.updateItemDone = (index, done) => {
    const data = window.data;
    const todo = data.todos.find(t => t.id === editingTodoId);
    if (todo && todo.items[index]) {
        todo.items[index].done = done;
        saveCurrentTodo();
    }
};

/**
 * 項目のテキストを更新
 */
window.updateItemText = (index, text) => {
    const data = window.data;
    const todo = data.todos.find(t => t.id === editingTodoId);
    if (todo && todo.items[index]) {
        todo.items[index].text = text;
        saveCurrentTodo();
    }
};

/**
 * 新しい項目を1行追加
 */
export function addTodoItem() {
    const data = window.data;
    const todo = data.todos.find(t => t.id === editingTodoId);
    if (todo) {
        if (!todo.items) todo.items = [];
        todo.items.push({ text: "", done: false });
        saveCurrentTodo();
        renderTodoItems();
    }
}

/**
 * 特定の項目を削除
 */
export function deleteTodoItem(index) {
    const data = window.data;
    const todo = data.todos.find(t => t.id === editingTodoId);
    if (todo && todo.items) {
        todo.items.splice(index, 1);
        saveCurrentTodo();
        renderTodoItems();
    }
}

/**
 * エディタを閉じる
 */
export function closeTodoEditor() {
    saveCurrentTodo();
    editingTodoId = null;
    toggleEditorUI(false);
    renderTodoList();
}

/**
 * 現在のToDo全体を保存
 */
export function saveCurrentTodo() {
    const data = window.data;
    if (!data || !editingTodoId) return;

    const todo = data.todos.find(t => t.id === editingTodoId);
    if (todo) {
        const titleInput = document.getElementById('todo-edit-title');
        if (titleInput) todo.title = titleInput.value;
        if (typeof window.saveData === 'function') window.saveData();
    }
}

/**
 * 現在のToDo全体を削除
 */
export function deleteCurrentTodo() {
    const data = window.data;
    if (!data || !editingTodoId) return;

    if (confirm("本当に削除しますか？")) {
        data.todos = data.todos.filter(t => t.id !== editingTodoId);
        if (typeof window.saveData === 'function') window.saveData();
        closeTodoEditor();
    }
}

/**
 * ToDoの順序移動
 */
export function moveTodo(id, dir) {
    const data = window.data;
    if (!data || !data.todos) return;
    const i = data.todos.findIndex(t => t.id === id);
    if (dir === 'up' && i > 0) {
        [data.todos[i], data.todos[i - 1]] = [data.todos[i - 1], data.todos[i]];
    }
    if (typeof window.saveData === 'function') window.saveData();
    renderTodoList();
}

/**
 * ToDoの開閉切り替え
 */
export function toggleTodo(id) {
    const data = window.data;
    if (!data || !data.todos) return;
    const t = data.todos.find(t => t.id === id);
    if (t) {
        t.isOpen = !t.isOpen;
        if (typeof window.saveData === 'function') window.saveData();
        renderTodoList();
    }
}

// グローバル登録 (外部HTMLおよび onclick からの呼び出し用)
window.renderTodoList = renderTodoList;
window.addNewTodo = addNewTodo;
window.openTodoEditor = openTodoEditor;
window.closeTodoEditor = closeTodoEditor;
window.addTodoItem = addTodoItem;
window.deleteTodoItem = deleteTodoItem;
window.saveCurrentTodo = saveCurrentTodo;
window.deleteCurrentTodo = deleteCurrentTodo;
window.toggleTodo = toggleTodo;
window.renderTodoItems = renderTodoItems;
window.moveTodo = moveTodo;
