// Firebase初期化 (V8.11ロジック完全維持)
const firebaseConfig = { apiKey: "AIzaSyCT_VvEPzGCPRLLFnzQuwArsYn2JnUR_fg", authDomain: "kakeibo-app-92bb4.firebaseapp.com", databaseURL: "https://kakeibo-app-92bb4-default-rtdb.firebaseio.com", projectId: "kakeibo-app-92bb4", storageBucket: "kakeibo-app-92bb4.firebasestorage.app", messagingSenderId: "45651637804", appId: "1:45651637804:web:f30ba95891d28538a14389" };
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(); const db = firebase.database(); let dbRef = null;
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

const initialData = { currentYear: "2025", lastViewedTab: "memo", years: { "2025": createNewYear() }, freeMemos: [], todos: [] };
let data = JSON.parse(JSON.stringify(initialData));
let isDataLoaded = false; let editMid = null; let editTid = null;

auth.onAuthStateChanged(user => {
    if (user) { dbRef = db.ref('kakeiboData'); init(); }
    else { document.getElementById('login-screen').style.display = 'flex'; document.getElementById('main-app').style.display = 'none'; }
});

async function loginWithGoogle() { try { await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider().setCustomParameters({ prompt: 'select_account' })); } catch (e) { alert(e); } }
function logout() { if (confirm("ログアウト？")) auth.signOut().then(() => location.reload()); }

function init() {
    dbRef.on('value', snap => {
        const v = snap.val(); if (v) { data = v; if (!data.years) data = JSON.parse(JSON.stringify(initialData)); if (!data.todos) data.todos = []; }
        isDataLoaded = true;
        switchView(data.lastViewedTab || 'memo');
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        const s = document.getElementById('sync-status'); s.innerText = "● 同期完了"; setTimeout(() => s.innerText = "", 2000);
    });
}

function save(syncAn = false) {
    if (!isDataLoaded || !dbRef) return;
    if (syncAn) {
        const cur = data.years[data.currentYear];
        Object.keys(data.years).forEach(y => { if (y !== data.currentYear) { data.years[y].annualYear = JSON.parse(JSON.stringify(cur.annualYear)); data.years[y].annualMonth = JSON.parse(JSON.stringify(cur.annualMonth)); } });
    }
    dbRef.set(data); localStorage.setItem('kakeibo_bak', JSON.stringify(data));
    document.getElementById('sync-status').innerText = "▲ 送信中..."; // ↑を▲に変更
}

function createNewYear() {
    let ms = {}; for (let i = 1; i <= 12; i++) ms[i] = [{ type: "standard", title: "通帳", isOpen: true, items: [], balance: 0, deposit: 0 }, { type: "standard", title: "財布", isOpen: true, items: [], balance: 0, deposit: 0 }, { type: "detail", title: "競馬", isOpen: true, items: [] }];
    return { annualYear: [], annualMonth: [], isAYOpen: true, isAMOpen: true, activeMonth: 1, months: ms };
}

window.switchView = (v) => {
    data.lastViewedTab = v;
    ['memo', 'kakeibo', 'todo', 'fixed', 'save'].forEach(id => {
        const t = document.getElementById(`tab-${id}`), s = document.getElementById(`view-${id}`);
        if (t) t.classList.toggle('active', id === v); if (s) s.classList.toggle('active', id === v);
    });
    if (v === 'memo') renderM(); if (v === 'todo') renderT(); if (v === 'kakeibo' || v === 'fixed') renderK();
    save();
};

// --- メモロジック ---
function renderM() {
    const c = document.getElementById('memo-list-container'); c.innerHTML = '';
    data.freeMemos.forEach(m => {
        const d = document.createElement('div'); d.className = 'memo-card';
        d.innerHTML = `<div class="memo-card-header"><span class="memo-card-title">${m.title}</span><div class="memo-ctrl-btns">
            <button class="btn-edit-mode" onclick="openE('${m.id}')">✐ 編集</button>
            <button class="btn-icon" onclick="moveM('${m.id}')">▲</button>
            <button class="btn-toggle-memo" onclick="togM('${m.id}')">${m.isOpen ? '－' : '＋'}</button>
        </div></div><div class="memo-card-body ${m.isOpen ? '' : 'collapsed'}">${m.body}</div>`;
        c.appendChild(d);
    });
}
window.addNewMemo = () => { const id = Date.now().toString(); data.freeMemos.push({ id, title: "新規メモ", body: "", isOpen: true }); save(); openE(id); };
window.openE = id => { editMid = id; const m = data.freeMemos.find(x => x.id === id); document.getElementById('memo-list-view').classList.add('hidden'); document.getElementById('memo-editor').classList.add('active'); document.getElementById('memo-edit-title').value = m.title; document.getElementById('memo-edit-body').value = m.body; };
window.closeMemoEditor = () => { saveE(); editMid = null; document.getElementById('memo-editor').classList.remove('active'); document.getElementById('memo-list-view').classList.remove('hidden'); renderM(); };
window.saveE = () => { if (!editMid) return; const m = data.freeMemos.find(x => x.id === editMid); m.title = document.getElementById('memo-edit-title').value; m.body = document.getElementById('memo-edit-body').value; save(); };
window.deleteCurrentMemo = () => { if (confirm("消す？")) { data.freeMemos = data.freeMemos.filter(x => x.id !== editMid); save(); closeMemoEditor(); } };
window.moveM = id => { const i = data.freeMemos.findIndex(x => x.id === id); if (i > 0) [data.freeMemos[i], data.freeMemos[i - 1]] = [data.freeMemos[i - 1], data.freeMemos[i]]; save(); renderM(); };
window.togM = id => { const m = data.freeMemos.find(x => x.id === id); m.isOpen = !m.isOpen; save(); renderM(); };

// --- ToDoロジック ---
function renderT() {
    const c = document.getElementById('todo-list-container'); c.innerHTML = '';
    data.todos.forEach(t => {
        const d = document.createElement('div'); d.className = 'memo-card';
        const lines = (t.items || []).slice(0, 2).map(i => `<div style="font-size:0.9em; ${i.done ? 'text-decoration:line-through;color:#888' : ''}">${i.done ? '☑' : '☐'} ${i.text}</div>`).join('');
        d.innerHTML = `<div class="memo-card-header"><span class="memo-card-title">${t.title}</span><div class="memo-ctrl-btns">
            <button class="btn-edit-mode" onclick="openTE('${t.id}')">✐ 編集</button>
            <button class="btn-icon" onclick="moveT('${t.id}')">▲</button>
            <button class="btn-toggle-memo" onclick="togT('${t.id}')">${t.isOpen ? '－' : '＋'}</button>
        </div></div><div class="memo-card-body ${t.isOpen ? '' : 'collapsed'}">${lines || 'タスクなし'}</div>`;
        c.appendChild(d);
    });
}
window.addNewTodo = () => { const id = Date.now().toString(); data.todos.push({ id, title: "新規ToDo", items: [], isOpen: true }); save(); openTE(id); };
window.openTE = id => { editTid = id; const t = data.todos.find(x => x.id === id); document.getElementById('todo-editor').classList.add('active'); document.getElementById('todo-edit-title').value = t.title; renderTI(); };
window.closeTodoEditor = () => { saveTE(); editTid = null; document.getElementById('todo-editor').classList.remove('active'); renderT(); };
window.saveTE = () => { if (!editTid) return; const t = data.todos.find(x => x.id === editTid); t.title = document.getElementById('todo-edit-title').value; save(); };
function renderTI() {
    const c = document.getElementById('todo-items-list'); c.innerHTML = '';
    const t = data.todos.find(x => x.id === editTid);
    (t.items || []).forEach((item, idx) => {
        const d = document.createElement('div'); d.className = 'todo-edit-item';
        d.innerHTML = `<div class="todo-check-wrapper"><input type="checkbox" ${item.done ? 'checked' : ''} onchange="togTI(${idx})"><div class="todo-checkmark" onclick="this.previousElementSibling.click()"></div></div>
        <input type="text" class="todo-input ${item.done ? 'completed' : ''}" value="${item.text}" onblur="editTI(${idx}, this.value)">
        <button class="mini-btn btn-del" onclick="delTI(${idx})">×</button>`;
        c.appendChild(d);
    });
}
window.addTodoItem = () => { const t = data.todos.find(x => x.id === editTid); if (!t.items) t.items = []; t.items.push({ text: "", done: false }); renderTI(); };
window.togTI = idx => { const t = data.todos.find(x => x.id === editTid); t.items[idx].done = !t.items[idx].done; save(); renderTI(); };
window.editTI = (idx, v) => { const t = data.todos.find(x => x.id === editTid); t.items[idx].text = v; save(); };
window.delTI = idx => { const t = data.todos.find(x => x.id === editTid); t.items.splice(idx, 1); save(); renderTI(); };
window.deleteCurrentTodo = () => { if (confirm("消す？")) { data.todos = data.todos.filter(x => x.id !== editTid); save(); closeTodoEditor(); } };
window.moveT = id => { const i = data.todos.findIndex(x => x.id === id); if (i > 0) [data.todos[i], data.todos[i - 1]] = [data.todos[i - 1], data.todos[i]]; save(); renderT(); };
window.togT = id => { const m = data.todos.find(x => x.id === id); m.isOpen = !m.isOpen; save(); renderT(); };

// --- 収支ロジック ---
function renderK() {
    const ys = document.getElementById('year-select'); if (!ys) return; ys.innerHTML = '';
    Object.keys(data.years).sort().forEach(y => { const o = document.createElement('option'); o.value = y; o.innerText = y + "年"; if (y === data.currentYear) o.selected = true; ys.appendChild(o); });
    const yd = data.years[data.currentYear]; const am = yd.activeMonth || 1;
    document.getElementById('fix-btn-year').innerText = yd.isAYOpen ? '－' : '＋'; document.getElementById('fix-box-year').className = yd.isAYOpen ? '' : 'hidden';
    document.getElementById('fix-btn-month').innerText = yd.isAMOpen ? '－' : '＋'; document.getElementById('fix-box-month').className = yd.isAMOpen ? '' : 'hidden';
    renderTable('fix-table-year', yd.annualYear, 'annualYear'); renderTable('fix-table-month', yd.annualMonth, 'annualMonth');
    const ts = document.getElementById('month-tabs'); ts.innerHTML = '';
    for (let i = 1; i <= 12; i++) { const d = document.createElement('div'); d.className = `month-btn ${am === i ? 'active' : ''}`; d.innerText = i + "月"; d.style = "padding:12px 18px;color:#888;border-right:1px solid #222;cursor:pointer"; if (am === i) d.style.background = "#2e7d32", d.style.color = "#fff", d.style.fontWeight = "bold", d.style.border = "1px solid #fff"; d.onclick = () => { yd.activeMonth = i; save(); renderK(); }; ts.appendChild(d); }
    document.getElementById('monthly-header-title').innerText = `${am}月の収支`; renderB(yd, am);
}
function renderTable(cid, list, key) {
    const c = document.getElementById(cid); if (!c) return; c.innerHTML = ''; const t = document.createElement('table');
    t.innerHTML = `<thead><tr><th class="col-date"></th><th>名称</th><th class="col-money">金額</th><th class="col-btn"></th></tr></thead>`;
    const tb = document.createElement('tbody');
    (list || []).forEach((it, idx) => {
        const tr = document.createElement('tr');
        const tdD = document.createElement('td'); tdD.appendChild(createI(it.date, v => { data.years[data.currentYear][key][idx].date = v; save(true); }, key === 'annualYear' ? 'date' : 'day'));
        const tdT = document.createElement('td'); tdT.appendChild(createT(it.text, v => { data.years[data.currentYear][key][idx].text = v; save(true); }));
        const tdC = document.createElement('td'); tdC.appendChild(createM(it.cost, v => { data.years[data.currentYear][key][idx].cost = v; save(true); }));
        const tdCtl = document.createElement('td'); tdCtl.innerHTML = `<div class="ctrl-container">${idx > 0 ? `<button class="mini-btn btn-up" onclick="moveA('${key}',${idx})">▲</button>` : ''}<button class="mini-btn btn-del" onclick="delA('${key}',${idx})">×</button></div>`;
        tr.append(tdD, tdT, tdC, tdCtl); tb.appendChild(tr);
    });
    t.appendChild(tb); c.appendChild(t);
}
function renderB(yd, m) {
    const c = document.getElementById('monthly-container'); if (!c) return; c.innerHTML = '';
    (yd.months[m] || []).forEach((b, bi) => {
        const d = document.createElement('div'); d.className = 'category-block'; d.style = "background:#1e1e1e;padding:10px;margin-bottom:20px;border-radius:5px;border:1px solid #333";
        d.innerHTML = `<div class="cat-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><input type="text" class="cat-title-input" value="${b.title}" onchange="data.years[data.currentYear].months[${m}][${bi}].title=this.value;save()" style="width:120px;font-weight:bold;color:#fff;"><div style="display:flex;gap:5px;"><button class="mini-btn btn-del" style="width:40px" onclick="delB(${bi},${m})">削除</button><button class="btn-toggle" onclick="togB(${bi},${m})" style="width:30px;height:30px;border-radius:4px;background:#333;color:#fff;border:1px solid #555;">${b.isOpen ? '－' : '＋'}</button></div></div>`;
        if (b.isOpen) {
            const inner = document.createElement('div');
            if (b.type === 'standard') {
                inner.innerHTML = `<div class="summary-area" style="display:flex;gap:10px;margin-bottom:10px;background:#2a2a2a;padding:5px;border-radius:4px;"><div style="flex:1"><span style="font-size:0.8em;color:#aaa;">残高</span><div id="bal-${bi}"></div></div><div style="flex:1"><span style="font-size:0.8em;color:#aaa;">追加</span><div id="dep-${bi}"></div></div></div>`;
                inner.querySelector(`#bal-${bi}`).appendChild(createM(b.balance, v => { data.years[data.currentYear].months[m][bi].balance = v; save(); }, null, true));
                inner.querySelector(`#dep-${bi}`).appendChild(createM(b.deposit, v => { data.years[data.currentYear].months[m][bi].deposit = v; save(); }, null, true));
            }
            const t = document.createElement('table');
            t.innerHTML = b.type === 'standard' ? `<thead><tr><th class="col-date"></th><th>内容</th><th class="col-money">予定</th><th class="col-money">確定</th><th class="col-btn"></th></tr></thead>` : `<thead><tr><th class="col-date"></th><th>名称</th><th class="col-money">入金</th><th class="col-money">払戻</th><th class="col-btn"></th></tr></thead>`;
            const tb = document.createElement('tbody');
            (b.items || []).forEach((it, ii) => {
                const tr = document.createElement('tr');
                tr.appendChild(createTd(createI(it.date, v => { data.years[data.currentYear].months[m][bi].items[ii].date = v; save(); }, 'date')));
                tr.appendChild(createTd(createT(it.name || it.text, v => { if (b.type === 'standard') data.years[data.currentYear].months[m][bi].items[ii].name = v; else data.years[data.currentYear].months[m][bi].items[ii].text = v; save(); }), '1'));
                if (b.type === 'standard') {
                    tr.appendChild(createMtd(it.plan, v => { data.years[data.currentYear].months[m][bi].items[ii].plan = v; save(); }, bi, m));
                    tr.appendChild(createMtd(it.act, v => { data.years[data.currentYear].months[m][bi].items[ii].act = v; save(); }, bi, m));
                } else {
                    tr.appendChild(createMtd(it.out, v => { data.years[data.currentYear].months[m][bi].items[ii].out = v; save(); }, bi, m));
                    tr.appendChild(createMtd(it.in, v => { data.years[data.currentYear].months[m][bi].items[ii].in = v; save(); }, bi, m));
                }
                const tdCtl = document.createElement('td'); tdCtl.innerHTML = `<div class="ctrl-container">${ii > 0 ? `<button class="mini-btn btn-up" onclick="moveI(${bi},${ii},${m})">▲</button>` : ''}<button class="mini-btn btn-del" onclick="delI(${bi},${ii},${m})">×</button></div>`;
                tr.append(tdCtl); tb.appendChild(tr);
            });
            const totalTr = document.createElement('tr'); totalTr.className = 'total-row';
            totalTr.innerHTML = `<td></td><td class="total-label" style="text-align:center;font-weight:bold;">合計</td><td><div class="total-val-box" id="t1-${bi}">0</div></td><td><div class="total-val-box" id="t2-${bi}">0</div></td><td></td>`;
            tb.appendChild(totalTr); t.appendChild(tb); inner.appendChild(t); const addB = document.createElement('button'); addB.className = 'add-row-btn'; addB.innerText = '追加'; addB.onclick = () => addI(bi, m); inner.appendChild(addB); d.appendChild(inner);
            setTimeout(() => updT(bi, m), 0);
        }
        c.appendChild(d);
    });
}

function createTd(el) { const td = document.createElement('td'); td.appendChild(el); return td; }
function createMtd(v, cb, bi, m) { const td = document.createElement('td'); td.appendChild(createM(v, cb, () => updT(bi, m))); return td; }
function updT(bi, m) {
    const b = data.years[data.currentYear].months[m][bi]; let s1 = 0, s2 = 0;
    (b.items || []).forEach(it => { if (b.type === 'standard') { s1 += Number(it.plan || 0); s2 += Number(it.act || 0); } else { s1 += Number(it.out || 0); s2 += Number(it.in || 0); } });
    const e1 = document.getElementById(`t1-${bi}`), e2 = document.getElementById(`t2-${bi}`);
    if (e1) { e1.innerText = fmt(s1); e1.style.fontSize = s1.toString().length > 10 ? '0.7em' : '0.9em'; }
    if (e2) { e2.innerText = fmt(s2); e2.style.fontSize = s2.toString().length > 10 ? '0.7em' : '0.9em'; }
}
function createI(v, cb, type) {
    const i = document.createElement('input'); i.value = v || "";
    if (type === 'date') { i.className = "date-input"; i.onblur = function () { this.value = fmtD(this.value); cb(this.value); }; }
    else { i.type = "tel"; i.className = "day-input"; i.oninput = function () { this.value = this.value.replace(/[^0-9]/g, '').slice(0, 2); }; i.onblur = function () { cb(this.value); }; }
    return i;
}
function createT(v, cb) {
    const t = document.createElement('textarea'); t.className = "kakeibo-text"; t.value = v || ""; t.rows = 1;
    t.oninput = function () { this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px'; };
    t.onblur = function () { cb(this.value); }; setTimeout(() => t.oninput(), 0); return t;
}
function createM(v, cb, bCb, isB) {
    const i = document.createElement('input'); i.type = "tel"; i.className = isB ? "summary-input" : "money-input";
    i.value = (v === 0 || v === "0") ? "" : Number(v).toLocaleString(); i.onfocus = function () { this.value = this.value.replace(/,/g, ''); this.select(); };
    i.onblur = function () { let n = parseInt(this.value.replace(/[^0-9\-]/g, '')) || 0; cb(n); this.value = n ? n.toLocaleString() : ""; if (bCb) bCb(); }; return i;
}
function fmtD(v) {
    let n = v.replace(/[^0-9]/g, ''); if (n.length === 4) return parseInt(n.slice(0, 2)) + "/" + parseInt(n.slice(2, 4));
    if (n.length === 3) { let m = parseInt(n.slice(0, 2)); if (m >= 10 && m <= 12) return m + "/" + parseInt(n.slice(2, 3)); else return parseInt(n.slice(0, 1)) + "/" + parseInt(n.slice(1, 3)); }
    return v;
}
function fmt(n) { return Number(n).toLocaleString(); }

window.addFixItem = k => { data.years[data.currentYear][k === 'year' ? 'annualYear' : 'annualMonth'].push({ date: "", text: "", cost: 0 }); save(true); renderK(); };
window.moveA = (k, idx) => { const l = data.years[data.currentYear][k]; if (idx > 0) [l[idx], l[idx - 1]] = [l[idx - 1], l[idx]]; save(true); renderK(); };
window.delA = (k, idx) => { if (confirm("消す？")) { data.years[data.currentYear][k].splice(idx, 1); save(true); renderK(); } };
window.toggleFix = t => { if (t === 'year') data.years[data.currentYear].isAYOpen = !data.years[data.currentYear].isAYOpen; else data.years[data.currentYear].isAMOpen = !data.years[data.currentYear].isAMOpen; save(); renderK(); };
window.togB = (bi, m) => { data.years[data.currentYear].months[m][bi].isOpen = !data.years[data.currentYear].months[m][bi].isOpen; save(); renderK(); };
window.addCategoryBlock = t => { const yd = data.years[data.currentYear]; yd.months[yd.activeMonth].push({ type: t, title: t === 'standard' ? 'リスト1' : 'リスト2', isOpen: true, items: [], balance: 0, deposit: 0 }); save(); renderK(); };
window.delB = (bi, m) => { if (confirm("消す？")) { data.years[data.currentYear].months[m].splice(bi, 1); save(); renderK(); } };
window.addI = (bi, m) => { const b = data.years[data.currentYear].months[m][bi]; b.items.push(b.type === 'standard' ? { date: "", name: "", plan: 0, act: 0 } : { date: "", name: "", out: 0, in: 0 }); save(); renderK(); };
window.moveI = (bi, ii, m) => { const l = data.years[data.currentYear].months[m][bi].items; if (ii > 0) [l[ii], l[ii - 1]] = [l[ii - 1], l[ii]]; save(); renderK(); };
window.delI = (bi, ii, m) => { if (confirm("消す？")) { data.years[data.currentYear].months[m][bi].items.splice(ii, 1); save(); renderK(); } };
window.changeYear = () => { data.currentYear = document.getElementById('year-select').value; renderK(); };
window.addNewYear = () => { let n = prompt("西暦？"); if (n && !data.years[n]) { data.years[n] = createNewYear(); data.currentYear = n; save(); renderK(); } };
window.deleteYear = () => { if (Object.keys(data.years).length > 1 && confirm("消す？")) { delete data.years[data.currentYear]; data.currentYear = Object.keys(data.years)[0]; save(); renderK(); } };

window.exportData = () => { document.getElementById('io-box').value = JSON.stringify(data); alert("出力完了"); };
window.importData = () => { try { const s = document.getElementById('io-box').value; if (s) { data = JSON.parse(s); save(); location.reload(); } } catch (e) { alert("エラー"); } };
