// kakeibo_V8.11 (Fix Render Error & Smart Date Shorthand)

// --- Service Worker Cleanup ---
if (window.navigator && navigator.serviceWorker) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) { registration.unregister(); }
    });
}

// --- Firebase設定 ---
const firebaseConfig = {
    apiKey: "AIzaSyCT_VvEPzGCPRLLFnzQuwArsYn2JnUR_fg",
    authDomain: "kakeibo-app-92bb4.firebaseapp.com",
    databaseURL: "https://kakeibo-app-92bb4-default-rtdb.firebaseio.com",
    projectId: "kakeibo-app-92bb4",
    storageBucket: "kakeibo-app-92bb4.firebasestorage.app",
    messagingSenderId: "45651637804",
    appId: "1:45651637804:web:f30ba95891d28538a14389"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
let dbRef = null;

auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

const initialData = {
    currentYear: "2025",
    lastViewedTab: "kakeibo",
    years: { "2025": createNewYearData() },
    freeMemos: [],
    todos: []
};

let data = JSON.parse(JSON.stringify(initialData));
let isDataLoaded = false;
let editingMemoId = null;

// --- ログイン処理ロジック ---
auth.getRedirectResult().then((result) => {
    if (result && result.user) {
        console.log("Redirect Login Success");
    }
}).catch((error) => {
    console.error("Redirect Login Error:", error);
});

auth.onAuthStateChanged((user) => {
    const loginScr = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    const statusEl = document.getElementById('sync-status');

    if (user) {
        loginScr.style.display = 'none';
        mainApp.style.display = 'block';
        dbRef = db.ref('kakeiboData');
        initApp();
    } else {
        loginScr.style.display = 'flex';
        mainApp.style.display = 'none';
        if (statusEl) statusEl.innerText = "ログイン待機中";
    }
});

// モジュール形式でのグローバル登録
window.loginWithGoogle = async function () {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        console.error("Auth Error:", error.code);
        if (error.code === 'auth/popup-blocked') {
            alert("ポップアップがブロックされました。ブラウザの設定で許可してください。");
        }
    }
};

window.logout = function () {
    if (confirm("ログアウトしますか？")) {
        auth.signOut().then(() => { location.reload(); });
    }
};

function initApp() {
    if (!dbRef) return;
    dbRef.on('value', (snapshot) => {
        const val = snapshot.val();
        const statusEl = document.getElementById('sync-status');
        if (val) {
            data = val;
            if (!data.years) data = JSON.parse(JSON.stringify(initialData));
            if (!data.freeMemos) data.freeMemos = [];
            if (!data.todos) data.todos = [];
        } else {
            const local = localStorage.getItem('kakeiboDataV7_Backup');
            if (local) {
                data = JSON.parse(local);
                if (!data.freeMemos) data.freeMemos = [];
                if (!data.todos) data.todos = [];
                saveData(false);
            } else {
                data = JSON.parse(JSON.stringify(initialData));
            }
        }
        isDataLoaded = true;
        switchView(data.lastViewedTab || 'kakeibo');
        if (!document.getElementById('memo-editor').classList.contains('active')) renderMemoList();
        renderTodos();
        if (statusEl) { statusEl.innerText = "● 同期完了"; setTimeout(() => { if (statusEl) statusEl.innerText = ""; }, 2000); }
    });
}

function saveData(syncAnnual = false) {
    if (!isDataLoaded || !dbRef) return;
    if (syncAnnual) {
        const currentY = data.years[data.currentYear];
        Object.keys(data.years).forEach(y => {
            if (y !== data.currentYear && data.years[y]) {
                data.years[y].annualYear = JSON.parse(JSON.stringify(currentY.annualYear));
                data.years[y].annualMonth = JSON.parse(JSON.stringify(currentY.annualMonth));
            }
        });
    }
    dbRef.set(data);
    localStorage.setItem('kakeiboDataV7_Backup', JSON.stringify(data));
    const el = document.getElementById('sync-status');
    if (el) el.innerText = "↑ 送信中...";
}

function createNewYearData() {
    let months = {};
    for (let i = 1; i <= 12; i++) {
        months[i] = [
            { type: "standard", title: "通帳", isOpen: true, items: [], balance: 0, deposit: 0 },
            { type: "standard", title: "財布", isOpen: true, items: [], balance: 0, deposit: 0 },
            { type: "detail", title: "競馬", isOpen: true, items: [] }
        ];
    }
    return { annualYear: [], annualMonth: [], isAnnualYearOpen: true, isAnnualMonthOpen: true, activeMonth: 1, months: months };
}

window.switchView = (viewName) => {
    if (viewName !== 'memo') closeMemoEditor();
    ['memo', 'fixed', 'kakeibo', 'save'].forEach(v => {
        const tab = document.getElementById(`tab-${v}`);
        const sec = document.getElementById(`view-${v}`);
        if (tab) tab.classList.remove('active');
        if (sec) sec.classList.remove('active');
    });
    const activeTab = document.getElementById(`tab-${viewName}`);
    const activeSec = document.getElementById(`view-${viewName}`);
    if (activeTab) activeTab.classList.add('active');
    if (activeSec) activeSec.classList.add('active');
    data.lastViewedTab = viewName;
    if (viewName === 'kakeibo' || viewName === 'fixed') renderKakeibo();
    if (viewName === 'memo') renderMemoList();
    if (isDataLoaded) saveData();
};

// メモ帳ロジック
window.addNewMemo = () => {
    const newId = Date.now().toString();
    data.freeMemos.push({ id: newId, title: "新規メモ", body: "", isOpen: true });
    saveData(); openMemoEditor(newId);
};
window.renderMemoList = () => {
    const container = document.getElementById('memo-list-container');
    if (!container) return;
    container.innerHTML = '';
    data.freeMemos.forEach((memo) => {
        const div = document.createElement('div'); div.className = 'memo-card';
        div.innerHTML = `<div class="memo-card-header"><span class="memo-card-title">${memo.title}</span><div class="memo-ctrl-btns">
            <button class="btn-edit-mode" onclick="openMemoEditor('${memo.id}')">✐ 編集</button>
            <button class="btn-icon" onclick="moveMemo('${memo.id}','up')">↑</button>
            <button class="btn-toggle-memo" onclick="toggleMemo('${memo.id}')">${memo.isOpen ? '－' : '＋'}</button>
        </div></div><div class="memo-card-body ${memo.isOpen ? '' : 'collapsed'}">${memo.body}</div>`;
        container.appendChild(div);
    });
};
window.moveMemo = (id, dir) => {
    const i = data.freeMemos.findIndex(m => m.id === id);
    if (dir === 'up' && i > 0) [data.freeMemos[i], data.freeMemos[i - 1]] = [data.freeMemos[i - 1], data.freeMemos[i]];
    saveData(); renderMemoList();
};
window.toggleMemo = (id) => {
    const m = data.freeMemos.find(m => m.id === id);
    if (m) { m.isOpen = !m.isOpen; saveData(); renderMemoList(); }
};
window.openMemoEditor = (id) => {
    editingMemoId = id; const m = data.freeMemos.find(m => m.id === id); if (!m) return;
    document.getElementById('memo-list-view').style.display = 'none';
    document.getElementById('memo-editor').classList.add('active');
    document.getElementById('memo-edit-title').value = m.title;
    document.getElementById('memo-edit-body').value = m.body;
};
window.closeMemoEditor = () => {
    saveCurrentMemo(); editingMemoId = null;
    document.getElementById('memo-editor').classList.remove('active');
    document.getElementById('memo-list-view').style.display = 'block';
    renderMemoList();
};
window.saveCurrentMemo = () => {
    if (!editingMemoId) return; const m = data.freeMemos.find(m => m.id === editingMemoId);
    if (m) { m.title = document.getElementById('memo-edit-title').value; m.body = document.getElementById('memo-edit-body').value; saveData(); }
};
window.deleteCurrentMemo = () => {
    if (confirm("削除？")) { data.freeMemos = data.freeMemos.filter(m => m.id !== editingMemoId); saveData(); closeMemoEditor(); }
};

// --- ToDoロジック ---
window.addTodo = () => {
    const input = document.getElementById('todo-input');
    const text = input.value.trim();
    if (!text) return;
    const newTodo = { id: Date.now().toString(), text: text, completed: false };
    data.todos.push(newTodo);
    input.value = '';
    saveData();
    renderTodos();
};

window.renderTodos = () => {
    const list = document.getElementById('todo-list');
    if (!list) return;
    list.innerHTML = '';
    data.todos.forEach(todo => {
        const div = document.createElement('div');
        div.className = 'todo-item';
        div.innerHTML = `
            <div class="todo-check-wrapper">
                <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodo('${todo.id}')">
                <div class="todo-checkmark" onclick="this.previousElementSibling.click()"></div>
            </div>
            <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
            <button class="btn-todo-del" onclick="deleteTodo('${todo.id}')">×</button>
        `;
        list.appendChild(div);
    });
};

window.toggleTodo = (id) => {
    const todo = data.todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveData();
        renderTodos();
    }
};

window.deleteTodo = (id) => {
    if (confirm("タスクを削除しますか？")) {
        data.todos = data.todos.filter(t => t.id !== id);
        saveData();
        renderTodos();
    }
};


// 家計簿描画ロジック
function renderKakeibo() {
    const yearSelect = document.getElementById('year-select');
    if (!yearSelect) return;
    yearSelect.innerHTML = '';
    Object.keys(data.years).sort().forEach(y => {
        const op = document.createElement('option'); op.value = y; op.innerText = y + "年";
        if (y === data.currentYear) op.selected = true; yearSelect.appendChild(op);
    });
    const yd = data.years[data.currentYear];
    const activeMonth = yd.activeMonth || 1;
    document.getElementById('btn-annual-year').innerText = yd.isAnnualYearOpen ? '－' : '＋';
    document.getElementById('content-annual-year').className = yd.isAnnualYearOpen ? '' : 'hidden';
    document.getElementById('btn-annual-month').innerText = yd.isAnnualMonthOpen ? '－' : '＋';
    document.getElementById('content-annual-month').className = yd.isAnnualMonthOpen ? '' : 'hidden';
    renderAnnualTable('annual-table-year', yd.annualYear, 'annualYear');
    renderAnnualTable('annual-table-month', yd.annualMonth, 'annualMonth');
    const tabs = document.getElementById('month-tabs'); tabs.innerHTML = '';
    for (let i = 1; i <= 12; i++) {
        const d = document.createElement('div'); d.className = `month-btn ${activeMonth === i ? 'active' : ''}`;
        d.innerText = i + "月"; d.onclick = () => { yd.activeMonth = i; saveData(); renderKakeibo(); }; tabs.appendChild(d);
    }
    document.getElementById('monthly-header-title').innerText = `${activeMonth}月の収支`;
    renderMonthlyBlocks(yd, activeMonth);
}

function renderAnnualTable(cid, list, key) {
    const c = document.getElementById(cid); if (!c) return; c.innerHTML = '';
    const t = document.createElement('table');
    t.innerHTML = `<thead><tr><th class="col-date">日付</th><th>内容</th><th class="col-money">金額</th><th class="col-btn"></th></tr></thead>`;
    const tb = document.createElement('tbody');
    (list || []).forEach((item, idx) => {
        const tr = document.createElement('tr');
        const tdD = document.createElement('td'); tdD.appendChild(createInp(item.date, v => { data.years[data.currentYear][key][idx].date = v; saveData(true); }, key === 'annualYear' ? 'date' : 'day'));
        const tdT = document.createElement('td'); tdT.appendChild(createTxt(item.text, v => { data.years[data.currentYear][key][idx].text = v; saveData(true); }));
        const tdC = document.createElement('td'); tdC.appendChild(createMon(item.cost, v => { data.years[data.currentYear][key][idx].cost = v; saveData(true); }));
        const tdCtl = document.createElement('td');
        tdCtl.innerHTML = `<div class="ctrl-container">
            ${idx > 0 ? `<button class="mini-btn btn-up" onclick="moveAnn('${key}',${idx})">▲</button>` : `<div style="width:30px"></div>`}
            <button class="mini-btn btn-del" onclick="delAnn('${key}',${idx})">×</button>
        </div>`;
        tr.append(tdD, tdT, tdC, tdCtl); tb.appendChild(tr);
    });
    t.appendChild(tb); c.appendChild(t);
}

function renderMonthlyBlocks(yd, m) {
    const c = document.getElementById('monthly-container'); if (!c) return; c.innerHTML = '';
    (yd.months[m] || []).forEach((b, bi) => {
        const d = document.createElement('div'); d.className = 'category-block';
        d.innerHTML = `<div class="cat-header"><input type="text" class="cat-title-input" value="${b.title}" onchange="data.years[data.currentYear].months[${m}][${bi}].title=this.value;saveData()"><div style="display:flex;gap:5px;"><button class="btn-red" onclick="delBk(${bi},${m})">削除</button><button class="btn-toggle" onclick="togBk(${bi},${m})">${b.isOpen ? '－' : '＋'}</button></div></div>`;
        if (b.isOpen) {
            const inner = document.createElement('div');
            if (b.type === 'standard') {
                inner.innerHTML = `<div class="summary-area"><div class="summary-item"><span class="summary-label">残高</span><div id="bal-${bi}"></div></div><div class="summary-item"><span class="summary-label">入れる額</span><div id="dep-${bi}"></div></div></div>`;
                const balBox = inner.querySelector(`#bal-${bi}`);
                const depBox = inner.querySelector(`#dep-${bi}`);
                balBox.appendChild(createMon(b.balance, v => { data.years[data.currentYear].months[m][bi].balance = v; saveData(); }, null, true));
                depBox.appendChild(createMon(b.deposit, v => { data.years[data.currentYear].months[m][bi].deposit = v; saveData(); }, null, true));
            }
            const t = document.createElement('table');
            t.innerHTML = b.type === 'standard' ? `<thead><tr><th class="col-date">日付</th><th>内容</th><th class="col-money">予定</th><th class="col-money">確定</th><th class="col-btn"></th></tr></thead>` : `<thead><tr><th class="col-date">日付</th><th>重賞名</th><th class="col-money">入金</th><th class="col-money">払戻</th><th class="col-btn"></th></tr></thead>`;
            const tb = document.createElement('tbody');
            (b.items || []).forEach((it, ii) => {
                const tr = document.createElement('tr');
                const tdD = document.createElement('td'); tdD.appendChild(createInp(it.date, v => { data.years[data.currentYear].months[m][bi].items[ii].date = v; saveData(); }, 'date'));
                const tdN = document.createElement('td'); tdN.appendChild(createTxt(it.name, v => { data.years[data.currentYear].months[m][bi].items[ii].name = v; saveData(); }));
                tr.append(tdD, tdN);
                if (b.type === 'standard') {
                    tr.appendChild(createMonTd(it.plan, v => { data.years[data.currentYear].months[m][bi].items[ii].plan = v; saveData(); }, bi, m));
                    tr.appendChild(createMonTd(it.act, v => { data.years[data.currentYear].months[m][bi].items[ii].act = v; saveData(); }, bi, m));
                } else {
                    tr.appendChild(createMonTd(it.out, v => { data.years[data.currentYear].months[m][bi].items[ii].out = v; saveData(); }, bi, m));
                    tr.appendChild(createMonTd(it.in, v => { data.years[data.currentYear].months[m][bi].items[ii].in = v; saveData(); }, bi, m));
                }
                const tdCtl = document.createElement('td');
                tdCtl.innerHTML = `<div class="ctrl-container">
                    ${ii > 0 ? `<button class="mini-btn btn-up" onclick="moveIt(${bi},${ii},${m},'up')">▲</button>` : `<div style="width:30px"></div>`}
                    <button class="mini-btn btn-del" onclick="delIt(${bi},${ii},${m})">×</button>
                </div>`;
                tr.append(tdCtl); tb.appendChild(tr);
            });
            const totalTr = document.createElement('tr'); totalTr.className = 'total-row';
            totalTr.innerHTML = b.type === 'standard' ? `<td></td><td class="total-label">合計</td><td><div class="total-val-box" id="t1-${bi}">0</div></td><td><div class="total-val-box" id="t2-${bi}">0</div></td><td></td>` : `<td></td><td class="total-label">合計</td><td><div class="total-val-box" id="t1-${bi}">0</div></td><td><div class="total-val-box" id="t2-${bi}">0</div></td><td></td>`;
            tb.appendChild(totalTr); t.appendChild(tb); inner.appendChild(t); inner.appendChild(createAddRowBtn(() => addIt(bi, m))); d.appendChild(inner);
            setTimeout(() => updateTotalDisplay(bi, m), 0);
        }
        c.appendChild(d);
    });
}

function createMonTd(v, cb, bi, m) { const td = document.createElement('td'); td.appendChild(createMon(v, cb, () => updateTotalDisplay(bi, m))); return td; }
function updateTotalDisplay(bi, m) {
    const b = data.years[data.currentYear].months[m][bi]; let s1 = 0, s2 = 0;
    (b.items || []).forEach(it => { if (b.type === 'standard') { s1 += Number(it.plan || 0); s2 += Number(it.act || 0); } else { s1 += Number(it.out || 0); s2 += Number(it.in || 0); } });
    const e1 = document.getElementById(`t1-${bi}`), e2 = document.getElementById(`t2-${bi}`);
    if (e1) e1.innerText = formatNum(s1); if (e2) e2.innerText = formatNum(s2);
}
function createInp(v, cb, type) {
    const i = document.createElement('input'); i.value = v || "";
    if (type === 'date') { i.className = "date-input"; i.onblur = function () { this.value = formatDateAnnual(this.value); cb(this.value); }; }
    else { i.type = "tel"; i.className = "day-input"; i.oninput = function () { this.value = this.value.replace(/[^0-9]/g, '').slice(0, 2); }; i.onblur = function () { cb(this.value); }; }
    return i;
}
function createTxt(v, cb) {
    const t = document.createElement('textarea'); t.className = "kakeibo-text"; t.value = v || ""; t.rows = 1;
    t.oninput = function () { this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px'; };
    t.onblur = function () { cb(this.value); }; setTimeout(() => t.oninput(), 0); return t;
}
function createMon(v, cb, bCb, isBig) {
    const i = document.createElement('input'); i.type = "tel"; i.className = isBig ? "summary-input" : "money-input";
    i.value = (v === 0 || v === "0") ? "" : Number(v).toLocaleString();
    i.onfocus = function () { this.value = this.value.replace(/,/g, ''); this.select(); };
    i.onblur = function () {
        let n = parseInt(this.value.replace(/[^0-9\-]/g, '')) || 0;
        cb(n); this.value = n ? n.toLocaleString() : ""; if (bCb) bCb();
    }; return i;
}
function createAddRowBtn(fn) { const b = document.createElement('button'); b.className = 'add-row-btn'; b.innerText = '追加'; b.onclick = fn; return b; }

function formatDateAnnual(v) {
    const nums = v.replace(/[^0-9]/g, '');
    if (nums.length === 4) return parseInt(nums.slice(0, 2)) + "/" + parseInt(nums.slice(2, 4));
    if (nums.length === 3) {
        let m12 = parseInt(nums.slice(0, 2));
        if (m12 >= 10 && m12 <= 12) {
            return m12 + "/" + parseInt(nums.slice(2, 3));
        } else {
            return parseInt(nums.slice(0, 1)) + "/" + parseInt(nums.slice(1, 3));
        }
    }
    return v;
}

function formatNum(n) { return Number(n).toLocaleString(); }

window.addAnnualItem = (k) => { const key = k === 'year' ? 'annualYear' : 'annualMonth'; data.years[data.currentYear][key].push({ date: "", text: "", cost: 0 }); saveData(true); renderKakeibo(); };
window.moveAnn = (k, idx) => { const l = data.years[data.currentYear][k]; if (idx > 0) [l[idx], l[idx - 1]] = [l[idx - 1], l[idx]]; saveData(true); renderKakeibo(); };
window.delAnn = (k, idx) => { if (confirm("削除？")) { data.years[data.currentYear][k].splice(idx, 1); saveData(true); renderKakeibo(); } };
window.toggleAnnualSub = (t) => { if (t === 'year') data.years[data.currentYear].isAnnualYearOpen = !data.years[data.currentYear].isAnnualYearOpen; else data.years[data.currentYear].isAnnualMonthOpen = !data.years[data.currentYear].isAnnualMonthOpen; saveData(); renderKakeibo(); };
window.togBk = (bi, m) => { data.years[data.currentYear].months[m][bi].isOpen = !data.years[data.currentYear].months[m][bi].isOpen; saveData(); renderKakeibo(); };
window.addCategoryBlock = (t) => { const yd = data.years[data.currentYear]; const m = yd.activeMonth; data.years[data.currentYear].months[m].push({ type: t, title: t === 'standard' ? 'リスト1' : 'リスト2', isOpen: true, items: [], balance: 0, deposit: 0 }); saveData(); renderKakeibo(); };
window.delBk = (bi, m) => { if (confirm("削除？")) { data.years[data.currentYear].months[m].splice(bi, 1); saveData(); renderKakeibo(); } };
window.addIt = (bi, m) => { const b = data.years[data.currentYear].months[m][bi]; b.items.push(b.type === 'standard' ? { date: "", name: "", plan: 0, act: 0 } : { date: "", name: "", out: 0, in: 0 }); saveData(); renderKakeibo(); };
window.moveIt = (bi, ii, m, dir) => { const l = data.years[data.currentYear].months[m][bi].items; if (dir === 'up' && ii > 0) [l[ii], l[ii - 1]] = [l[ii - 1], l[ii]]; saveData(); renderKakeibo(); };
window.delIt = (bi, ii, m) => { if (confirm("削除？")) { data.years[data.currentYear].months[m][bi].items.splice(ii, 1); saveData(); renderKakeibo(); } };
window.changeYear = () => { data.currentYear = document.getElementById('year-select').value; renderKakeibo(); };
window.addNewYear = () => { let n = prompt("西暦を入力"); if (n && !data.years[n]) { data.years[n] = createNewYearData(); data.currentYear = n; saveData(); renderKakeibo(); } };
window.deleteYear = () => { if (Object.keys(data.years).length > 1 && confirm("削除？")) { delete data.years[data.currentYear]; data.currentYear = Object.keys(data.years)[0]; saveData(); renderKakeibo(); } };

window.shareDataText = async () => { const s = JSON.stringify(data); if (navigator.share) await navigator.share({ title: '家計簿', text: s }); else alert(s); };
window.exportDataToClipboard = () => { navigator.clipboard.writeText(JSON.stringify(data)); alert("コピー完了"); };
window.importDataFromText = () => { try { const s = document.getElementById('backup-box').value; if (s) { data = JSON.parse(s); saveData(); location.reload(); } } catch (e) { alert("エラー"); } };

const initialSyncStatus = document.getElementById('sync-status');
if (initialSyncStatus) initialSyncStatus.innerText = "接続中...";
