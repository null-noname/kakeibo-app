import { saveDB } from '../services/db.js';

export function renderMemoList(st, redo, openEd) {
    const c = document.getElementById('memo-list-container');
    c.innerHTML = '';
    st.freeMemos.forEach((m, i) => {
        const d = document.createElement('div');
        d.className = 'memo-card';
        d.innerHTML = `
            <div class="memo-card-header">
                <span class="memo-card-title">${m.title || "無題"}</span>
                <div class="memo-ctrl-btns">
                    <button class="mini-btn" id="m-up-${i}">↑</button>
                    <button class="mini-btn" id="m-ed-${i}">✎</button>
                </div>
            </div>
            <div class="memo-card-body ${m.isOpen ? '' : 'collapsed'}" id="m-body-${i}">${m.body || ""}</div>`;
        d.querySelector(`#m-up-${i}`).onclick = (e) => {
            e.stopPropagation();
            if (i > 0) { [st.freeMemos[i], st.freeMemos[i - 1]] = [st.freeMemos[i - 1], st.freeMemos[i]]; saveDB({}); redo(); }
        };
        d.querySelector(`#m-ed-${i}`).onclick = (e) => { e.stopPropagation(); openEd(m.id); };
        d.onclick = () => { m.isOpen = !m.isOpen; saveDB({}); redo(); };
        c.appendChild(d);
    });
}
