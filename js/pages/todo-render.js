import { saveDB } from '../services/db.js';

export function renderTodoList(st, redo, openEd) {
    const c = document.getElementById('todo-list-container');
    c.innerHTML = '';
    st.todos.forEach((t, i) => {
        const d = document.createElement('div');
        d.className = 'todo-card';
        d.innerHTML = `
            <input type="checkbox" class="todo-check" ${t.done ? 'checked' : ''}>
            <div class="todo-info">
                <div class="todo-title ${t.done ? 'done' : ''}">${t.title || "無題"}</div>
                <div class="todo-body-preview">${t.body || ""}</div>
            </div>
            <div class="todo-btns">
                <button class="mini-btn" id="t-up-${i}">▲</button>
                <button class="mini-btn" id="t-dn-${i}">▼</button>
                <button class="mini-btn" id="t-ed-${i}">✎</button>
            </div>`;
        d.querySelector('.todo-check').onclick = (e) => { t.done = e.target.checked; saveDB({}); redo(); };
        const move = (dir) => {
            const j = i + dir;
            if (j >= 0 && j < st.todos.length) {
                [st.todos[i], st.todos[j]] = [st.todos[j], st.todos[i]];
                saveDB({}); redo();
            }
        };
        d.querySelector(`#t-up-${i}`).onclick = () => move(-1);
        d.querySelector(`#t-dn-${i}`).onclick = () => move(1);
        d.querySelector(`#t-ed-${i}`).onclick = () => openEd(t.id);
        c.appendChild(d);
    });
}
