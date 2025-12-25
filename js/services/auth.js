import { firebaseConfig } from './config.js';
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

export const loginWithGoogle = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try { await auth.signInWithPopup(provider); }
    catch (e) { alert("ログインエラー: " + e.code); }
};

export const logout = () => {
    if (confirm("ログアウトしますか？")) {
        auth.signOut().then(() => location.reload());
    }
};

export const onAuthStateChanged = (cb) => auth.onAuthStateChanged(cb);
