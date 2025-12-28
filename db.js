/**
 * データ管理モジュール (db.js)
 */

export function createNewYearData() {
    let months = {};
    for (let i = 1; i <= 12; i++) {
        months[i] = [
            { type: "standard", title: "通帳", isOpen: true, items: [], balance: 0, deposit: 0 },
            { type: "standard", title: "財布", isOpen: true, items: [], balance: 0, deposit: 0 },
            { type: "detail", title: "競馬", isOpen: true, items: [] }
        ];
    }
    return {
        annualYear: [],
        annualMonth: [],
        isAnnualYearOpen: true,
        isAnnualMonthOpen: true,
        activeMonth: 1,
        months: months
    };
}

export const initialData = {
    currentYear: "2025",
    lastViewedTab: "kakeibo",
    years: { "2025": createNewYearData() },
    freeMemos: []
};

export let data = JSON.parse(JSON.stringify(initialData));
export let isDataLoaded = false;

/**
 * データの保存
 * @param {boolean} syncAnnual - 年間・月間固定費を全年に同期するかどうか
 */
export function saveData(syncAnnual = false) {
    const dbRef = window.dbRef;
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
    if (el) {
        el.innerText = "↑ 送信中...";
    }
}

/**
 * アプリの初期化とデータ同期開始
 */
export function initApp() {
    const dbRef = window.dbRef;
    if (!dbRef) return;

    dbRef.on('value', (snapshot) => {
        const val = snapshot.val();
        const statusEl = document.getElementById('sync-status');

        if (val) {
            window.data = val; // グローバル参照も更新
            data = val;
            if (!data.years) data = JSON.parse(JSON.stringify(initialData));
            if (!data.freeMemos) data.freeMemos = [];
        } else {
            const local = localStorage.getItem('kakeiboDataV7_Backup');
            if (local) {
                data = JSON.parse(local);
                if (!data.freeMemos) data.freeMemos = [];
                saveData(false);
            } else {
                data = JSON.parse(JSON.stringify(initialData));
            }
            window.data = data;
        }

        isDataLoaded = true;
        window.isDataLoaded = true;

        // UI更新 (ui.js の switchView を呼び出し)
        if (typeof window.switchView === 'function') {
            window.switchView(data.lastViewedTab || 'kakeibo');
        }

        // メモ帳のレンダリング
        const memoEditor = document.getElementById('memo-editor');
        if (memoEditor && !memoEditor.classList.contains('active')) {
            if (typeof window.renderMemoList === 'function') {
                window.renderMemoList();
            }
        }

        if (statusEl) {
            statusEl.innerText = "● 同期完了";
            setTimeout(() => { statusEl.innerText = ""; }, 2000);
        }
    });
}

// グローバル登録
window.data = data;
window.isDataLoaded = isDataLoaded;
window.saveData = saveData;
window.initApp = initApp;
window.createNewYearData = createNewYearData;
