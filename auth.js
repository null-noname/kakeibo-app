/**
 * 認証基盤モジュール (auth.js)
 */

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

// 初期化
firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
export const db = firebase.database();

auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// --- 認証状態の監視 ---
auth.onAuthStateChanged((user) => {
    const loginScr = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    const statusEl = document.getElementById('sync-status');

    if (user) {
        if (loginScr) loginScr.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';
        // 移行期間中のためグローバルな dbRef を更新
        window.dbRef = db.ref('kakeiboData');
        if (typeof window.initApp === 'function') {
            window.initApp();
        }
    } else {
        if (loginScr) loginScr.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
        if (statusEl) statusEl.innerText = "ログイン待機中";
    }
});

/**
 * Googleログインを実行
 */
export async function loginWithGoogle() {
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
}

/**
 * ログアウトを実行
 */
export function logout() {
    if (confirm("ログアウトしますか？")) {
        auth.signOut().then(() => { location.reload(); });
    }
}

// グローバル登録 (HTMLのonclickイベント等からの呼び出し互換性維持のため)
window.auth = auth;
window.db = db;
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
